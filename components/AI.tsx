"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "@/lib/SessionContext";
import { supabase } from "@/lib/supabase";
import MessageBubble from "@/components/Chat/MessageBubble";
import ConversationBubble from "@/components/Chat/ConversationBubble";
import SearchBar from "@/components/Chat/SearchBar";
import PremiumPanel from "@/components/Chat/Panel";
import { useSmartAutoScroll } from "@/hooks/useSmartAutoScroll";
import {
  ClassifyData,
  Conversation,
  Message,
  ModelOption,
  ProfileForm,
  Role,
} from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelopeOpenText,
  FaFacebookMessenger,
  FaHistory,
  FaPlus,
} from "react-icons/fa";
import { Bot } from "lucide-react";
import PremiumMVPCard, { MVP as PremiumMVP } from "./Chat/PremiumMvpCard";

// --- MVP types (add near top of AI.tsx) ---
export type MVPFile = {
  name: string;
  content?: string; // code or html/css content
  url?: string;     // data: URL or proxy image URL (optional)
  mime?: string;
};

export type MVP = {
  id?: string;
  user_id?: string;
  created_at?: string;
  name?: string | null;
  description?: string | null;
  summary?: string | null;
  category?: string | null;
  tags?: string[];      // already normalized to array
  files?: MVPFile[];    // normalized to array of MVPFile
  raw_code?: Record<string, string> | null; // optional raw_code object
};

const BACKEND_URL: string = process.env.NEXT_PUBLIC_BACKEND_URL as string;
interface ProjectFile {
  name: string;
  content: string;
}

interface Code {
  html: string;
  css: string;
  js: string;
}

const codeToProjectFiles = (code: Code): ProjectFile[] => [
  { name: "index.html", content: code.html },
  { name: "styles.css", content: code.css },
  { name: "script.js", content: code.js },
];

