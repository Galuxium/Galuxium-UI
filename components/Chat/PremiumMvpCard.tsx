import React, { useMemo, useState } from "react";
import PreviewModal, { MVPFile } from "./PreviewModal";

export type MVP = {
  id?: string;
  user_id?: string;
  created_at?: string;
  name?: string;
  description?: string;
  summary?: string;
  category?: string;
  tags?: string[] | string; // DB may store json-string
  files?: MVPFile[];
  raw_code?: Record<string, string> | null;
};

type Props = {
  mvp: MVP;
};

/** Build a small srcDoc for thumbnail using index.html + css + js */
function buildSrcDocFromFiles(files?: MVPFile[]) {
  if (!files) return "";
  const html = files.find((f) => /(^|\/)index\.html$/i.test(f.name))?.content ?? files.find((f) => f.name.toLowerCase().endsWith(".html"))?.content ?? "";
  const css = files.find((f) => f.name.toLowerCase().endsWith(".css"))?.content ?? "";
  const js = files.find((f) => f.name.toLowerCase().endsWith(".js"))?.content ?? "";
  if (!html && !css && !js) return "";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head>
<body>${html}<script>${js}</script></body>
</html>`;
}

export default function PremiumMVPCard({ mvp }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const tags = useMemo(() => {
    if (!mvp.tags) return [] as string[];
    if (Array.isArray(mvp.tags)) return mvp.tags;
    try {
      const parsed = JSON.parse(String(mvp.tags));
      return Array.isArray(parsed) ? parsed : [String(mvp.tags)];
    } catch {
      return String(mvp.tags).replace(/^\[|\]$/g, "").split(",").map(s => s.trim()).filter(Boolean);
    }
  }, [mvp.tags]);

  const srcDoc = useMemo(() => buildSrcDocFromFiles(mvp.files ?? []), [mvp.files]);

  const hasImageFile = (mvp.files ?? []).find((f) => f.mime?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(f.name));
  const imageFile = hasImageFile ?? undefined;

  function downloadFile(f: MVPFile) {
    const name = f.name || "file.txt";
    const blob = new Blob([f.content ?? ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    // Download each file separately (simple, avoids zip dependency)
    (mvp.files || []).forEach((f) => downloadFile(f));
  }

  async function copyAllCode() {
    const raw = (mvp.raw_code && typeof mvp.raw_code === "object")
      ? JSON.stringify(mvp.raw_code, null, 2)
      : (mvp.files || []).map(f => `/* --- ${f.name} --- */\n${f.content ?? ""}\n`).join("\n");
    try {
      await navigator.clipboard.writeText(raw);
      console.log("copied");
    } catch (err) {
      console.warn("copy failed", err);
    }
  }

  return (
    <div style={{ borderRadius: 12, background: "linear-gradient(180deg,#07102a,#061022)", padding: 14, color: "#dbeafe", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, color: "#fff" }}>{mvp.name}</h3>
          {mvp.description && <p style={{ marginTop: 6, color: "#cfe7ff" }}>{mvp.description}</p>}
          {mvp.summary && <p style={{ marginTop: 6, color: "#9fbff8", fontStyle: "italic" }}>{mvp.summary}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {mvp.category && <span style={{ fontSize: 12, padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>{mvp.category}</span>}
            {tags.map((t, i) => <span key={i} style={{ fontSize: 12, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>#{t}</span>)}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={() => setOpen(true)} style={{ padding: "8px 12px", borderRadius: 8, background: "#5b3cff", color: "white", border: "none" }}>Open Preview</button>
            <button onClick={copyAllCode} style={{ padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.04)", color: "#dbeafe" }}>Copy Code</button>
            <button onClick={downloadAll} style={{ padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.04)", color: "#dbeafe" }}>Download Files</button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#9fbff8" }}>
            <div>ID: {mvp.id}</div>
            <div>User: {mvp.user_id}</div>
            <div>Created: {mvp.created_at ? new Date(mvp.created_at).toLocaleString() : "—"}</div>
          </div>
        </div>

        <div style={{ width: 260, minWidth: 260 }}>
          {srcDoc ? (
            <div style={{ width: "100%", height: 160, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
              <iframe title={`${mvp.name}-thumb`} srcDoc={srcDoc} sandbox="allow-scripts allow-same-origin" style={{ width: "100%", height: "100%", border: 0 }} />
            </div>
          ) : imageFile ? (
            <div style={{ width: "100%", height: 160, borderRadius: 8, overflow: "hidden", background: "#07102a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={imageFile.url ?? `data:image/png;base64,${btoa(imageFile.content ?? "")}`} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{ width: "100%", height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#9fbff8", borderRadius: 8, background: "#061022" }}>
              No preview available
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(mvp.files || []).map((f, i) => (
          <button 
          className="text-xs    "
          key={i} onClick={() => { setSelectedFileIndex(i); setOpen(true); }} style={{ padding: "6px 8px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.03)", color: "#9fbff8", cursor: "pointer"  }}>
            {f.name}
          </button>
        ))}
      </div>

      {open && (
  <PreviewModal
    mvpId={mvp.id!} // ✅ Pass id
    files={(mvp.files ?? []).map(f => ({
      name: f.name,
      content: f.content,
      mime: f.mime,
      url: f.url
    }))}
    selectedIndex={selectedFileIndex}
    onClose={() => setOpen(false)}
  />
)}

    </div>
  );
}
