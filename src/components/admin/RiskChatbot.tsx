'use client';

import { useState, useRef, useEffect } from 'react';
import { SparklesIcon, PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  orgContext: any;
  employeeContext: any;
}

const QUICK_QUESTIONS = [
  'Why is this employee high risk?',
  'What should HR do next?',
  'Which department needs attention?',
  'How does this compare to IBM baseline?',
  'What are the top attrition drivers?',
];

export default function RiskChatbot({ orgContext, employeeContext }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: ` Hi! I'm your HR Risk Intelligence Assistant. I have full access to your organization's IBM-calibrated risk data. Ask me anything  about specific employees, departments, or attrition trends.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/risk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          orgContext,
          employeeContext,
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply || 'I could not generate a response. Please try again.' },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: ' Connection error. Please check your network and try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        title="HR Risk AI Chatbot"
      >
        {open
          ? <XMarkIcon className="w-6 h-6 text-white" />
          : <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />}
        {/* Pulse indicator */}
        {!open && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[370px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[rgba(99,102,241,0.3)]"
          style={{ height: '520px', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)]"
            style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' }}>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">HR Risk AI</p>
              <p className="text-[10px] text-indigo-200 mt-0.5">IBM Dataset  Gemini  Live data</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Online
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <SparklesIcon className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white/10 text-slate-100 rounded-bl-sm border border-white/10'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <SparklesIcon className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Quick questions</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/10">
            <div className="flex gap-2 items-center bg-white/10 rounded-xl px-3 py-2 border border-white/10 focus-within:border-indigo-500/60 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about any employee or trend..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className="text-[9px] text-slate-500 text-center mt-1.5">
              IBM HR Dataset  Predictive insights only  Not a certainty
            </p>
          </div>
        </div>
      )}
    </>
  );
}