export default function GaluxiumPage() {
  /* STATE MANAGEMENT BEGINS */

  //User session details
  const { session } = useSession();
  const userId: string | null = session?.user?.id ?? null;
  const [profile, setProfile] = useState<ProfileForm>({
    name: "",
    avatar_url: "",
    email: "",
    username: "",
    plan: "free",
    tokens_used: 0,
  });

  //To manage subscriptions
  const [totalTokensUsed, setTotalTokensUsed] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<"free" | "premium">("free");
  const [userTokens, setUserTokens] = useState<number>(0);
  const [assistantTokens, setAssistantTokens] = useState<number>(0);

  //Display important info
  const [toast, setToast] = useState<string | null>(null);

  //Models used
  const [models, setModels] = useState<ModelOption[]>([]);
  const [model, setModel] = useState<string | null>(null);

  //Modal state
  const [open, setOpen] = useState<boolean>(false);

  //Conversations
  const [conversationsList, setConversationsList] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  //Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  //Streaming
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  //Container based reference
  const containerRef = useRef<HTMLDivElement>(null);
  const { containerRefChat, bottomRef, autoScroll, scrollToBottom } =
    useSmartAutoScroll<HTMLDivElement>([messages]);

  //Website preview panel
  const [premiumOpenForConversation, setPremiumOpenForConversation] = useState<
    Record<string, boolean>
  >({});
  const [premiumLoadingForConversation, setPremiumLoadingForConversation] =
    useState<Record<string, boolean>>({});
  const [premiumLastClassify, setPremiumLastClassify] = useState<
    Record<string, ClassifyData>
  >({});

  /* STATE MANAGEMENT ENDS */

  /* UTILITY FUNCTIONS BEGINS */

  function estimateTokensFromText(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  function tryParsePossibleJsonCode(text: string) {
    if (!text) return null;
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) return null;
      return JSON.parse(text.slice(start, end + 1));
    } catch (e) {
      console.log(e);
      return null;
    }
  }

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

      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  const retryWithJson = async (originalPrompt: string, badJson: string) => {
    const r = await fetch(`${BACKEND_URL}/api/prototype/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        originalPrompt,
        badJson,
      }),
    });
    const json = await r.json();
    return json;
  };

  const setPremiumOpen = (conversationId: string, open: boolean) => {
    setPremiumOpenForConversation((prev) => ({
      ...prev,
      [conversationId]: open,
    }));
  };

  const setPremiumLoading = (conversationId: string, loading: boolean) => {
    setPremiumLoadingForConversation((prev) => ({
      ...prev,
      [conversationId]: loading,
    }));
  };

  

  /* UTILITY FUNCTIONS ENDS */

  /* USE_EFFECT MANAGEMENT BEGINS */

  //Get user details
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) console.error("Error fetching user session => ", error);

        const { data } = await supabase
          .from("users")
          .select(
            "name, avatar_url,username, email,plan,tokens_used,assistantTokens,userTokens"
          )
          .eq("id", session?.user.id)
          .single();

        if (data) setProfile(data);
        setTotalTokensUsed(data?.tokens_used);
        setUserPlan(data?.plan);
        setUserTokens(data?.userTokens);
        setAssistantTokens(data?.assistantTokens);
      } catch (err) {
        console.error("Error fetching user details => ", err);
      }
    })();
  }, []);

  //Get model profiles
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/chat/models`);
        const { data } = await res.json();
        setModels(data);
        if (data.length > 0) setModel(data[0].id);
      } catch (err) {
        console.warn("Failed to fetch models", err);
      }
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
      const r = await fetch(`${BACKEND_URL}/api/chat/${encodeURIComponent(cid)}`);
      if (!r.ok) return console.warn("fetch messages failed", r.status);
      const j = await r.json();

      const msgs = Array.isArray(j.data) ? j.data : [];
      const mvpMap = j.mvpMap || {};

      // attach MVPs directly to each message for easy rendering
      const msgsWithMVP = msgs.map((m:Message) => ({
        ...m,
        mvp: mvpMap[m.id] || null,
      }));

      setMessages(msgsWithMVP);
    } catch (err) {
      console.warn("fetch messages failed", err);
    }
  })();
}, [activeConversationId]);

  //Sort conversations based on creation date and time
  useEffect(() => {
    if (sortedConversations.length === 0) return;
    if (activeConversationId === null) {
      const newest = sortedConversations[0];
      setActiveConversationId(newest.id);
    }
  }, [sortedConversations, activeConversationId]);

  /* USE_EFFECT MANAGEMENT ENDS */

  /* USE_CALLBACK MANAGEMENT BEGINS */

  const showToast = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

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
          model: m.model_used ?? null,
        }),
      });
    } catch (err) {
      console.warn("saveMessage failed", err);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (!userId) {
        showToast("You must be signed in");
        return;
      }
      const accessToken = session?.access_token;
      // Step 0: Estimate user tokens and check plan limit
      const userTokensLocal = estimateTokensFromText(text);
      if (userPlan === "free" && totalTokensUsed + userTokensLocal > 5000) {
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

      // Step 4: Prepare chat history (for search endpoint)
      const history = messagesRef.current
        .filter(
          (m) =>
            m.conversation_id === cid &&
            (m.role === "user" || m.role === "assistant")
        )
        .map((m) => ({ role: m.role as Role, content: m.content }));
      history.push({ role: "user", content: text });

      try {
        // ----------------------------
        // CLASSIFICATION STEP
        // ----------------------------
        // Call /classify (if available) or fallback to heuristic
        let classifyResult = {
          isWebsite: false,
          intentType: "unknown",
          confidence: 0,
        };
        try {
          // --- direct classify fetch ---

          try {
            const r = await fetch(`${BACKEND_URL}/api/prototype/classify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: text }),
            });

            const json = await r.json();
            if (!r.ok) {
              console.warn("classify prompt failed", json);
            } else {
              classifyResult = json;
            }
          } catch (err) {
            console.warn("classify fetch error", err);
          }
          // expects { isWebsite, intentType, confidence, notes }
        } catch (err) {
          // fallback heuristic
          console.log(err);
          const heur =
            /website|landing page|html|css|javascript|build me a site|create a site|web page/i;
          classifyResult = {
            isWebsite: heur.test(text),
            intentType: heur.test(text) ? "landing" : "unknown",
            confidence: heur.test(text) ? 0.6 : 0.0,
          };
        }

        // save classification metadata (for UI / debugging)
        setPremiumLastClassify((prev) => ({ ...prev, [cid!]: classifyResult }));

        // If classifier says it's a website and confidence ok, run generation flow
        const AUTO_OPEN_THRESHOLD = 0.45; // tune as needed
        if (
          classifyResult.isWebsite &&
          classifyResult.confidence >= AUTO_OPEN_THRESHOLD
        ) {
          // OPEN premium panel and call /generate or /followup depending on context
          setPremiumOpen(cid!, true);
          setPremiumLoading(cid!, true);

          // Choose followup vs generate: simple heuristic — if there is a last assistant containing code, call followup.
          // We'll check last assistant message content for pattern of JSON (best-effort)
          const lastAssistant = messagesRef.current
            .slice()
            .reverse()
            .find((m) => m.conversation_id === cid && m.role === "assistant");
          const looksLikeCode =
            lastAssistant &&
            /"<html"|"<!doctype html|\"html\":/.test(
              lastAssistant.content || ""
            );

          // --- direct generate / followup fetch ---
          let genResponse = null;
          try {
            if (looksLikeCode) {
              // try to parse JSON code from last assistant; if parsed, call followup

              const parsed = tryParsePossibleJsonCode(
                lastAssistant?.content ?? ""
              );
              if (parsed) {
                const r = await fetch(`${BACKEND_URL}/api/prototype/followup`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    prompt: text,
                    code: parsed,
                    user_id: userId,
                  }),
                });
                genResponse = await r.json();
                if (!r.ok) throw genResponse;
              } else {
                const r = await fetch(`${BACKEND_URL}/api/prototype/generate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt: text, user_id: userId }),
                });
                genResponse = await r.json();
                if (!r.ok) throw genResponse;
              }
            } else {
              const r = await fetch(`${BACKEND_URL}/api/prototype/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: text, user_id: userId,conversation_id: cid,
    message_id: assistantId }),
              });
              genResponse = await r.json();
              if (!r.ok) throw genResponse;
            }
          } catch (e) {
            console.error("generate/followup failed", e);
            // fallback: try a generate attempt if followup failed and you want that behavior
            try {
              const r = await fetch(`${BACKEND_URL}/api/prototype/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: text, user_id: userId }),
              });
              genResponse = await r.json();
              setPremiumLoading(cid!, false);
              if (!r.ok) throw genResponse;
            } catch (err2) {
              console.error("fallback generate failed", err2);
              genResponse = null;
            }
          }

          // genResponse may be either { html, css, js } or { errorType: 'JSON_PARSE_ERROR', rawResponse }
          if (genResponse?.errorType === "JSON_PARSE_ERROR") {
            // Show the assistant message with an error, leave premium panel open so user can click Retry
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        "[Model produced invalid JSON — open premium panel and retry]",
                    }
                  : m
              )
            );
            // Persist an assistant error message to backend
            const finalAssistantMsg: Message = {
              id: assistantId,
              conversation_id: cid!,
              user_id: userId,
              role: "assistant",
              content: "Model produced invalid website JSON. You can retry.",
              model_used: model,
              created_at: new Date().toISOString(),
            };
            void saveMessageToBackend(finalAssistantMsg);
            // store parse error details in premiumLastClassify to show retry UI if you want
            setPremiumLastClassify((prev) => ({
              ...prev,
              [cid!]: {
                ...(prev[cid!] || {}),
                lastRawResponse: genResponse.rawResponse,
              },
            }));
          } else {
            

            
            
          }

          setPremiumLoading(cid!, false);
          // Update token accounting: count assistant tokens roughly from length
          const assistantTokensLocal = estimateTokensFromText(
            JSON.stringify(genResponse?.html ?? "")
          );
          const totalTokensUsed = userTokensLocal + assistantTokensLocal;
          setTotalTokensUsed((prev) => prev + totalTokensUsed);
          void fetch(`${BACKEND_URL}/api/chat/updateTokens`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              tokens: totalTokensUsed,
              userTokens: userTokensLocal,
              assistantTokens: assistantTokensLocal,
            }),
          });

          // done
          setIsStreaming(false);
          return;
        }

        // ----------------------------
        // FALLBACK: Standard chat flow (search endpoint)
        // ----------------------------
        const resp = await fetch(`${BACKEND_URL}/api/chat/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId,
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

        // Update assistant message immediately
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m))
        );

        const assistantTokensLocal = estimateTokensFromText(reply);

        // Persist assistant message
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

        // Update tokens DB
        const totalTokensUsed = userTokensLocal + assistantTokensLocal;
        setTotalTokensUsed((prev) => prev + totalTokensUsed);
        void fetch(`${BACKEND_URL}/api/chat/updateTokens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            tokens: totalTokensUsed,
            userTokens: userTokensLocal,
            assistantTokens: assistantTokensLocal,
          }),
        });
      } catch (err) {
        console.error("sendMessage error", err);
        showToast("AI response failed");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: (m.content || "") + "\n\n[Request failed]" }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [
      activeConversationId,
      model,
      saveMessageToBackend,
      showToast,
      userId,
      userPlan,
      totalTokensUsed,
      session?.access_token,
    ]
  );

  /* USE_CALLBACK MANAGEMENT ENDS */


  // MVPs fetched from DB
