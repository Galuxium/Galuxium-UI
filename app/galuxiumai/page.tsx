"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/SessionContext";
import ConversationBubble from "@/components/AI/ConversationBubble";
import SearchBar from "@/components/AI/SearchBar";
import {
  FaEnvelopeOpenText,
  FaFacebookMessenger,
  FaHistory,
  FaPlus,
} from "react-icons/fa";
import { Bot, FileText, Palette, Presentation } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import { useSmartAutoScroll } from "@/hooks/useSmartAutoScroll";
import { supabase } from "@/lib/supabase";
import { classifyIdea } from "@/lib/classifyIdea";
import FoundersModeBanner from "@/components/FoundersModeBanner";

import AgentCard from "@/components/AgentCard";
import { AgentData } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
export type Role = "user" | "assistant" | "system";
interface ReportData {
  pdf: string;
  pptx: string;
  logos: string[];
  palette?: string;
  idea_id: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  user_id?: string | null;
  model_slug?: string | null; // DB column; we’ll show it with `model` in UI
  created_at?: string;
  updated_at?: string | null;
}

export interface Message {
  id: string;
  conversation_id?: string;
  user_id?: string | null;
  role: Role;
  content: string;
  model_used?: string | null;
  created_at?: string;
}
export interface ModelOption {
  name: string;
  id: string;
  description: string;
}

const BACKEND_URL: string = process.env.NEXT_PUBLIC_BACKEND_URL as string;

function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export default function PremiumGaluxiumPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [userTokensUsed, setUserTokensUsed] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<"free" | "premium">("free");

  const [isFoundersMode, setIsFoundersMode] = useState(false);
  const [ideaDetected, setIdeaDetected] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
