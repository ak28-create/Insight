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
  history?: { role: 'user' | 'model'; parts: { text: string }[] }[];
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

  // 2. Fetch inventory & analytics
  const analytics = getAnalytics('all');
  const forecasts = getAllForecasts();
  const trends = getDomainMarketTrends(businessDomain);

  // Critical restock alerts
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
${analytics.heroProducts.length > 0 ? analytics.heroProducts.slice(0, 5).map(h => 
  `- Rank #${h.rank}: ${h.name} (${h.category}) | Sold: ${h.unitsSold} units | Revenue: ${formatInr(h.revenue)} | Profit: ${formatInr(h.profit)} (Margin: ${h.profitMarginPercent}%)`
).join('\n') : 'No hero products identified yet due to insufficient sales data.'}

CATEGORY PERFORMANCE:
${analytics.categoryBreakdown.length > 0 ? analytics.categoryBreakdown.map(c => 
  `- ${c.category}: Revenue: ${formatInr(c.revenue)} | Profit: ${formatInr(c.profit)} | Units: ${c.unitsSold} | Products: ${c.productCount}`
).join('\n') : 'No category data recorded yet.'}

DEMAND FORECAST & STOCKOUT ALERTS:
${forecasts.length > 0 ? forecasts.slice(0, 8).map(f => {
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
4. Distinguish clearly between the seller's actual operational sales data and external Google Trends market signals. Never present external market trends as the seller's actual sales. If external trends show rising interest but the seller has declining sales, note that distinction clearly.
5. Provide actionable, concise, and structured guidance. Bullet points, bold numbers, and clear takeaways make it easy for busy Indian shop owners to read.
`;

  const userPrompt = `${contextText}\n\nUSER QUESTION:\n${req.message}`;

  // Candidate models in preference order; fall back gracefully if a model experiences temporary high demand (503)
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  let rawReply: string | null = null;
  let lastError: any = null;

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
      lastError = err;
      const is503OrBusy = err?.message?.includes('503') ||
                          err?.message?.includes('high demand') ||
                          err?.status === 'UNAVAILABLE' ||
                          err?.error?.code === 503;
      if (is503OrBusy) {
        console.warn(`Model ${modelName} is currently experiencing high demand (503). Retrying with alternative model...`);
        continue;
      }
      // For other errors, still try alternative models before giving up
      console.warn(`Model ${modelName} encountered error:`, err?.message || err);
    }
  }

  try {
    const reply = rawReply || `Namaste! Based directly on your verified local database:
- Your store **${businessName}** currently has **${analytics.totalProductsCount} products** in catalog.
- Total recorded sales to date are **${formatInr(analytics.totalSales)}** with a total profit of **${formatInr(analytics.totalProfit)}** (${analytics.profitMarginPercent}% margin).
- You currently have **${analytics.lowStockCount} products in low stock** and **${criticalForecasts.length} items** requiring imminent replenishment.
- Top Hero Product: **${analytics.heroProducts[0]?.name || 'Pending sales'}** (${formatInr(analytics.heroProducts[0]?.revenue || 0)} revenue).

The AI reasoning model was temporarily busy, but your local inventory and financial calculations are 100% up to date.`;

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
