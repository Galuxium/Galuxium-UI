"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { FaPlus, FaTimes, FaDesktop, FaMobileAlt, FaRedo, FaStop, FaRocket } from "react-icons/fa";
import Loading from "@/components/Loading";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/SessionContext";
import { MVPCard } from "@/components/MVPCard";
import axios from "axios";

interface FileContent {
  path: string;
  content: string;
}

interface MVP {
  id: string;
  name: string;
  prompt: string;
  created_at: string;
  files: FileContent[];
  vercel_deployed: boolean;
  githubPushed: boolean;
  vercel_url?: string;
}

interface SupabaseMVP {
  id: string;
  name: string;
  prompt: string;
  created_at: string;
  files: string | FileContent[];
  vercel_deployed: boolean;
  githubPushed: boolean;
  vercel_url?: string;
}

const featureOptions = [
  "Authentication",
  "Database CRUD",
  "AI Assistant",
  "Payment Integration",
];

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function ManageMVPsPage() {
  const [mvps, setMvps] = useState<MVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalStep, setModalStep] = useState<"none" | "create" | "stream">("none");
  const [createForm, setCreateForm] = useState({
    idea: "",
    industry: "",
    audience: "",
    projectName: "",
    features: [] as string[],
  });
  const [files, setFiles] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const router = useRouter();
  const { session } = useSession();

  // PREVIEW STATES
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMvp, setPreviewMvp] = useState<MVP | null>(null);
  const [isStartingPreview, setIsStartingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // publish UI states
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "deploying" | "ready" | "error">("idle");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [vercelConnected, setVercelConnected] = useState(false);
    const [githubToken, setGithubToken] = useState(false);
  const [vercelToken, setVercelToken] = useState(false);
  useEffect(() => {
  if (!session) return;

  const loadUserConnections = async () => {
    try {
      // adjust column names to match your table exactly
      const { data, error } = await supabase
        .from('users')
        .select('githubToken, githubConnected, vercelToken, vercelConnected')
        .eq('id', session.user.id)
        .single();

      if (error) {
        // not fatal — just log
        console.warn('Failed to load connection flags:', error);
        return;
      }

      // Some people store flags as booleans or strings ('true'), handle both.
      const ghConnected =
        data?.githubConnected === true ||
        data?.githubConnected === 'true' ||
        Boolean(data?.githubToken);
      const vcConnected =
        data?.vercelConnected === true ||
        data?.vercelConnected === 'true' ||
        Boolean(data?.vercelToken);

      setGithubConnected(Boolean(ghConnected));
      setVercelConnected(Boolean(vcConnected));
      setGithubToken(data?.githubToken ?? null);
      setVercelToken(data?.vercelToken ?? null);
    } catch (err) {
      console.error('Error loading user connections', err);
    }
  };

  loadUserConnections();
}, [session, setGithubConnected, setVercelConnected]);
  // misc
  const [githubloadingId, setGithubloadingId] = useState<string | null>(null);
  const [vercelloadingId, setVercelLoadingId] = useState<string | null>(null);

  // 🔹 Fetch MVPs
  useEffect(() => {
    if (!session) return router.push("/");

    const fetchMVPs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("mvps")
        .select("*")
        .eq("user_id", session?.user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Error fetching MVPs.");
        setLoading(false);
        return;
      }

      const parsed = (data || []).map((m: SupabaseMVP) => ({
        id: m.id,
        name: m.name,
        prompt: m.prompt,
        created_at: m.created_at,
        githubPushed: m.githubPushed,
        vercel_deployed: m.vercel_deployed,
        vercel_url: m.vercel_url,
        files: typeof m.files === "string" ? JSON.parse(m.files) : m.files || [],
      }));

      setMvps(parsed);
      setLoading(false);
    };

    fetchMVPs();
  }, []);

  // 🔹 MVP Generation Streaming (unchanged)
  useEffect(() => {
    if (modalStep !== "stream") return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const userId = session?.user?.id;
      const accessToken = session?.access_token;
      if (!userId || !accessToken) return setError("Not authenticated.");

      const { idea, industry, audience, projectName, features } = createForm;
      const nameSafe =
        projectName ||
        idea.split(/\s+/).slice(0, 3).join("-").toLowerCase().replace(/[^\w\-]/g, "");
      const formData = { idea, industry, audience, projectName, features };
      const queryParams = new URLSearchParams({
        userId,
        prompt: idea,
        projectName: nameSafe,
        formData: JSON.stringify(formData),
      });

      try {
        const res = await fetch(
          `${API_BASE}/api/mvp/generate-stream?${queryParams.toString()}`,
          { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!res.ok || !res.body) throw new Error("No stream returned from server.");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;

          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (!line.trim() || !line.startsWith("data:")) continue;
            try {
              const json = JSON.parse(line.replace("data: ", ""));
              if (json.filename) setFiles((prev) => [...prev, json.filename]);
              if (json.projectName)
                setDownloadUrl(`${API_BASE}/api/mvp/download/${encodeURIComponent(json.projectName)}`);
              if (json.done) setDone(true);
            } catch (err) {
              console.error("Invalid stream JSON:", err);
            }
          }
        }
      } catch (err) {
        console.error("Streaming error:", err);
        setError("Failed to connect to generation server.");
      }
    });
  }, [modalStep, createForm]);

  // 🔹 Toggle Features
  const toggleFeature = (f: string) =>
    setCreateForm((cf) => ({
      ...cf,
      features: cf.features.includes(f)
        ? cf.features.filter((x) => x !== f)
        : [...cf.features, f],
    }));

  // 🔹 Delete MVP
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("mvps").delete().eq("id", id);
    if (error) return toast.error("Failed to delete MVP");
    toast.success("Deleted!");
    setMvps((prev) => prev.filter((m) => m.id !== id));
  };

  // Handle GitHub push
  const handlePushGithub = async (mvp: MVP) => {
    try {
      setGithubloadingId(mvp.id);
      await axios.put(`${API_BASE}/api/github/push`, {
        files: mvp.files,
        mvpId: mvp.id,
        githubToken
        
      });
      toast.success("Pushed to GitHub");
    } catch (err) {
      console.error(err);
      toast.error("Push failed");
    } finally {
      setGithubloadingId(null);
    }
  };

  // Handle Vercel deploy
  const handleDeployVercel = async (mvp: MVP) => {
    try {
      setVercelLoadingId(mvp.id);
      const res = await axios.put(`${API_BASE}/api/vercel/deploy`, { files: mvp.files, mvpId: mvp.id, name: mvp.name ,vercelToken});
      setMvps(prev => prev.map(item =>
        item.id === mvp.id ? { ...item, vercel_deployed: true, vercel_url: res.data.vercel_url || item.vercel_url } : item
      ));
      toast.success("Deploy started");
      // update publishedUrl if available
      if (res.data.vercel_url) {
        setPublishedUrl(res.data.vercel_url);
        setDeploymentStatus("ready");
      } else {
        setDeploymentStatus("deploying");
      }
    } catch (err) {
      console.error(err);
      toast.error("Deploy failed");
      setDeploymentStatus("error");
    } finally {
      setVercelLoadingId(null);
    }
  };

  // 🔹 Create MVP
  const handleCreate = async () => {
    const { idea, industry, audience } = createForm;
    if (!idea || !industry || !audience) return toast.error("Please fill all fields.");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Authentication required.");

    setFiles([]);
    setDone(false);
    setError(null);
    setDownloadUrl(null);
    setModalStep("stream");
  };

  // ---------- Preview helpers ----------
  const openPreview = async (mvp: MVP) => {
    setPreviewMvp(mvp);
    // Prefer vercel_url if project already deployed
    const url = await fetch(`${API_BASE}/api/mvp/preview`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ files: mvp.files }),
});
;
    setIsStartingPreview(true);
    setPreviewUrl(url);
    setShowPreviewModal(true);
    setDeploymentStatus("idle");
    setPublishedUrl(mvp.vercel_url || null);

    // If the iframe can't load quickly, the overlay will indicate; onLoad handler will clear isStartingPreview
    // we keep isStartingPreview true until iframe reports load (onLoad)
  };

  const stopPreview = () => {
    setShowPreviewModal(false);
    setPreviewUrl(null);
    setPreviewMvp(null);
    setIsStartingPreview(false);
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      // force reload
      const current = iframeRef.current.src;
      iframeRef.current.src = current;
    }
  };

  // publish from preview modal: triggers push + deploy sequentially and shows progress
  const publishFromModal = async () => {
    if (!previewMvp) return;
    if (!githubConnected || !vercelConnected) {
      toast.error("Connect GitHub & Vercel in Settings first.");
      return;
    }
    try {
      setPublishLoading(true);
      setDeploymentStatus("deploying");
      // 1) push to GitHub
      await handlePushGithub(previewMvp);
      // 2) small delay to let GitHub settle
      await new Promise((r) => setTimeout(r, 800));
      // 3) deploy to Vercel
      await handleDeployVercel(previewMvp);
      // success handled in handleDeployVercel (sets publishedUrl or deploying state)
    } catch (err) {
      console.error("Publish failed", err);
      setDeploymentStatus("error");
      toast.error("Publish failed. Check console.");
    } finally {
      setPublishLoading(false);
    }
  };
 

  // ---------- UI ----------
  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 px-10 py-7 text-[#1A1A1A]">
      <div className="mb-7 flex flex-row justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
            Your SaaS MVPs
          </h1>
          <p className="text-lg text-gray-500 mt-2">Build, download, preview, and deploy your MVPs instantly.</p>
        </div>
        <button
          onClick={() => setModalStep("create")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white rounded-xl shadow-md hover:brightness-110"
        >
          <FaPlus /> Create New MVP
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mvps.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No MVPs yet.</div>
        ) : (
          mvps.map((mvp) => (
            <div key={mvp.id} className="relative group">
              <MVPCard
                mvp={mvp}
                onDelete={() => handleDelete(mvp.id)}
                onPushGithub={() => handlePushGithub(mvp)}
                vercelloadingId={vercelloadingId}
                githubloadingId={githubloadingId}
                onDeployVercel={() => handleDeployVercel(mvp)}
              />
              {/* Inline preview + quick actions (appears on hover) */}
              <div className="absolute top-[4vh] left-[15vw] transition-opacity flex gap-2">
                <button
                  onClick={() => openPreview(mvp)}
                  title="Preview"
                  className="px-3 font-semibold py-1 rounded-md bg-white/90 dark:bg-black/80 border-2 border-[#2000c1] shadow-sm text-sm"
                >
                  Preview
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Stream modal */}
      <AnimatePresence>
        {modalStep !== "none" && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-white/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalStep("none")}
            />
            <motion.div
              key="modal"
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg w-[35vw] relative">
                <button
                  onClick={() => setModalStep("none")}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black"
                >
                  <FaTimes />
                </button>

                {modalStep === "create" && (
                  <>
                    <h2 className="text-xl font-bold mb-4">Create Your SaaS MVP</h2>
                    <textarea
                      placeholder="Your startup idea"
                      value={createForm.idea}
                      onChange={(e) => setCreateForm({ ...createForm, idea: e.target.value })}
                      className="w-full border p-2 rounded mb-4"
                    />
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <Input
                        placeholder="Industry"
                        value={createForm.industry}
                        onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })}
                      />
                      <Input
                        placeholder="Audience"
                        value={createForm.audience}
                        onChange={(e) => setCreateForm({ ...createForm, audience: e.target.value })}
                      />
                    </div>
                    <Input
                      placeholder="Project Name (optional)"
                      value={createForm.projectName}
                      onChange={(e) => setCreateForm({ ...createForm, projectName: e.target.value })}
                      className="mb-3"
                    />
                    <div className="grid grid-cols-5 sm:grid-cols-4 gap-2.5 py-4">
                      {featureOptions.map((f) => (
                        <button
                          key={f}
                          onClick={() => toggleFeature(f)}
                          className={`px-3 py-2 rounded text-sm border-2 border-gray-300 ${
                            createForm.features.includes(f)
                              ? "bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white rounded-lg"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="text-right justify-between flex flex-row">
                      <button className="px-5 py-2 mt-3 bg-gradient-to-r from-[#ce7100] to-[#e07b00] text-white rounded-lg">
                        Draft
                      </button>
                      <button
                        onClick={handleCreate}
                        className="px-5 py-2 mt-3 bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white rounded-lg"
                      >
                        Generate MVP
                      </button>
                    </div>
                  </>
                )}

                {modalStep === "stream" && (
                  <>
                    <h2 className="text-xl font-bold mb-4">Generating your MVP...</h2>
                    {error && (
                      <div className="text-red-600 flex items-center gap-2 mb-3">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        {error}
                      </div>
                    )}
                    <div className="w-full bg-gray-200 h-4 mb-4">
                      <div
                        className="h-full rounded-3xl bg-gradient-to-r from-[#2000c1] to-[#2e147e]"
                        style={{ width: done ? "100%" : `${files.length * 5}%` }}
                      />
                    </div>
                    <ul className="text-sm text-gray-600  overflow-auto mb-3 grid grid-cols-2 gap-3">
                      {files.map((f, i) => (
                        <li key={i} className="flex justify-between">
                          <span className="font-semibold text-md">{f}</span>
                          <CheckCircleIcon className="w-5 h-5 text-[#2000c1]" />
                        </li>
                      ))}
                    </ul>
                    {done && downloadUrl && (
                      <div className="text-center mt-4">
                        <a
                          href={downloadUrl}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white rounded-lg"
                          download
                        >
                          <SparklesIcon className="w-5 h-5" /> Download ZIP
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PREVIEW / PUBLISH MODAL */}
      <AnimatePresence>
        {showPreviewModal && previewMvp && (
          <>
            <motion.div
              key="preview-backdrop"
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => stopPreview()}
            />
            <motion.div
              key="preview-modal"
              className="fixed inset-0 z-60 flex items-center justify-center p-6"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <div className="relative w-full max-w-6xl h-[80vh] bg-white dark:bg-black rounded-2xl shadow-xl overflow-hidden">
                {/* Top Controls */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-black">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{previewMvp.name}</div>
                    <div className="h-9 flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                      <button
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          deviceMode === "desktop"
                            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                        onClick={() => setDeviceMode("desktop")}
                      >
                        <FaDesktop />
                      </button>
                      <button
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          deviceMode === "mobile"
                            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                        onClick={() => setDeviceMode("mobile")}
                      >
                        <FaMobileAlt />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => refreshPreview()}
                      className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-900"
                      title="Refresh preview"
                    >
                      <FaRedo />
                    </button>
                    <button
                      onClick={() => stopPreview()}
                      className="px-3 py-1.5 rounded-md bg-red-500 text-white flex flex-row  items-center gap-3"
                    >
                      <FaStop /> Stop
                    </button>
                    <button
                      onClick={() => setShowPublishPanel(true)}
                      className="px-3 py-1.5 rounded-md bg-black text-white flex items-center gap-2"
                    >
                      <FaRocket /> Publish
                    </button>
                  </div>
                </div>

                {/* IFRAME / Center */}
                <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative">
                  {previewUrl ? (
                    <div
                      className={`bg-white dark:bg-gray-900 overflow-hidden ${
                        deviceMode === "mobile" ? "w-[375px] h-[667px] rounded-[25px] border-8 border-gray-800 shadow-2xl" : "w-full h-full"
                      }`}
                    >
                      <iframe
                        ref={iframeRef}
                        className="w-full h-full border-none bg-white dark:bg-gray-900"
                        src={previewUrl}
                        onLoad={() => {
                          setIsStartingPreview(false);
                          // hide iframe overlay if any
                          const overlay = document.getElementById("iframe-error-overlay");
                          if (overlay) overlay.style.display = "none";
                        }}
                        onError={() => {
                          const overlay = document.getElementById("iframe-error-overlay");
                          if (overlay) overlay.style.display = "flex";
                        }}
                      />
                      <div
                        id="iframe-error-overlay"
                        className="absolute inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-10"
                        style={{ display: isStartingPreview ? "flex" : "none" }}
                      >
                        <div className="text-center max-w-md mx-auto p-6">
                          <div className="text-4xl mb-4">🔄</div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Starting Preview
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Loading preview — if this takes long, try refreshing or publishing the project.
                          </p>
                          <button
                            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            onClick={() => refreshPreview()}
                          >
                            Refresh Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="text-lg font-semibold mb-2">No preview URL available</div>
                      <p className="text-sm text-gray-500 mb-4">Try publishing the project to get a live preview URL.</p>
                      <button onClick={() => setShowPublishPanel(true)} className="px-4 py-2 bg-black text-white rounded">Publish</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Publish Panel Modal */}
      <AnimatePresence>
        {showPublishPanel && previewMvp && (
          <>
            <motion.div
              key="publish-backdrop"
              className="fixed inset-0 bg-black/40 z-70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPublishPanel(false)}
            />
            <motion.div
              key="publish-panel"
              className="fixed inset-0 z-80 flex items-center justify-center p-6"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center"><FaRocket /></div>
                    <div>
                      <div className="font-semibold">{previewMvp.name}</div>
                      <div className="text-xs text-gray-500">Publish project (push → deploy)</div>
                    </div>
                  </div>
                  <button onClick={() => setShowPublishPanel(false)} className="text-gray-400">Close</button>
                </div>

                {/* Publish status */}
                {deploymentStatus === "deploying" && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <div className="text-sm text-blue-700">Deployment in progress…</div>
                    </div>
                  </div>
                )}
                {deploymentStatus === "ready" && publishedUrl && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-4">
                    <div className="text-sm text-emerald-700">Published at:</div>
                    <a href={publishedUrl} target="_blank" rel="noreferrer" className="font-mono text-sm break-words text-emerald-700 hover:underline">{publishedUrl}</a>
                  </div>
                )}
                {deploymentStatus === "error" && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                    <div className="text-sm text-red-700">Deployment failed. Try again.</div>
                  </div>
                )}

                {/* Connect hints */}
                {(!githubConnected || !vercelConnected) && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
                    <div className="text-sm font-medium mb-2">Connect services</div>
                    <div className="text-sm text-amber-700">
                      {!githubConnected && (<div>• GitHub not connected</div>)}
                      {!vercelConnected && (<div>• Vercel not connected</div>)}
                    </div>
                    
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    disabled={publishLoading || deploymentStatus === "deploying" || !githubConnected || !vercelConnected}
                    onClick={() => publishFromModal()}
                    className={`flex-1 px-4 py-2 rounded-xl text-white ${publishLoading || deploymentStatus === "deploying" || !githubConnected || !vercelConnected ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
                  >
                    {publishLoading ? "Publishing…" : deploymentStatus === "deploying" ? "Deploying…" : (!githubConnected || !vercelConnected) ? "Connect Services First" : (deploymentStatus === "ready" && publishedUrl ? "Update" : "Publish")}
                  </button>

                  <button
                    onClick={() => { handlePushGithub(previewMvp); }}
                    className="px-4 py-2 rounded-xl border"
                  >
                    Push GitHub
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      

    </div>
  );
}
