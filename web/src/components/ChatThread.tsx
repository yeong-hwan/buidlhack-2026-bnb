"use client";

import { useRef, useEffect } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "system";
  content: string;
  strategyName?: string;
  blockCounts?: Record<string, number>;
  timestamp: number;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isPending: boolean;
  input: string;
  onInputChange: (value: string) => void;
}

export default function ChatThread({ messages, onSend, isPending, input, onInputChange }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) onSend(input);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3">
        <span className="text-xs font-semibold text-white/60">Strategy Thread</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-white/20">Describe a strategy to start</p>
            <p className="mt-1 text-[11px] text-white/10">Each message generates or modifies blocks</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-400/15 text-cyan-100"
                      : "bg-white/5 text-white/70"
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.strategyName && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <span className="text-[10px] font-semibold text-cyan-300">{msg.strategyName}</span>
                      {msg.blockCounts && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(msg.blockCounts)
                            .filter(([, c]) => c > 0)
                            .map(([agent, count]) => (
                              <span
                                key={agent}
                                className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/40"
                              >
                                {agent}: {count}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/5 px-3.5 py-2.5 text-[12px] text-white/30">
                  Generating blocks...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe or refine your strategy..."
            rows={2}
            className="flex-1 resize-none bg-transparent text-[12px] text-white placeholder-white/20 outline-none"
          />
          <button
            onClick={() => { if (input.trim()) onSend(input); }}
            disabled={!input.trim() || isPending}
            className="shrink-0 rounded-lg bg-cyan-400 px-3 py-1.5 text-[10px] font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
