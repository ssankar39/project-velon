'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Dumbbell } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Welcome! I'm your personalized workout coach. What might I help you with?",
};

export default function AIChatWidget() {
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Listen for coach feedback context events from the workout module
  useEffect(() => {
    const handleCoachContext = async (e: Event) => {
      const { context } = (e as CustomEvent<{ context: string }>).detail;
      setOpen(true);
      const userMsg: ChatMessage = { role: 'user', content: context };
      setMessages(prev => [...prev, userMsg]);
      setLoading(true);
      try {
      const userId = currentUser?.email || null;
      const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: context, userId, includeWorkoutData: true }),
        });
        const data = await res.json();
        const reply = res.ok
          ? (data.reply ?? 'Sorry, something went wrong.')
          : (data.error ?? 'Something went wrong.');
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
      } finally {
        setLoading(false);
      }
    };
    window.addEventListener('coach-context', handleCoachContext);
    return () => window.removeEventListener('coach-context', handleCoachContext);
  }, [currentUser?.email]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const userId = currentUser?.email || null;
      // Include workout data if the message seems to reference workouts/training
      const workoutKeywords = /workout|session|exercise|set|rep|weight|progress|volume|training|routine|split|pr|personal record|bench|squat|deadlift|log/i;
      const includeWorkoutData = workoutKeywords.test(text);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userId, includeWorkoutData }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error ?? 'Something went wrong. Please try again.';
        setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        return;
      }
      const reply = data.reply ?? 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentUser?.email]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      let processed = escapeHtml(line);
      processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (/^[-•*]\s/.test(processed)) {
        processed = '&bull; ' + processed.replace(/^[-•*]\s/, '');
      }
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: processed }} />
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Open AI Coach Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
          style={{ background: 'rgba(14, 14, 24, 0.95)', backdropFilter: 'blur(24px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-purple-600/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Coach</p>
                <p className="text-[10px] text-purple-300">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-white/8 text-gray-200 border border-white/5 rounded-bl-md'
                  }`}
                >
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/8 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/10">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach..."
                disabled={loading}
                className="w-full pl-3 pr-10 py-2 glass-light rounded-lg text-white border border-white/10 focus:border-purple-500 focus:outline-none placeholder-gray-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 disabled:text-gray-600 transition-colors p-1"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
