"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  FaGithub,
  FaStar,
  FaTrash,
  FaDownload,
  FaEdit,
} from "react-icons/fa";
import { SiNetlify, SiVercel } from "react-icons/si";

dayjs.extend(relativeTime);

interface FileContent {
  path: string;
  content: string;
}

export interface MVP {
  id: string;
  name: string;
  prompt: string;
  created_at: string;
  files: FileContent[];
  vercel_deployed?: boolean;
  netlify_deployed?: boolean;
  netlify_url?: string;
  github_pushed?: boolean;
  ai_model?: string;
}

interface MVPCardProps {
  mvp: MVP;
  onDelete?: (id: string) => void;
  onPushGithub?: (id: string) => void;
  onDeployVercel?: (id: string) => void;
  onDeployNetlify?: (id: string) => void;
}

export const MVPCard: React.FC<MVPCardProps> = ({
  mvp,
  onDelete,
  onPushGithub,
  onDeployVercel,
  onDeployNetlify,
}) => {
  const downloadUrl = `/api/mvp/download/${encodeURIComponent(mvp.name)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 flex flex-col justify-between h-full"
    >
      {/* Title */}
      <div className="flex flex-row justify-between">
        <div>
          <h3 className="text-2xl font-bold">{mvp.name}</h3>

      {/* Date */}
      <div className="text-sm bg-gradient-to-r py-2 from-[#2000c1] to-[#2e147e] text-transparent bg-clip-text font-semibold">
        {dayjs(mvp.created_at).format("MMM D, YYYY · h:mm A")} &nbsp;
        <span>({dayjs(mvp.created_at).fromNow()})</span>
      </div>
        </div>
    <div className="flex flex-row gap-3">
      <Link href={downloadUrl} className="flex-1" download>
          <div className="w-fit hover:scale-95 duration-500 text-center p-3 font-bold text-md rounded-lg bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white hover:brightness-90 transition-all flex items-center justify-center gap-2">
            <FaDownload />
          </div>
        </Link>
        <Link href={`/customize/${mvp.id}`} className="flex-1">
          <div className="w-full px-3 hover:scale-95 duration-500 text-center py-3 text-md rounded-lg font-bold hover:bg-gray-400 text-[#1A1A1A] bg-gray-300 transition-all flex items-center justify-center gap-2">
            <FaEdit />
          </div>
        </Link>
    </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3 py-3">
        <StatusBadge
          active={!!mvp.github_pushed}
          activeLabel="GitHub Pushed"
          inactiveLabel="Not Pushed"
          icon={<FaGithub />}
          color="bg-black"
        />
        <StatusBadge
          active={!!mvp.vercel_deployed}
          activeLabel="Deployed"
          inactiveLabel="Not Deployed"
          icon={<SiVercel />}
          color="bg-gray-800"
        />
        <StatusBadge
          active={!!mvp.netlify_deployed}
          activeLabel="Deployed"
          inactiveLabel="Not Deployed"
          icon={<SiNetlify />}
          color="bg-cyan-600"
        />
        <div className="bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
          <FaStar /> {mvp.ai_model || "Mistral 8x7b"}
        </div>
        
      </div>

      {/* Prompt */}
      <p className="text-md text-gray-700 font-semibold line-clamp-3">
        <span className="font-bold">Prompt</span>
        <br />
        {mvp.prompt}
      </p>

      {/* Files List */}
      <ul className="text-xs text-gray-600 max-h-44 overflow-auto my-3 space-y-1">
        {mvp.files.length === 0 ? (
          <li>No files available</li>
        ) : (
          mvp.files.map((f, i) => (
            <li key={i}>
              <code className="font-semibold">{f.path}</code>
            </li>
          ))
        )}
      </ul>

      {/* Actions */}
      <div className="flex flex-row gap-2 mt-3">
        
        {/* Deployment Actions */}
        {!mvp.github_pushed && (
          <button
            onClick={() => onPushGithub?.(mvp.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-semibold hover:scale-95 transition duration-500"
          >
            <FaGithub /> Push
          </button>
        )}
        {!mvp.vercel_deployed || (
          <button
            onClick={() => onDeployVercel?.(mvp.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl font-semibold hover:scale-95 transition duration-500"
          >
            <SiVercel /> Vercel
          </button>
        )}
        {!mvp.netlify_deployed && (
          <button
            onClick={() => onDeployNetlify?.(mvp.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold hover:scale-95 transition duration-500"
          >
            <SiNetlify /> Netlify
          </button>
        )}
        <button
          onClick={() => onDelete?.(mvp.id)}
          className="bg-red-700 text-white px-5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:scale-95 transition duration-500"
        >
          <FaTrash />
        </button>
        
      </div>

      
    </motion.div>
  );
};

// Badge Component
const StatusBadge = ({
  active,
  activeLabel,
  inactiveLabel,
  icon,
  color,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div
    className={`${color} text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5`}
  >
    {icon} {active ? activeLabel : inactiveLabel}
  </div>
);