const [report, setReport] = useState<ReportData | null>(null);

  const [userTokens, setUserTokens] = useState<number>(0);
  const [assistantTokens, setAssistantTokens] = useState<number>(0);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [conversationsList, setConversationsList] = useState<boolean>(false);
  const { containerRefChat, bottomRef, autoScroll, scrollToBottom } =
    useSmartAutoScroll<HTMLDivElement>([messages]);
  const [toast, setToast] = useState<string | null>(null);
  const { session } = useSession();
  const userId: string | null = session?.user?.id ?? null;
  useEffect(() => {
    if (isFoundersMode) document.body.classList.add("founders-mode");
    else document.body.classList.remove("founders-mode");
  }, [isFoundersMode]);

  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const userDataResp = await supabase
          .from("users")
          .select("tokens_used, plan,userTokens,assistantTokens")
          .eq("id", userId)
          .single();

        if (userDataResp.error) throw userDataResp.error;

        const userData = userDataResp.data; // ✅ contains tokens_used & plan
        console.log(userData.tokens_used, userData.plan);

        setUserTokensUsed(userData.tokens_used);
        setUserPlan(userData.plan);
        setUserTokens(userData.userTokens);
        setAssistantTokens(userData.assistantTokens);
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    })();
  }, [userId, session]);

  useEffect(() => {
    const fetchModels = async () => {
      const res = await fetch(`${BACKEND_URL}/api/chat/models`);
      const { data } = await res.json();

      setModels(data);
      if (data.length > 0) setModel(data[0].id);
    };
    fetchModels();
  }, []);

  // load conversations for user
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const r = await fetch(
          `${BACKEND_URL}/api/chat/list?userId=${encodeURIComponent(userId)}`
        );
        if (!r.ok) return;
        const j = await r.json();
        if (Array.isArray(j.data)) {
          setConversations(j.data as Conversation[]);
          if (!activeConversationId && j.data.length > 0)
            setActiveConversationId(j.data[0].id);
        }
      } catch (err) {
        console.warn("Failed to load conversations", err);
      }
    })();
  }, [userId, activeConversationId]);

  // fetch messages when conversation changes
  useEffect(() => {
    const cid = activeConversationId;
    if (!cid) {
      setMessages([]);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${BACKEND_URL}/api/chat/${encodeURIComponent(cid)}`
        );
        if (!r.ok) {
          console.warn("fetch messages failed status", r.status);
          return;
        }
        const j = await r.json();
        const arr = Array.isArray(j.data) ? (j.data as Message[]) : [];
        setMessages(arr);
      } catch (err) {
        console.warn("fetch messages failed", err);
      }
    })();
  }, [activeConversationId]);

  // helper: toast
  const showToast = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  // create conversation
  const createConversation = useCallback(
    async (title = "New chat") => {
      try {
        if (!userId) {
          showToast("You must be signed in");
          return;
        }
        const payload = { userId, title, model };
        const r = await fetch(`${BACKEND_URL}/api/chat/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const txt = await r.text();
          showToast("Failed to create conversation");
          console.error("create convo err", txt);
          return;
        }
        const j = await r.json();
        if (j.data && j.data.id) {
          setConversations((c) => [j.data as Conversation, ...c]);
          setActiveConversationId(j.data.id as string);
        }
      } catch (err) {
        console.error(err);
        showToast("Network error while creating conversation");
      }
    },
    [userId, model, showToast]
  );

  // save single message to backend
  const saveMessageToBackend = useCallback(async (m: Message) => {
    try {
      await fetch(`${BACKEND_URL}/api/chat/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: m.conversation_id,
          userId: m.user_id ?? null,
          role: m.role,
          content: m.content,
          model: m.model_used ?? null, // ✅ backend maps model → model_slug if needed
        }),
      });
    } catch (err) {
      console.warn("saveMessage failed", err);
    }
  }, []);
 const [agentOutputs, setAgentOutputs] = useState<AgentData[]>([]);
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (!userId) {
        showToast("You must be signed in");
        return;
      }

      // Step 0: Estimate user tokens and check plan limit
      const userTokens = estimateTokensFromText(text);
      if (userPlan === "free" && userTokensUsed + userTokens > 5000) {
        showToast(`Free plan limit reached (5,000 tokens). Upgrade for more.`);
        return;
      }

      // Step 1: Create conversation if none exists
      let cid = activeConversationId;
      if (!cid) {
        try {
          const r = await fetch(`${BACKEND_URL}/api/chat/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              title: text.slice(0, 50) || "New chat",
              model,
            }),
          });
          if (!r.ok) throw new Error("Failed to create conversation");
          const j = await r.json();
          cid = j?.data?.id;
          if (!cid) throw new Error("Conversation creation returned no ID");
          setConversations((c) => [j.data as Conversation, ...c]);
          setActiveConversationId(cid);
        } catch (err) {
          console.error(err);
          showToast("Network error while creating conversation");
          return;
        }
      }

      // Step 2: Add user message locally & backend
      const userMsg: Message = {
        id: uuidv4(),
        conversation_id: cid!,
        user_id: userId,
        role: "user",
        content: text,
        model_used: model,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      void saveMessageToBackend(userMsg);

      // Step 3: Add assistant placeholder
      const assistantId = uuidv4();
      const assistantPlaceholder: Message = {
        id: assistantId,
        conversation_id: cid!,
        user_id: userId,
        role: "assistant",
        content: "",
        model_used: model,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantPlaceholder]);
      setIsStreaming(true);
      const history = messagesRef.current
        .filter(
          (m) =>
            m.conversation_id === cid &&
            (m.role === "user" || m.role === "assistant")
        )
        .map((m) => ({ role: m.role as Role, content: m.content }));
      history.push({ role: "user", content: text });

      // 🧠 Step 4: Classify prompt before deciding route
      showToast("Classifying your prompt...");
      let classification;
      try {
        classification = await classifyIdea(text);
      } catch {
        classification = { is_startup_idea: false, idea: text };
      }

      console.log("🧩 Classification result:", classification);

      if (classification.is_startup_idea) {
        setIsFoundersMode(true);
        setIdeaDetected(classification.idea);
        // 🔊 play sound cue
        const audio = new Audio("/sounds/founders-mode.mp3");
        audio.volume = 0.8;
        audio.play().catch(() => {
          console.warn("Autoplay blocked — user must interact first");
        });
      } else {
        setIsFoundersMode(false);
        setIdeaDetected(null);
      }

//      if (classification.is_startup_idea) {
//   setIsFoundersMode(true);
//   setIdeaDetected(classification.idea);
//   showToast("Startup idea detected — orchestrating...");

