import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Database,
  Copy,
  Check,
  Info,
  ChevronRight,
  Store,
  IndianRupee,
  Layers,
} from 'lucide-react';
import { CodeyMessage, SellerProfile } from '../types';

interface CodeyPageProps {
  messages: CodeyMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  isLoading: boolean;
  profile: SellerProfile | null;
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
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Codey AI Assistant</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Grounded SMB Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Conversational intelligence for {profile?.name || 'Sharma General Store'} · {profile?.business_domain || 'Kirana'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContext(!showContext)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs"
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>Store Context</span>
          </button>
          <button
            onClick={onClearChat}
            title="Clear Chat History"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grounding Context Inspector Drawer (Collapsible) */}
      {showContext && (
        <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2 shrink-0 border border-slate-800">
          <div className="flex items-center justify-between font-bold text-amber-400">
            <span>Verified Local Grounding Context Passed to Codey</span>
            <span className="text-[10px] text-slate-400">Strict Anti-Hallucination Guardrails</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Codey only answers from real store transactions, active product catalog, computed exponential sales velocity forecasts, and verified market trends.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
            <div className="bg-slate-800/80 p-2 rounded">Store: {profile?.name}</div>
            <div className="bg-slate-800/80 p-2 rounded">Domain: {profile?.business_domain}</div>
            <div className="bg-slate-800/80 p-2 rounded">Location: {profile?.city}, {profile?.state}</div>
            <div className="bg-slate-800/80 p-2 rounded">Currency: INR (₹)</div>
          </div>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Namaste! How can I assist {profile?.name || 'your store'} today?
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Ask about reorders, hero products, stockout risk countdowns, or market trends. All answers are verified against your local store ledger.
              </p>
            </div>

            {/* Quick chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full pt-2">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(q)}
                  className="text-left p-3 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-300 text-xs font-medium text-slate-700 hover:text-amber-950 transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-2xs">
                    C
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-amber-600 text-white shadow-xs rounded-br-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {!isUser && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                      <span>Verified Local Database Grounding</span>
                      <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="flex items-center gap-1 hover:text-slate-600 text-slate-500 font-medium"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
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
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
              C
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-bl-xs p-4 text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Analyzing store inventory & sales velocity...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask Codey about ${profile?.name || 'Sharma General Store'}...`}
          disabled={isLoading}
          className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-2"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
