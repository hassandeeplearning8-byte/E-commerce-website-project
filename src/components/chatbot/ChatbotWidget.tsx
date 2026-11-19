'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Bot,
  User,
  ShoppingBag,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'What products do you have?',
  'What items are in stock?',
  'Tell me about the headphones',
  'How much is the gaming keyboard?',
];

export default function ChatbotWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋 **Welcome to Shopco!**\n\nI'm your AI Shopping Assistant, connected directly to our live inventory. Ask me about our products, check prices, or verify stock availability!",
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            data.error ||
            "Sorry, I had trouble connecting to the store service. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "Network error: Unable to reach the chatbot service right now. Please check your connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          "👋 Chat cleared! How else can I assist you with Shopco's products today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[380px] h-[520px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-black/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                <Sparkles size={18} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  Shopco Assistant
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Gemini Free Tier • Live Catalog</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Restart Chat"
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Restart chat"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center mt-0.5 text-xs">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-black text-white rounded-br-none shadow-sm'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      m.role === 'user' ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex-shrink-0 flex items-center justify-center mt-0.5 text-xs">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center text-xs">
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          {messages.length <= 3 && !isLoading && (
            <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-[11px] font-medium whitespace-nowrap bg-gray-100 hover:bg-black hover:text-white text-gray-700 px-3 py-1.5 rounded-full transition-colors flex-shrink-0 border border-gray-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-black focus-within:bg-white transition-all border border-gray-200">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about products, stock, prices..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 py-1"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-1.5 rounded-full bg-black text-white hover:opacity-85 disabled:opacity-30 disabled:hover:opacity-30 transition-opacity flex-shrink-0"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-black text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white focus:outline-none"
        aria-label="Toggle Shopping Assistant"
      >
        {isOpen ? (
          <X size={24} className="transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <>
            <MessageSquare size={24} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}

