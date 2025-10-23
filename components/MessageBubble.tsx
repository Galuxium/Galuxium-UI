import React from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../lib/types";
import { Inter } from "next/font/google";

const modelColors: Record<string, string> = {
  "Galuxium Turbo": "#2e147e",
  "Galuxium Quantum Vision": "#3a0ca3",
  "Galuxium Turbo Coder": "#4c1d95",
  "Galuxium Ultra": "#1e0f5c",
  "Galuxium Ultra Lumen": "#5a189a",
  "Galuxium Ultra Nemotron": "#240046",
  "Galuxium Core Prime": "#2d00f7",
  "Galuxium Pro": "#3f37c9",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function MessageBubble({
  msg,
  model,
}: {
  msg: ChatMessage;
  model: string;
}) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "4px 0",
      }}
      className={inter.className}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: "12px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser
            ? "linear-gradient(135deg, #2000c1, #2e147e)"
            : "rgba(255, 255, 255, 0.15)",
          backdropFilter: isUser ? undefined : "blur(12px)",
          color: isUser ? "#fff" : "#222",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.3)",
          fontSize: "15px",
          lineHeight: "1.5",
          wordBreak: "break-word",
          position: "relative",
        }}
        className="my-2"
      >
        {msg.content ? (
          <>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p style={{ margin: "0 0 6px" }}>{children}</p>,
                strong: ({ children }) => (
                  <strong style={{ color: isUser ? "#fff" : "#2000c1" }}>
                    {children}
                  </strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    style={{
                      color: isUser ? "#ffe066" : "#0077b6",
                      textDecoration: "underline",
                    }}
                  >
                    {children}
                  </a>
                ),
                code: ({
              inline,
              children,
            }: {
              inline?: boolean;
              children?: React.ReactNode;
            }) =>
                  inline ? (
                    <code
                      style={{
                        background: "#f1f1f1",
                        padding: "2px 5px",
                        borderRadius: "4px",
                      }}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre
                      style={{
                        background: "#1e1e1e",
                        padding: "8px",
                        borderRadius: "6px",
                        overflowX: "auto",
                        color: "#fff",
                      }}
                    >
                      <code>{children}</code>
                    </pre>
                  ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
            {!isUser && (
              <div
                className="w-fit rounded-lg px-2 py-1 text-xs text-white font-semibold mt-1"
                style={{ backgroundColor: modelColors[model] ?? "#2e147e" }}
              >
                {model}
              </div>
            )}
          </>
        ) : (
          // Premium loading animation for AI
          <div className="flex items-center gap-2 h-6">
            <div className="flex gap-1">
    <span className="dot animate-bounce delay-0"></span>
    <span className="dot animate-bounce delay-200"></span>
    <span className="dot animate-bounce delay-400"></span>
  </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dot {
          display: inline-block;
          width: 15px;
          height: 15px;
          background: #2e147e;
          border-radius: 50%;
          margin-right: 2px;
        }
        .animate-bounce {
          animation: bounce 0.6s infinite alternate;
        }
        .delay-0 {
          animation-delay: 0s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
        @keyframes bounce {
          from {
            transform: translateY(0);
            opacity: 0.6;
          }
          to {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