const [mvps, setMvps] = useState<PremiumMVP[]>([]);
const [mvpsLoading, setMvpsLoading] = useState<boolean>(false);

/**
 * Fetch MVPs from Supabase for the current user.
 * If activeConversationId is provided, fetch MVPs for that conversation (helps show context-specific mvps).
 */
const fetchMvps = useCallback(
  async (opts?: { conversationId?: string }) => {
    if (!userId) {
      setMvps([]);
      return;
    }
    setMvpsLoading(true);
    try {
      // Query by user_id, optionally filter by conversation_id
      let query = supabase
        .from("mvps")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (opts?.conversationId) {
        query = query.eq("conversation_id", opts.conversationId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("fetch mvps error", error);
        setToast?.("Failed to load MVPs");
        setMvps([]);
      } else {
        // ensure fields come back as arrays/objects as expected
        const normalized = (data || []).map((row) => {
          // `files` might be stored as JSONB string/object
          let files = row.files ?? [];
          if (typeof files === "string") {
            try { files = JSON.parse(files); } catch {}
          }
          // tags may be stored as stringified JSON
          let tags = row.tags ?? [];
          if (typeof tags === "string") {
            try { tags = JSON.parse(tags); } catch { tags = []; }
          }
          return {
            ...row,
            files,
            tags,
          } as PremiumMVP;
        });
        setMvps(normalized);
      }
    } catch (err) {
      console.error("fetchMvps unexpected error", err);
      setToast?.("Failed to load MVPs (network)");
      setMvps([]);
    } finally {
      setMvpsLoading(false);
    }
  },
  [userId, setToast]
);
// // fetch all user MVPs when user signs in
// useEffect(() => {
//   if (!userId) {
//     setMvps([]);
//     return;
//   }
//   void fetchMvps(); // fetch all MVPs for user
// }, [userId, fetchMvps]);

// optionally fetch MVPs tied to the active conversation (if you prefer scoping)
useEffect(() => {
  if (!userId) return;
  if (!activeConversationId) return;
  void fetchMvps({ conversationId: activeConversationId });
}, [activeConversationId, userId, fetchMvps]);

  return (
    <div className="relative min-h-screen font-sans bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 text-[#0b1220] pt-5">
      <div className="flex flex-row justify-between px-7">
        <h1 className="text-2xl md:text-3xl pl-10 md:pl-0  font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
          Hey {profile?.name}!
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
                      setModel(m.id);
                      setOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-[#2e147e]/80 transition-all duration-200 ${
                      model === m.id ? "bg-white/20" : ""
                    }`}
                  >
                    <p className="font-medium">{m.name}</p>
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
              <span className="text-xl">{formatTokens(totalTokensUsed)}</span>
              Total Usage
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[80%_20%] justify-between pt-10 md:pt-0">
        <div className="md:max-h-[80vh]  rounded-md items-end md:border-r-2 mr-2 border-[#5C3BFF]/20 ">
          <div
            ref={containerRefChat}
            className="-mt-7 md:-mt-10 px-10 h-[75vh] md:h-[85vh] overflow-y-auto mb-1 scrollbar-hide custom-scrollbar flex flex-col"
          >
            <div className="pb-14">
              {messages
  .filter(
    (m) =>
      m.conversation_id === activeConversationId &&
      (m.role === "user" || m.role === "assistant")
  )
  .map((m) => (
    
    <div key={m.id}>
      {m.hasMVP ? (null) : (
        <MessageBubble
      
      msg={m} // now guaranteed to be ChatMessage
      model={
        models.find((mdl) => mdl.id === m.model_used)?.name ||
        m.model_used ||
        ""
      }
    />
      )}
      {m.hasMVP && mvps.length!=0 ? (<div
  ref={containerRef}
  className="md:flex flex-col hidden gap-2 pl-2 px-2 h-[80vh] overflow-y-auto scrollbar-hide custom-scrollbar"
>
  {/* MVPs header */}
  <div className="px-2">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-semibold text-slate-100">My MVPs</h4>
      <button
        className="text-xs text-slate-300 hover:text-white"
        onClick={() => void fetchMvps({ conversationId: activeConversationId ?? undefined })}
      >
        Refresh
      </button>
    </div>

    {mvpsLoading ? (
      <div className="text-xs text-slate-400">Loading MVPs…</div>
    ) : mvps.length === 0 ? (
      <div className="text-xs text-slate-500">No MVPs yet. Generate one with a prompt.</div>
    ) : (
      <div className="flex flex-col gap-3">
        {mvps.map((m) => (
          <div key={m.id} className="p-2">
            <PremiumMVPCard mvp={m} />
          </div>
        ))}
      </div>
    )}
  </div>


</div>) : null}
    </div>
  ))}


                </div>

            <div className="absolute bottom-1 w-[70vw] ">
              <SearchBar
                disabled={isStreaming}
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
              <motion.div
                className="fixed inset-0  backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConversationsList(false)}
              />
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
                      {formatTokens(totalTokensUsed)}
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

      {/* PremiumPanel: show floating panel when classifier triggered */}
      <AnimatePresence>
        {activeConversationId &&
          premiumOpenForConversation[activeConversationId] && (
            <PremiumPanel
              conversationId={activeConversationId}
              generated={
                premiumLastClassify[activeConversationId]?.lastGenerated ?codeToProjectFiles(premiumLastClassify[activeConversationId]!.lastGenerated): null
              }
              loading={!!premiumLoadingForConversation[activeConversationId]}
              onClose={() => setPremiumOpen(activeConversationId, false)}
              onRetry={async () => {
                // Retry: call /retry endpoint using stored rawResponse and original prompt
                const last = premiumLastClassify[activeConversationId];
                if (!last?.lastRawResponse) {
                  showToast("Nothing to retry");
                  return;
                }
                setPremiumLoading(activeConversationId, true);
                const retryResp = await retryWithJson(
                  last.originalPrompt || "Retry",
                  last.lastRawResponse
                );
                if (retryResp?.errorType === "JSON_PARSE_ERROR") {
                  showToast("Retry failed — model still produced bad JSON");
                  setPremiumLastClassify((prev) => ({
                    ...prev,
                    [activeConversationId]: {
                      ...(prev[activeConversationId] || {}),
                      lastRawResponse: retryResp.rawResponse,
                    },
                  }));
                } else {
                  // success
                  setPremiumLastClassify((prev) => ({
                    ...prev,
                    [activeConversationId]: {
                      ...(prev[activeConversationId] || {}),
                      lastGenerated: retryResp,
                    },
                  }));
                }
                setPremiumLoading(activeConversationId, false);
              }}
              onCopyCode={(code) => {
                if (!code) {
                  showToast("No code to copy");
                  return;
                }

                if (typeof code === "string") {
                  navigator.clipboard
                    .writeText(code)
                    .then(() => showToast("Copied code to clipboard"));
                  return;
                }

               
              }}
            />
          )}
      </AnimatePresence>

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