//   try {
//     const response = await fetch(`${BACKEND_URL}/api/orchestrator`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ user_id: userId, idea: classification.idea }),
//     });

//     if (!response.body) throw new Error("No response stream from backend");

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder();
//     let buffer = "";

//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;
//       buffer += decoder.decode(value, { stream: true });

//       const lines = buffer.split("\n");
//       buffer = lines.pop() || "";

//       for (const line of lines) {
//         if (!line.trim()) continue;
//         try {
//           const data = JSON.parse(line);
//           if (data.message) {
//             setMessages((prev) =>
//               prev.map((m) =>
//                 m.id === assistantId
//                   ? { ...m, content: (m.content || "") + "\n" + data.message }
//                   : m
//               )
//             );
//           }
//         } catch (err) {
//           console.warn("JSON parse error:", err, line);
//         }
//       }
//     }

//     setIsStreaming(false);
//     showToast("✅ Orchestration completed!");
//   } catch (err) {
//     console.error("Orchestration POST stream failed:", err);
//     showToast("❌ Failed to orchestrate");
//     setIsStreaming(false);
//   }
//   return;
// }

if (classification.is_startup_idea) {
  showToast("🧬 Initializing Galuxium Multi-Agent Orchestration...");

  const url = `${BACKEND_URL}/api/orchestrator?idea=${encodeURIComponent(
    classification.idea
  )}&user_id=${userId}`;

  // 🧠 Track all logs streamed to frontend
  const logs: {
    timestamp: string;
    phase: string;
    sub_phase?: string | null;
    message: string;
    progress?: number | null;
    file_url?: string | null;
  }[] = [];

  const eventSource = new EventSource(url);
  setIsStreaming(true);
let currentIdeaId: string | null = null;
  eventSource.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      // ⚠️ Handle errors from backend
      if (data.error) {
        showToast(`❌ ${data.error}`);
        console.error("Stream error:", data.error);
        return;
      } 
 if (data.idea_id && !currentIdeaId) {
      currentIdeaId = data.idea_id;
      console.log("💾 Captured idea_id from stream:", currentIdeaId);
    }

      // 🧩 Save every streamed event to logs
      logs.push({
        timestamp: new Date().toISOString(),
        phase: data.phase || "unknown",
        sub_phase: data.sub_phase || null,
        message: data.message || "",
        progress: data.progress || 0,
        file_url: data.file_url || null,
      });

      // 🧠 Update UI per phase
      if (data.phase) {
        setAgentOutputs((prev) => {
          const existing = prev.find((a) => a.phase === data.phase);
          if (existing) {
            return prev.map((a) =>
              a.phase === data.phase
                ? {
                    ...a,
                    ...data,
                    messages: [...(a.messages || []), data.message],
                  }
                : a
            );
          }
          return [...prev, { ...data, messages: [data.message] }];
        });
      }

      // ✅ When orchestration finishes
      if (data.done) {
        showToast("🎯 All Galuxium Agents completed!");
        setIsStreaming(false);

        // 🗃️ Persist logs to Supabase
        try {
          const { data, error } = await supabase
  .from("orchestration_logs")
  .insert([
    {
      user_id: userId,
      idea_id: currentIdeaId,
      logs: JSON.parse(JSON.stringify(logs)),
      created_at: new Date().toISOString(),
    },
  ])
  .select();

console.log("Supabase insert result:", { data, error });
const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/report/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea_id: currentIdeaId }),
    });

    const json = await res.json();
    setReport(json.uploads);
    console.log("Report generation result:", json);

