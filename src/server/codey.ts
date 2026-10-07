import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';
import { getAnalytics } from './analytics.ts';
import { getAllForecasts } from './forecasting.ts';
import { getDomainMarketTrends } from './trends.ts';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface CodeyChatRequest {
  message: string;
  history?: { role: 'user' | 'model' | 'assistant'; content?: string; parts?: { text: string }[] }[];
}

export interface CodeyChatResponse {
  reply: string;
  contextSummary: {
    businessName: string;
    businessDomain: string;
    totalProducts: number;
    totalSalesInr: string;
    totalProfitInr: string;
    lowStockCount: number;
    criticalStockoutCount: number;
    heroProductsCount: number;
  };
}

export async function askCodey(req: CodeyChatRequest): Promise<CodeyChatResponse> {
  // 1. Fetch current business profile
  const seller = db.prepare('SELECT * FROM sellers LIMIT 1').get() as {
    name: string;
    business_domain: string;
    custom_domain?: string;
    city: string;
    state: string;
    country: string;
    currency: string;
  } | undefined;

  const businessName = seller?.name || 'InSight Retail Store';
  const businessDomain = seller?.business_domain || 'Kirana / Grocery';
  const customDomain = seller?.custom_domain;
  const effectiveDomain = customDomain ? `${businessDomain} (${customDomain})` : businessDomain;

  // 2. Fetch inventory & analytics from live SQLite database
  const analytics = getAnalytics('all');
  const forecasts = getAllForecasts();
  const trends = getDomainMarketTrends(businessDomain);

  // Critical restock alerts & low stock items
  const criticalForecasts = forecasts.filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'WARNING');
  const lowStockItems = forecasts.filter(f => f.currentStock <= f.reorderThreshold);

  // Format monetary numbers Indian style
  const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  // 3. Construct strictly grounded system instruction and business context
  const contextText = `
========================================
SELLER BUSINESS PROFILE:
Store Name: ${businessName}
Selected Business Domain: ${effectiveDomain}
Location: ${seller?.city || 'Lucknow'}, ${seller?.state || 'Uttar Pradesh'}, India
Currency: Indian Rupees (INR / ₹)

CURRENT INVENTORY OVERVIEW:
Total Catalog Products: ${analytics.totalProductsCount}
Products in Low Stock: ${analytics.lowStockCount}
Products with Imminent Stockout (<7 days): ${criticalForecasts.length}

ACTUAL FINANCIAL METRICS (From Verified Database Records):
Total Revenue (All-time): ${formatInr(analytics.totalSales)}
Total Profit (All-time): ${formatInr(analytics.totalProfit)}
Total Units Sold: ${analytics.totalUnitsSold.toLocaleString('en-IN')} units
Overall Profit Margin: ${analytics.profitMarginPercent}%

TOP HERO PRODUCTS (Ranked by Revenue & Profit Contribution):
${analytics.heroProducts.length > 0 ? analytics.heroProducts.slice(0, 6).map(h => 
  `- Rank #${h.rank}: ${h.name} (${h.category}) | Sold: ${h.unitsSold} units | Revenue: ${formatInr(h.revenue)} | Profit: ${formatInr(h.profit)} (Margin: ${h.profitMarginPercent}%)`
).join('\n') : 'No hero products identified yet due to insufficient sales data.'}

CATEGORY PERFORMANCE:
${analytics.categoryBreakdown.length > 0 ? analytics.categoryBreakdown.map(c => 
  `- ${c.category}: Revenue: ${formatInr(c.revenue)} | Profit: ${formatInr(c.profit)} | Units: ${c.unitsSold} | Products: ${c.productCount}`
).join('\n') : 'No category data recorded yet.'}

DEMAND FORECAST & STOCKOUT ALERTS:
${forecasts.length > 0 ? forecasts.slice(0, 10).map(f => {
  if (!f.hasEnoughHistory) {
    return `- ${f.productName}: Current Stock: ${f.currentStock} units | Status: Insufficient sales history to forecast.`;
  }
  return `- ${f.productName}: Current Stock: ${f.currentStock} units | Sales Velocity: ${f.salesVelocity} units/day | Estimated Days Until Stockout: ${f.estimatedDaysUntilStockout ?? 'N/A'} days | Recommended Reorder Qty: ${f.recommendedReorderQuantity ?? 'N/A'} units | Risk Level: ${f.riskLevel}`;
}).join('\n') : 'No forecast data available.'}

EXTERNAL INDIA MARKET TREND SIGNALS (Google Trends India geo="IN" - Supplementary Market Context Only):
${trends.map(t => 
  `- [External Market Trend] ${t.category} (Keywords: "${t.keyword}"): Direction: ${t.trendDirection} | Growth: +${t.growthPercentage}% | Note: ${t.insightSummary}`
).join('\n')}
========================================
`;

  const systemInstruction = `
