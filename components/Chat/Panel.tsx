"use client";

import React, { useState, useEffect, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { material } from "@uiw/codemirror-theme-material";
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────

export interface ProjectFile {
  name: string;   // full path, e.g. "src/components/App.jsx"
  content: string;
}

export interface PanelProps {
  generated: ProjectFile[] | null;
  conversationId: string;      
  loading?: boolean;
  onClose: () => void;
  onRetry: () => Promise<void>;
  onCopyCode: (files: ProjectFile[]) => void;
}

// ─── HELPERS ───────────────────────────────────────────────────────────

// Folder node structure
interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
}

function buildFileTree(files: ProjectFile[]): FileNode[] {
  const root: FileNode[] = [];

  files.forEach((file) => {
    const parts = file.name.split("/");
    let currentLevel = root;

    parts.forEach((part, idx) => {
      const isFile = idx === parts.length - 1;
      let existing = currentLevel.find((n) => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: currentLevel.map((n) => n.name).join("/") + "/" + part,
          type: isFile ? "file" : "folder",
          ...(isFile ? { content: file.content } : { children: [] }),
        };
        currentLevel.push(existing);
      }

      if (!isFile) {
        currentLevel = existing.children!;
      }
    });
  });

  return root;
}


// Map file extension → CodeMirror language
const extensionsMap: Record<string, ReturnType<typeof javascript>> = {
  js: javascript({ jsx: true }),
  jsx: javascript({ jsx: true }),
  ts: javascript({ jsx: true }),
  tsx: javascript({ jsx: true }),
  html: html(),
  css: css(),
  json: javascript(),
};



// Detect language extension
function getLanguageByFileName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return extensionsMap[ext] || javascript();
}

// ─── COMPONENT ──────────────────────────────────────────────────────────

const Panel: React.FC<PanelProps> = ({
  generated,
  loading = false,
  onClose,
  onRetry,
  onCopyCode,
}) => {
  const files = useMemo(() => generated ?? [], [generated]);

  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const fileTree = useMemo(() => buildFileTree(files), [files]);

  useEffect(() => {
    if (files.length) setActiveFile(files[0]);
  }, [files]);

  // Build live preview
  const htmlFile = files.find((f) => f.name.endsWith(".html"));
  const cssFile = files.find((f) => f.name.endsWith(".css"));
  const jsFile = files.find((f) => f.name.endsWith(".js") || f.name.endsWith(".jsx"));

  const previewContent = useMemo(() => {
    return (
      htmlFile?.content ||
      `
      <html>
        <head>
          <style>${cssFile?.content || ""}</style>
        </head>
        <body>
          <div id="root"></div>
          <script>${jsFile?.content || ""}</script>
        </body>
      </html>
    `
    );
  }, [htmlFile, cssFile, jsFile]);

  // ─── Folder Tree Rendering ──────────────────────────────
  const toggleFolder = (path: string) => {
  setExpandedFolders((prev) => {
    const next = new Set(prev);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    return next;
  });
};


  const renderTree = (nodes: FileNode[]) => (
    <>
      {nodes.map((node) =>
        node.type === "folder" ? (
          <div key={node.path}>
            <div
              onClick={() => toggleFolder(node.path)}
              className="flex items-center gap-1 px-3 py-1 text-gray-300 hover:bg-gray-800 cursor-pointer text-sm"
            >
              {expandedFolders.has(node.path) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              {expandedFolders.has(node.path) ? (
                <FolderOpen size={14} />
              ) : (
                <Folder size={14} />
              )}
              <span>{node.name}</span>
            </div>
            {expandedFolders.has(node.path) && node.children && (
              <div className="pl-5 border-l border-gray-700">
                {renderTree(node.children)}
              </div>
            )}
          </div>
        ) : (
          <div
            key={node.path}
            onClick={() =>
              setActiveFile({ name: node.path, content: node.content ?? "" })
            }
            className={`flex items-center gap-1 px-3 py-1 text-sm truncate cursor-pointer ${
              activeFile?.name === node.path
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <FileCode size={14} /> {node.name}
          </div>
        )
      )}
    </>
  );

  return (
    <div className="fixed right-5 top-20 w-[65vw] h-[80vh] z-[110] shadow-2xl rounded-xl overflow-hidden bg-white flex flex-col border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
        <div className="flex gap-2">
          {(["preview", "code"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {loading && <div className="text-sm text-gray-500 px-2">Generating…</div>}
          <button
            onClick={() => onCopyCode(files)}
            className="px-3 py-1 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-900"
          >
            Copy
          </button>
          <button
            onClick={onRetry}
            className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 min-h-0">
        {/* File Explorer */}
        {activeTab === "code" && (
          <div className="w-56 bg-gray-900 text-gray-200 overflow-y-auto border-r border-gray-700">
            {renderTree(fileTree)}
          </div>
        )}

        {/* Editor / Preview */}
        <div className="flex-1">
          {activeTab === "preview" && (
            <iframe
              key={refreshKey}
              srcDoc={previewContent}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          )}

          {activeTab === "code" && activeFile && (
            <CodeMirror
              value={activeFile.content}
              extensions={[getLanguageByFileName(activeFile.name)]}
              height="100%"
              theme={material}
              onChange={(value) =>
                setActiveFile((prev) =>
                  prev ? { ...prev, content: value } : null
                )
              }
            />
          )}
        </div>
      </div>

      {/* Footer */}
      {activeTab === "preview" && (
        <div className="p-2 border-t bg-gray-50 flex justify-end">
          <button
            onClick={() => setRefreshKey(Date.now())}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Refresh Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default Panel;
