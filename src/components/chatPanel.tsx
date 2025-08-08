"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// flatten AI SDK UIMessage parts → text
const asText = (parts: { type: string; text?: string }[]) =>
  parts.map((p) => (p.type === "text" ? p.text : "")).join("");

type ChatPanelProps = {
  /** Default label for assistant messages if model name isn't available */
  assistantLabel?: string; // e.g. "LLM" | "GPT-4o" | "Claude 3.5"
  /** Optional extractor for a per-message model label when you add metadata */
  getAssistantLabel?: (m: any) => string | undefined;
};

export default function ChatPanel({
  assistantLabel = "LLM",
  getAssistantLabel,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat({
    onError: (e) => toast.error(e.message),
  });

  const listRef = useRef<HTMLDivElement>(null);

  // autoscroll
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;
    await sendMessage({ text: prompt });
    setInput("");
  }

  // Helper to label assistant messages now, and per-model later
  const labelFor = (m: any) =>
    m.role === "user"
      ? "You"
      : getAssistantLabel?.(m) ??
        // try common places you might stash the model name later:
        m.model ??
        m.meta?.model ??
        m.provider ??
        assistantLabel;

  return (
    <div className="card bg-base-300 shadow-md mx-auto w-full max-w-2xl h-[75vh] overflow-hidden">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <h2 className="card-title text-base">Chat</h2>
          <div className="badge badge-ghost">{assistantLabel}</div>
        </div>

        {/* Messages area */}
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 pt-3">
          {messages.length === 0 ? (
            <div className="h-full grid place-items-center text-base-content/60">
              <div className="text-center">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm">Start a conversation…</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-3">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
                    {/* Small header with speaker label */}
                    <div className="chat-header text-xs opacity-60 mb-1">
                      {labelFor(m)}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`chat-bubble max-w-[90%] whitespace-pre-wrap ${
                        isUser ? "chat-bubble-primary" : "chat-bubble-secondary"
                      }`}
                    >
                      {asText(m.parts)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-base-300">
          <form onSubmit={onSubmit} className="join w-full">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Type your prompt… (Shift+Enter for newline)"
              className="textarea textarea-bordered join-item w-full min-h-[48px] max-h-40"
            />
            <button type="submit" className="btn btn-primary join-item" disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