You are Codey, the expert AI Business Assistant integrated directly into "InSight" - the Smart Inventory Management System for Indian small and medium-sized retailers.

CORE IDENTITY & TONE:
- Professional, knowledgeable, warm, and highly practical for an Indian retail shopkeeper or business owner.
- Use Indian retail terminology naturally where appropriate (e.g. Kirana, FMCG, Atta, Dal, Wholesale, Margin, Stockout, Restock).
- ALWAYS use Indian Rupee currency (₹ / INR). Never mention dollars ($).
- Prefer Indian date formats (DD/MM/YYYY) and Indian number formatting conventions (e.g. Lakhs, ₹1,25,000).

ABSOLUTE ANTI-HALLUCINATION RULES:
1. You MUST NEVER invent or fabricate sales, stock levels, revenue, profit, margins, products, or fake customer purchases.
2. Every number, quantity, and metric you state must come directly from the provided SELLER BUSINESS PROFILE and database context above.
3. If the user asks about a product or period for which there is insufficient data, you MUST explicitly state: "The available data is insufficient to answer this reliably." Do NOT guess or hallucinate.
4. Distinguish clearly between the seller's actual operational sales data and external Google Trends market signals. Never present external market trends as the seller's actual sales.
5. Provide actionable, concise, and structured guidance. Format key lists as clean markdown tables or bulleted points with bold headers so they are easy to read.
`;

  // Build conversational turns if history is provided
  let conversationHistoryText = '';
  if (req.history && Array.isArray(req.history) && req.history.length > 0) {
    const recentHistory = req.history.slice(-6);
    conversationHistoryText = '\nRECENT CONVERSATION HISTORY:\n' + recentHistory.map(h => {
      const roleName = h.role === 'user' ? 'User' : 'Codey';
      const msgText = h.content || (h.parts && h.parts[0]?.text) || '';
      return `${roleName}: ${msgText}`;
    }).join('\n') + '\n';
  }

  const userPrompt = `${contextText}${conversationHistoryText}\nUSER QUESTION:\n${req.message}`;

  // Candidate models from gemini-api skill: 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'
  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let rawReply: string | null = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.2, // Low temperature for factual accuracy
        },
      });

      if (response && response.text) {
        rawReply = response.text;
        break;
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} encountered issue:`, err?.message || err);
      // Continue to next candidate model
    }
  }

  // Smart question-aware grounding fallback if Gemini is completely unavailable or rate-limited
  const buildSmartFallback = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Restock / Reorder query
    if (q.includes('restock') || q.includes('reorder') || q.includes('order') || q.includes('buy')) {
      const urgent = forecasts.filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'WARNING' || f.currentStock <= f.reorderThreshold);
      if (urgent.length === 0) {
        return `Namaste! Excellent news for **${businessName}**: all catalog items currently have healthy stock levels above their reorder thresholds. No immediate restock orders are mandatory today.`;
      }
      const tableRows = urgent.slice(0, 5).map((f, i) => 
        `| **#${i+1}** | ${f.productName} | ${f.currentStock} units | ${f.salesVelocity} units/day | ${f.estimatedDaysUntilStockout !== null ? `${f.estimatedDaysUntilStockout} days` : 'Immediate'} | **+${f.recommendedReorderQuantity || 20} units** |`
      ).join('\n');

      return `Namaste! Here are the **Urgent Restock Recommendations** for **${businessName}** based on current sales velocity:\n\n| # | Product Name | Current Stock | Daily Velocity | Stockout In | Recommended Order |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n${tableRows}\n\n**Action Plan:** Place supplier orders for items with under 7 days of runway to prevent missed customer sales during peak shopping hours.`;
    }

    // 2. Profit / Margin query
    if (q.includes('profit') || q.includes('margin') || q.includes('money') || q.includes('earn')) {
      const topProfitable = [...analytics.heroProducts].sort((a, b) => b.profit - a.profit).slice(0, 5);
      const tableRows = topProfitable.map((h, i) =>
        `| **#${i+1}** | ${h.name} | ${formatInr(h.profit)} | ${formatInr(h.revenue)} | **${h.profitMarginPercent}%** |`
      ).join('\n');

      return `Namaste! Here is your **Store Profit Analysis** for **${businessName}**:\n\n- **Total Net Profit Realized:** ${formatInr(analytics.totalProfit)}\n- **Overall Store Margin:** **${analytics.profitMarginPercent}%** across ${analytics.totalUnitsSold.toLocaleString('en-IN')} units sold.\n\n### Top Profit Contributing SKUs:\n| Rank | Product Name | Realized Profit | Revenue | Margin |\n| :--- | :--- | :--- | :--- | :--- |\n${tableRows}\n\n**Insight:** Focus display placement and customer recommendations around your highest margin items to maximize daily take-home earnings.`;
    }

    // 3. Hero products / Best sellers query
    if (q.includes('hero') || q.includes('top') || q.includes('best') || q.includes('fast moving') || q.includes('seller')) {
      if (analytics.heroProducts.length === 0) {
        return `Namaste! As more sales transactions are recorded at **${businessName}**, the algorithmic Hero Product rankings will be automatically updated here.`;
      }
      const tableRows = analytics.heroProducts.slice(0, 5).map(h =>
        `| **#${h.rank}** | ${h.name} | ${h.unitsSold} units | ${formatInr(h.revenue)} | ${formatInr(h.profit)} | ${h.profitMarginPercent}% |`
      ).join('\n');

      return `Namaste! Here are your verified **Top Hero Products** at **${businessName}**, ranked by revenue and profit impact:\n\n| Rank | Product Name | Units Sold | Total Revenue | Realized Profit | Margin |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n${tableRows}\n\n**Key Takeaway:** Your #1 driver is **${analytics.heroProducts[0]?.name}**, generating ${formatInr(analytics.heroProducts[0]?.revenue || 0)} in sales. Ensure you never run out of this core staple!`;
    }

    // 4. Stockout / Risk query
    if (q.includes('stockout') || q.includes('risk') || q.includes('critical') || q.includes('alert') || q.includes('empty')) {
      const critical = forecasts.filter(f => f.riskLevel === 'CRITICAL' || f.currentStock <= 0);
      if (critical.length === 0) {
        return `Namaste! Zero products at **${businessName}** are currently in a zero-stock or emergency stockout state. You have ${analytics.lowStockCount} items approaching low stock thresholds.`;
      }
      const list = critical.map(c => `- **${c.productName}**: ${c.currentStock} units left (${c.estimatedDaysUntilStockout ?? 0} days until empty). Recommended reorder: **${c.recommendedReorderQuantity || 20} units**.`);
      return `Namaste! Here are the products at **imminent stockout risk** for **${businessName}**:\n\n${list.join('\n')}\n\nPrioritize placing supplier calls today to replenish these items.`;
    }

    // 5. Market trends / external query
    if (q.includes('trend') || q.includes('market') || q.includes('google') || q.includes('external')) {
      const trendList = trends.slice(0, 4).map(t => `- **${t.category}** (keyword: *"${t.keyword}"*): **+${t.growthPercentage}% growth** across India (${t.trendDirection}). *${t.insightSummary}*`);
      return `Namaste! Here are the supplementary **Google Trends India signals (geo="IN")** for **${effectiveDomain}**:\n\n${trendList.join('\n')}\n\n*Note:* These indicate consumer search momentum across India. Stock according to your local customer footfall.`;
    }

    // 6. General / Summary query
    return `Namaste! Here is a live performance snapshot for **${businessName}** in ${seller?.city || 'Lucknow'}:\n\n- **Active Catalog SKUs:** ${analytics.totalProductsCount} products\n- **Total Gross Sales:** ${formatInr(analytics.totalSales)}\n- **Realized Net Profit:** ${formatInr(analytics.totalProfit)} (${analytics.profitMarginPercent}% margin)\n- **Low Stock Items:** ${analytics.lowStockCount} items\n- **Urgent Restock Alerts:** ${criticalForecasts.length} items with < 7 days of runway\n- **Top SKU:** ${analytics.heroProducts[0]?.name || 'N/A'}\n\nHow else can I assist your store operations today? Ask about restocks, profit margins, hero products, or external market trends!`;
  };

  try {
    const reply = rawReply || buildSmartFallback(req.message);

    // Store in codey_chats table
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    try {
      db.prepare(`
        INSERT INTO codey_chats (id, seller_id, role, message, context_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(chatId, seller?.name || 'default', 'model', reply, JSON.stringify({ domain: businessDomain }), nowIso);
    } catch (dbErr) {
      console.warn('Failed to persist chat log:', dbErr);
    }

    return {
      reply,
      contextSummary: {
        businessName,
        businessDomain: effectiveDomain,
        totalProducts: analytics.totalProductsCount,
        totalSalesInr: formatInr(analytics.totalSales),
        totalProfitInr: formatInr(analytics.totalProfit),
        lowStockCount: analytics.lowStockCount,
        criticalStockoutCount: criticalForecasts.length,
        heroProductsCount: analytics.heroProducts.length,
      },
    };
  } catch (err: unknown) {
    console.error('Error constructing Codey response:', err);
    throw err;
  }
}
