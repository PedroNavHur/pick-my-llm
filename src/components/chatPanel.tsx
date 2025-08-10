"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { routeModel } from "@/lib/brute_router";
import { RouterUIMessage } from "@/lib/types";
import { useRouterStore } from "@/store/router";
// flatten AI SDK UIMessage parts → text
const asText = (parts: { type: string; text?: string }[]) =>
  parts.map(p => (p.type === "text" ? p.text : "")).join("");

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat({
    onError: e => toast.error(e.message),
  });

  // Zustand: read weights, setter for top models
  const weights = useRouterStore(s => s.weights);
  const setTopModels = useRouterStore(s => s.setTopModels);

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

    // 2) call the router with the prompt and current weights
    try {
      // Preferred: rankModels returns ScoredModel[] sorted desc.
      const ranked = routeModel(prompt, weights);
      setTopModels(ranked.alternatives);

      // If you don’t have rankModels, you can do:
      // const { primary, alternatives } = routeModel(prompt, weights);
      // setTopModels([primary, ...alternatives].slice(0, 5));
    } catch (err) {
      console.error("Router error:", err);
      toast.error("Failed to score models for this prompt.");
    }

    await sendMessage({ text: prompt });

    setInput("");
  }

  return (
    <div className="card bg-base-300 shadow-md mx-auto w-full max-w-2xl h-[75vh] overflow-hidden">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <h2 className="card-title text-base">Chat</h2>
          <div className="badge badge-ghost">LLM</div>
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
              {(messages as RouterUIMessage[]).map(m => {
                const isUser = m.role === "user";

                // Look for a metadata part like: { type: "data-llmmodel", data: { name: "GPT-4.1" } }
                const assistantLabel = m.parts.find(
                  part => part.type === "data-llmmodel"
                )?.data.name;

                return (
                  <div
                    key={m.id}
                    className={`chat ${isUser ? "chat-end" : "chat-start"}`}
                  >
                    {/* Speaker label (uses metadata if present) */}
                    <div className="chat-header text-xs opacity-60 mb-1">
                      {isUser ? "You" : assistantLabel}
                    </div>

                    {/* Bubble */}
                    <div className="chat-bubble chat-bubble-neutral text-sm max-w-[90%] whitespace-pre-wrap">
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
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Type your prompt… (Shift+Enter for newline)"
              className="textarea textarea-bordered join-item w-full min-h-[48px] max-h-40"
            />
            <button
              type="submit"
              className="btn btn-primary join-item"
              disabled={!input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
