"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { FaPlus, FaTimes } from "react-icons/fa";
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
  "Landing Page",
  "Authentication",
  "Database CRUD",
  "Payment Integration",
  "Admin Panel",
  "File Upload",
  "Email Notifications",
  "Analytics Dashboard",
];

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
  }, [session, router]);

  // 🔹 MVP Generation Streaming
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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mvp/generate-stream?${queryParams.toString()}`,
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
                setDownloadUrl(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mvp/download/${encodeURIComponent(json.projectName)}`
                );
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

const [githubloadingId, setGithubloadingId] = useState<string | null>(null);
// Handle GitHub push
const handlePushGithub = async (mvp:MVP) => {


  try {
    setGithubloadingId(mvp.id);
    const repoName = prompt("Enter repository name");
    if (!repoName) return;

    await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/github/push`, {
      repoName,
      files: mvp.files,
      mvpId:mvp.id
    });

    alert("Pushed to GitHub!");
    setGithubloadingId(null);
  } catch (err) {
    console.error(err);
    alert("Push failed");
  }
};


const [vercelloadingId, setVercelLoadingId] = useState<string | null>(null);

const handleDeployVercel = async (mvp: MVP) => {
  try {
    setVercelLoadingId(mvp.id);
    const res = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vercel/deploy`, { files: mvp.files, mvpId: mvp.id,name:mvp.name });
    setMvps(prev => prev.map(item =>
      item.id === mvp.id ? { ...item, vercel_deployed: true, vercel_url: res.data.vercel_url } : item
    ));
  } catch (err) {
    console.error(err);
    alert("Deploy failed");
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

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 px-10 py-7 text-[#1A1A1A]">
      <div className="mb-7 flex flex-row justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
            Your SaaS MVPs
          </h1>
          <p className="text-lg text-gray-500 mt-2">Build, download, and scale your MVPs instantly.</p>
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
            <MVPCard
              key={mvp.id}
              mvp={mvp}
              onDelete={() => handleDelete(mvp.id)}
              onPushGithub={() => handlePushGithub(mvp)}
              vercelloadingId={vercelloadingId}
              githubloadingId={githubloadingId}
              onDeployVercel={() => handleDeployVercel(mvp)}
            />
          ))
        )}
      </div>

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
              <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-md relative">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-4">
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
                        style={{ width: done ? "100%" : `${files.length * 6}%` }}
                      />
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 overflow-auto mb-3">
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
    </div>
  );
}
