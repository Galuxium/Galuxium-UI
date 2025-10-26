import React, { useState } from "react";
import type { ChatMessage } from "../../lib/types";
import MessageBubble from "./MessageBubble";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "@/lib/SessionContext";

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelId] = useState(
    "cognitivecomputations/dolphin3.0-r1-mistral-24b:free"
  );
 const {session}=useSession();
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const userId=session?.user?.id;
  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const resp = await axios.post(`${BACKEND_BASE}/api/openrouter/chat`, {
        model: modelId,
        userMessages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

     
      const accessToken = session?.access_token;
      

      const assistantContent =
        resp?.data?.providerResp?.choices?.[0]?.message?.content ||
        resp?.data?.providerResp?.choices?.[0]?.text ||
        "Galuxium could not generate a response.";

      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: assistantContent,
        createdAt: new Date().toISOString(),
      };
      const conversationId = uuidv4();

await axios.post(`${BACKEND_BASE}/api/conversations/save`, {
  conversation: {
    id: conversationId,
    user_id: userId,
    title: trimmed.slice(0, 50), // first 50 chars as title
    model_slug: modelId,
  },
  messages: [
    ...nextMessages, // user messages
    {
      id: uuidv4(),
      role: "assistant",
      content: assistantContent,
      conversation_id: conversationId,
    }
  ],
  userId
}, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  }
});

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("chat send err", err);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Error: failed to get response from server",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div
        style={{
          height: "60vh",
          overflow: "auto",
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 12,
        }}
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} model={modelId} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={"Ask anything"}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 8 }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
