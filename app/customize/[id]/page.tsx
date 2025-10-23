"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";

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
}

export default function CustomizeMVP() {
  const { id } = useParams();
  const [mvp, setMvp] = useState<MVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchMVP = async () => {
      const { data, error } = await supabase
        .from("mvps")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Failed to fetch MVP");
        return;
      }

      const parsedFiles = typeof data.files === "string" ? JSON.parse(data.files) : data.files || [];

      setMvp({
        id: data.id,
        name: data.name,
        prompt: data.prompt,
        created_at: data.created_at,
        files: parsedFiles,
      });

      setSelectedFile(parsedFiles[0] ?? null);
      setLoading(false);
    };

    fetchMVP();
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;

    try {
      setDownloading(true);
      const response = await fetch(`http://localhost:5000/api/mvp/download/${mvp?.name}`);
      if (!response.ok) {
        throw new Error("Failed to download ZIP");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${mvp?.name || "project"}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
      setDownloading(false);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download ZIP");
      setDownloading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10">
      {/* Left: File Tree */}
      <div className="w-1/4 bg-gradient-to-br from-[#2000c1]/10 to-[#2e147e]/10 border-r border-white/10 p-10 overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-4">📁 Files</h2>
        <ul className="space-y-2">
          {mvp?.files.map((file, index) => (
            <li key={index}>
              <button
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition 
                  ${
                    selectedFile?.path === file.path
                      ? "bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-gray-100 shadow-lg"
                      : "text-gray-800 hover:bg-black/10 hover:text-gray-900"
                  }`}
              >
                {file.path}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: Code Viewer */}
      <div className="w-3/4 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">{selectedFile?.path}</h2>
          <button
            onClick={handleDownload}
            className="px-5 py-3 text-sm font-semibold bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-gray-100 rounded-xl hover:scale-95 transition transform shadow-lg duration-400"
            disabled={downloading}
          >
            {downloading ? "Preparing ZIP..." : "Download ZIP"}
          </button>
        </div>

        <pre className="bg-[#0f172a] text-[#96ffb2] p-6 rounded-xl shadow-inner overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {selectedFile?.content}
        </pre>
      </div>
    </div>
  );
}
