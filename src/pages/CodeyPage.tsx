import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Database,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Package,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { CodeyMessage, SellerProfile } from '../types';

interface CodeyPageProps {
  messages: CodeyMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  isLoading: boolean;
  profile: SellerProfile | null;
}

// Helper to render Markdown cleanly into styled HTML elements (handles tables, bold text, bullet points, headers)
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  // Check if text contains markdown table
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableLines: string[] = [];
  let inTable = false;

  const flushTable = (keyPrefix: string) => {
    if (tableLines.length >= 2) {
      const headerLine = tableLines[0];
      const dataLines = tableLines.slice(2); // skip separator line |:---|

      const parseCells = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());
      const headers = parseCells(headerLine);

      elements.push(
        <div key={`${keyPrefix}-table`} className="my-3 overflow-x-auto rounded-xl border border-[#e3e8ee] shadow-2xs">
          <table className="w-full text-left text-xs divide-y divide-[#e3e8ee]">
            <thead className="bg-[#f6f9fc]">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-[11px] font-bold text-[#0a2540] uppercase tracking-wider">
                    {renderInlineFormatted(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8ee] bg-white">
              {dataLines.map((row, rIdx) => {
                const cells = parseCells(row);
                return (
                  <tr key={rIdx} className="hover:bg-[#f6f9fc]/80 transition-colors">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-[#0a2540] font-normal">
                        {renderInlineFormatted(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    tableLines = [];
    inTable = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableLines.push(trimmed);
      return;
    } else if (inTable) {
      flushTable(`tbl-${idx}`);
    }

    // Section header (### or ##)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="font-bold text-[#0a2540] text-xs pt-2 pb-0.5 tracking-tight">
          {renderInlineFormatted(trimmed.replace('### ', ''))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="font-bold text-[#0a2540] text-sm pt-2.5 pb-1 tracking-tight">
          {renderInlineFormatted(trimmed.replace('## ', ''))}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet list item
      const itemContent = trimmed.substring(2);
      elements.push(
        <div key={idx} className="flex items-start gap-2 py-0.5 text-xs text-[#0a2540]">
          <span className="text-[#635bff] font-bold text-sm leading-none shrink-0 mt-0.5">&bull;</span>
          <div className="flex-1 leading-relaxed">{renderInlineFormatted(itemContent)}</div>
        </div>
      );
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1.5" />);
    } else {
      // Regular paragraph
      elements.push(
        <p key={idx} className="text-xs leading-relaxed text-[#0a2540]">
          {renderInlineFormatted(trimmed)}
        </p>
      );
    }
  });

  if (inTable) {
    flushTable('tbl-end');
  }

  return <div className="space-y-1">{elements}</div>;
};

// Helper for inline **bold** and *italic* formatting
function renderInlineFormatted(str: string): React.ReactNode {
  // Handle **bold** segments
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[#0a2540]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Handle *italic* segments
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-[#425466]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export const CodeyPage: React.FC<CodeyPageProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  profile,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sampleQuestions = [
    'What should I restock this week?',
    'Which products generate the most profit?',
    'What are my Top Hero Products?',
    'Which items have critical stockout risk?',
    'Give me a summary of store performance',
    'How do external market trends apply to my catalog?',
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Header bar in Stripe Style */}
      <div className="flex items-center justify-between border-b border-[#e3e8ee] pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#635bff] to-[#00d4ff] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(99,91,255,0.3)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0a2540] tracking-tight">Codey AI Assistant</h2>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20">
                Grounded SMB Engine
              </span>
            </div>
            <p className="text-xs text-[#425466]">
              Real-time conversational intelligence for {profile?.name || 'Sharma General Store'} · {profile?.business_domain || 'Kirana'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContext(!showContext)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0a2540] hover:bg-slate-50 bg-white border border-[#e3e8ee] rounded-lg shadow-2xs transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-[#635bff]" />
            <span>Store Context</span>
          </button>
          <button
            onClick={onClearChat}
            title="Clear Chat History"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grounding Context Inspector Drawer in Stripe Midnight Navy Style */}
      {showContext && (
        <div className="p-4 bg-[#0a2540] text-white rounded-2xl text-xs space-y-2 shrink-0 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between font-bold text-[#00d4ff]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00d4ff]" />
              <span>Verified Local Grounding Context Passed to Codey</span>
            </div>
            <span className="text-[10px] text-slate-300 font-mono">Strict Anti-Hallucination Guardrails</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Codey only answers from real store transactions, active product catalog, computed exponential sales velocity forecasts, and verified market trends.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">Store: {profile?.name}</div>
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">Domain: {profile?.business_domain}</div>
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">City: {profile?.city}, {profile?.state}</div>
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">Currency: INR (₹)</div>
          </div>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-[#e3e8ee] shadow-sm p-5 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#635bff] to-[#00d4ff] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(99,91,255,0.3)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0a2540]">
                Namaste! How can I assist {profile?.name || 'your store'} today?
              </h3>
              <p className="text-xs text-[#425466] max-w-md mx-auto mt-1">
                Ask about reorders, hero products, stockout risk countdowns, or market trends. All answers are verified against your local store ledger.
              </p>
            </div>

            {/* Quick Prompt Cards in Stripe style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full pt-2">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(q)}
                  className="text-left p-3 rounded-xl bg-[#f6f9fc] hover:bg-[#635bff]/5 border border-[#e3e8ee] hover:border-[#635bff]/40 text-xs font-medium text-[#0a2540] hover:text-[#635bff] transition-all flex items-center justify-between group shadow-2xs"
                >
                  <span className="truncate">{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#635bff] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#635bff] to-[#00d4ff] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-2xs">
                    C
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-[#635bff] text-white shadow-[0_2px_6px_rgba(99,91,255,0.25)] rounded-br-xs'
                      : 'bg-[#f6f9fc] text-[#0a2540] border border-[#e3e8ee] rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <FormattedMessage text={m.content} />
                  )}

                  {!isUser && (
                    <div className="flex items-center justify-between pt-2 border-t border-[#e3e8ee]/80 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-[#059669]">
                        <Check className="w-3 h-3" />
                        <span>Verified Local Ledger Grounding</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="flex items-center gap-1 hover:text-[#0a2540] text-[#425466] font-medium transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#059669]" />
                            <span className="text-[#059669]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#635bff] to-[#00d4ff] text-white flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
              C
            </div>
            <div className="bg-[#f6f9fc] border border-[#e3e8ee] rounded-2xl rounded-bl-xs p-4 text-xs text-[#425466] flex items-center gap-2 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#635bff] animate-spin" />
              <span>Analyzing store inventory & sales velocity...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar in Stripe Style */}
      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask Codey about ${profile?.name || 'Sharma General Store'}...`}
          disabled={isLoading}
          className="flex-1 bg-white border border-[#e3e8ee] rounded-xl px-4 py-3 text-xs text-[#0a2540] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:border-transparent shadow-2xs transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-5 py-3 bg-[#635bff] hover:bg-[#5346e0] active:bg-[#4b3ecb] text-white rounded-xl text-xs font-semibold shadow-[0_2px_6px_rgba(99,91,255,0.3)] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 hover:-translate-y-0.5"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