const finalAssistantMsg: Message = {
        id: assistantId,
        conversation_id: cid!,
        user_id: userId,
        role: "assistant",
        content: JSON.parse(JSON.stringify(logs)),
        model_used: model,
        created_at: new Date().toISOString(),
      };
      void saveMessageToBackend(finalAssistantMsg);

          if (error)
            console.error("❌ Error saving client logs:", error);
          else
            console.log("✅ Client logs saved to Supabase:", logs.length);
        } catch (e) {
          console.error("Failed to save client logs:", e);
        }
        

        eventSource.close();
      }
    } catch (err) {
      console.warn("Stream parse error:", err);
    }
  };

  // ⚙️ Handle connection drop
  eventSource.onerror = (err) => {
    console.error("SSE connection failed:", err);
    //showToast("Stream Closed");
    setIsStreaming(false);
    eventSource.close();
  };
}




      // 💬 Step 5B: Normal chat fallback (your original /api/chat/search logic)
      if(!classification.is_startup_idea){
        try {
        const resp = await fetch(`${BACKEND_URL}/api/chat/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            userMessages: history,
            modelProfile: {
              system_prompt:
                "You are Galuxium — an advanced assistant that is helpful, concise, and friendly. You were founded by Aaditya Salgaonkar.",
            },
          }),
        });

        if (!resp.ok) throw new Error(`OpenRouter call failed: ${resp.status}`);
      const json = await resp.json();

      const reply =
        json?.providerResp?.choices?.[0]?.message?.content ??
        json?.providerResp?.choices?.[0]?.text ??
        "…";

      // Step 6: Update assistant message immediately
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m))
      );

      const assistantTokens = estimateTokensFromText(reply);
    

      // Step 7: Persist assistant message
      const finalAssistantMsg: Message = {
        id: assistantId,
        conversation_id: cid!,
        user_id: userId,
        role: "assistant",
        content: reply,
        model_used: model,
        created_at: new Date().toISOString(),
      };
      void saveMessageToBackend(finalAssistantMsg);

      // Step 8: Update total tokens in DB
      const totalTokensUsed = userTokens + assistantTokens;
      setUserTokensUsed((prev) => prev + totalTokensUsed);

      void fetch(`${BACKEND_URL}/api/chat/updateTokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tokens: totalTokensUsed, userTokens,assistantTokens }),
      });
      } catch (err) {
        console.error("sendMessage error", err);
        showToast("AI response failed");
      } finally {
        setIsStreaming(false);
      }
      }
    },
    [
      activeConversationId,
      model,
      saveMessageToBackend,
      showToast,
      userId,
      userPlan,
      userTokensUsed,
    ]
  );

  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = a.updated_at
      ? new Date(a.updated_at).getTime()
      : a.created_at
      ? new Date(a.created_at!).getTime()
      : 0;
    const dateB = b.updated_at
      ? new Date(b.updated_at).getTime()
      : b.created_at
      ? new Date(b.created_at!).getTime()
      : 0;
    return dateB - dateA;
  });

  const [open, setOpen] = useState<boolean>(false);
  useEffect(() => {
    if (sortedConversations.length === 0) return;
    if (activeConversationId === null) {
      const newest = sortedConversations[0];
      setActiveConversationId(newest.id);
    }
  }, [sortedConversations, activeConversationId]);

  const formatTokens = (num: number) => {
    if (num >= 10000000)
      return (num / 10000000).toFixed(1).replace(/\.0$/, "") + "Cr";
    if (num >= 100000)
      return (num / 100000).toFixed(1).replace(/\.0$/, "") + "L";
    if (num >= 1000000)
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
  };
  const handleDelete = async (id: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/chat/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });

      const data = await resp.json();
      if (!resp.ok)
        throw new Error(data.error || "Failed to delete conversation");

      // Remove it from UI
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };
  return (
    <div className="relative min-h-screen font-sans bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 text-[#0b1220] pt-5">
      <div className="flex flex-row justify-between px-7">
        <h1 className="text-2xl md:text-3xl pl-10 md:pl-0  font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
          Galuxium AI
        </h1>

        <div className="flex-row gap-5 flex">
          <div className="relative">
            <div
              onClick={() => setOpen(!open)}
              className="text-1xl hidden md:flex  cursor-pointer items-center  flex-row gap-2 font-bold text-white h-fit py-2 px-4 rounded-2xl bg-gradient-to-r from-[#2000c1] to-[#2e147e] select-none"
            >
              <Bot />
              {models.find((m) => m.id === model)?.name || model}
            </div>

            {open && (
              <div className="absolute right-32 text-xs md:text-1.5xl md:w-[15vw] mt-2 rounded-xl shadow-lg overflow-hidden bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white z-10 ">
                {models.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setModel(m.id); // ✅ backend slug
                      setOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-[#2e147e]/80 transition-all duration-200 ${
                      model === m.id ? "bg-white/20" : ""
                    }`}
                  >
                    <p className="font-medium">{m.name}</p>{" "}
                    {/* ✅ frontend display */}
                    <p className="text-[9px] font-normal">{m.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h1
            className="text-1xl cursor-pointer hidden md:flex  items-center flex-row gap-2 font-bold text-white h-fit py-2 px-4 rounded-2xl bg-gradient-to-r from-[#2000c1] to-[#2e147e]"
            onClick={() => {
              const txt = messages
                .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
                .join("\n\n");
              const blob = new Blob([txt], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `galuxium-${activeConversationId ?? "chat"}.txt`;
              a.click();
            }}
          >
            Export
            <FaEnvelopeOpenText />
          </h1>

          <h1
            className="text-1xl cursor-pointer items-center hidden md:flex  flex-row gap-2 font-bold text-white h-fit py-2 px-4 rounded-2xl bg-gradient-to-r from-[#2000c1] to-[#2e147e]"
            onClick={() => createConversation("New Chat")}
          >
            New
            <FaFacebookMessenger />
          </h1>

          <h1
            className="text-xs md:hidden cursor-pointer items-center -ml-3  flex-row gap-2 font-semibold text-white h-fit py-2 px-3 rounded-2xl bg-gradient-to-r from-[#2000c1] to-[#2e147e]"
            onClick={() => setConversationsList(true)}
          >
            <FaHistory />
          </h1>

          {isFoundersMode && ideaDetected && (
            <div className="py-3 -mr-3">
              <FoundersModeBanner idea={ideaDetected} />
            </div>
          )}

          {!isFoundersMode && !ideaDetected && (
            <div className="px-3 hidden md:flex mb-5 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-200 flex-row gap-5 items-center text-center h-fit py-2">
              <div className="font-semibold text-xs text-black flex flex-col text-left">
                Tokens
                <span className="text-xl">{formatTokens(userTokens)}</span>
                Prompt Load
              </div>
              <div className="font-semibold text-xs text-black flex flex-col text-left">
                Tokens
                <span className="text-xl">{formatTokens(assistantTokens)}</span>
                AI Response
              </div>
              <div className="text-xs font-semibold text-gray-900 flex flex-col text-left">
                Tokens
                <span className="text-xl">{formatTokens(userTokensUsed)}</span>
                Total Usage
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[80%_20%] justify-between pt-10 md:pt-0">
        <div className="md:max-h-[80vh] md:w-[75vw] rounded-md items-end md:border-r-2 mr-2 border-[#5C3BFF]/20 ">
          <div
            ref={containerRefChat}
            className="-mt-7 md:-mt-10 px-10 h-[75vh] md:h-[85vh] overflow-y-auto mb-1 scrollbar-hide custom-scrollbar flex flex-col"
          >
            <div className="pb-14">
              <div
                className={`transition-all duration-700 ${
                  isFoundersMode ? "animate-pulse-slow" : ""
                }`}
              >
                {messages
                  .filter((m) => m.conversation_id === activeConversationId)
                  .map((m) => (
                    <MessageBubble
                      key={m.id}
                      msg={m}
                      model={
                        models.find((mdl) => mdl.id === m.model_used)?.name ||
                        m.model_used ||
                        ""
                      }
                    />
                    
                  ))}
              </div>
               {agentOutputs.map((a) => (
            <AgentCard key={a.phase} agent={a} />
          ))}
           
      {
        report && (
           <div className="relative mt-5 mb-10 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/25 backdrop-blur-xl shadow-xl p-6 transition-all  ">
      {/* Decorative glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-500/10 to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-[#2e147e]">
            Your Generated Report
          </h3>
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
            {new Date().toLocaleDateString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3">
          {report?.pdf && (
            <Link
              href={report.pdf}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <FileText size={18} /> View PDF
            </Link>
          )}

          {report?.pptx && (
            <Link
              href={report.pptx}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Presentation size={18} /> Download Deck
            </Link>
          )}
        </div>

        {/* Palette preview */}
        {report?.palette && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-[#2e147e] flex items-center gap-2">
              <Palette size={16} /> Brand Palette
            </h4>
            <div className="mt-3 relative w-full max-w-sm">
              <Image
                src={report.palette}
                alt="Palette"
                width={400}
                height={200}
                className="rounded-xl shadow-lg ring-1 ring-white/20"
              />
            </div>
          </div>
        )}

        {/* Logos */}
        {report?.logos?.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-[#2e147e]">Generated Logos</h4>
            <div className="mt-3 flex flex-wrap gap-3">
              {report.logos.map((url, i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 hover:scale-105 transition-transform"
                >
                  <Image
                    src={url}
                    alt={`Logo ${i + 1}`}
                    width={100}
                    height={100}
                    className="rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
        )
      }
      
            </div>

            <div className="absolute bottom-1 w-[65vw]">
              <SearchBar
                disabled={isStreaming || !session?.user?.id}
                onSend={(t) => void sendMessage(t)}
                scrollToBottom={scrollToBottom}
                autoScroll={autoScroll}
              />
            </div>
            <div ref={bottomRef} />
          </div>
        </div>

        <div
          ref={containerRef}
          className="md:flex flex-col hidden gap-2 pl-2 px-2 h-[80vh] overflow-y-auto scrollbar-hide custom-scrollbar"
        >
          {sortedConversations.map((c) => (
            <ConversationBubble
              key={`desktop-${c.id}`}
              c={c}
              activeConversationId={activeConversationId}
              setActiveConversationId={setActiveConversationId}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <AnimatePresence>
          {conversationsList && (
            <>
              {/* Overlay */}
              <motion.div
                className="fixed inset-0  backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConversationsList(false)}
              />

              {/* Drawer */}
              <motion.aside
                className="fixed top-0 right-0 h-full bg-violet-200 shadow-lg flex flex-col justify-between"
                initial={{ x: "+100%" }}
                animate={{ x: 0 }}
                exit={{ x: "+100%" }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-3 flex m-3 rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-200 flex-row gap-4 items-center text-center h-fit py-2">
                  <div className="font-medium text-xs text-black flex flex-col text-left">
                    Tokens
                    <span className="text-lg">{formatTokens(userTokens)}</span>
                    Prompt <br /> Load
                  </div>
                  <div className="font-medium text-xs text-black flex flex-col text-left">
                    Tokens
                    <span className="text-lg">
                      {formatTokens(assistantTokens)}
                    </span>
                    AI <br />
                    Response
                  </div>
                  <div className="text-xs font-medium text-gray-900 flex flex-col text-left">
                    Tokens
                    <span className="text-lg">
                      {formatTokens(userTokensUsed)}
                    </span>
                    Total <br />
                    Usage
                  </div>
                </div>

                <div>
                  <div
                    onClick={() => setOpen(!open)}
                    className="text-xs md:hidden cursor-pointer mx-4 mb-2 items-center flex flex-row gap-2 font-semibold text-white h-fit py-2 px-3 rounded-lg bg-gradient-to-r from-[#2000c1] to-[#2e147e] select-none"
                  >
                    <Bot size={20} />
                    {models.find((m) => m.id === model)?.name || model}
                  </div>
                  <h1
                    className="text-xs md:hidden flex cursor-pointer items-center mx-4 mb-3  flex-row gap-2 font-semibold text-white h-fit py-2 px-3 rounded-lg bg-gradient-to-r from-[#2000c1] to-[#2e147e]"
                    onClick={() => createConversation("New Chat")}
                  >
                    <FaPlus />
                    New Chat
                  </h1>
                </div>
                <div
                  ref={containerRef}
                  onClick={() => setConversationsList(false)}
                  className="flex-col md:hidden gap-2 flex px-4 h-[80vh] w-[40vw] overflow-y-auto scrollbar-hide custom-scrollbar"
                >
                  {sortedConversations.map((c) => (
                    <ConversationBubble
                      key={`mobile-${c.id}`}
                      c={c}
                      activeConversationId={activeConversationId}
                      setActiveConversationId={setActiveConversationId}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded shadow"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
