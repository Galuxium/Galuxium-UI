import React, { useEffect, useState } from "react";

export type MVPFile = {
  name: string;
  content?: string;
  mime?: string;
  url?: string;
};

type PreviewModalProps = {
  mvpId: string;                // ✅ Added this
  files: MVPFile[];
  selectedIndex?: number;
  onClose: () => void;
};

export default function PreviewModal({
  mvpId,
  files,
  selectedIndex = 0,
  onClose,
}: PreviewModalProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [currentIndex, setCurrentIndex] = useState<number>(selectedIndex);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const file = files[currentIndex];

  const downloadFile = (f: MVPFile) => {
    const name = f.name || "file.txt";
    const content = f.content ?? "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyCurrent = async () => {
    try {
      await navigator.clipboard.writeText(file?.content ?? "");
      console.log("Copied to clipboard");
    } catch (err) {
      console.warn("copy failed", err);
    }
  };


  if (loading) return <div>Starting Vite server...</div>;
  if (!url) return <div>Preparing live preview...</div>;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", padding: 16
    }}>
      <div style={{ width: "95%", maxWidth: 1000, background: "#0b1220", borderRadius: 12, overflow: "hidden", color: "#dbeafe" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
             <button onClick={() => setTab("code")} style={{ padding: "6px 10px", borderRadius: 8, background: tab === "code" ? "#5b3cff" : "transparent", color: "white", border: "none" }}>Code</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => downloadFile(file)} style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.06)" }}>Download</button>
            <button onClick={copyCurrent} style={{ padding: "6px 10px", borderRadius: 8, background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.06)" }}>Copy</button>
            <button onClick={onClose} style={{ padding: "6px 10px", borderRadius: 8, background: "#ef4444", color: "white", border: "none" }}>Close</button>
          </div>
        </div>

        <div style={{ height: "70vh", display: "flex" }}>
          <div style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.03)", minWidth: 0 }}>
            
              <div style={{ width: "100%", height: "100%", overflow: "auto", padding: 16 }}>
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13, lineHeight: 1.45 }}>
                  <code>{file?.content ?? "No code available"}</code>
                </pre>
              </div>
          </div>

          <aside style={{ width: 260, background: "#07102a", color: "#9fbff8", padding: 12, overflowY: "auto" }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: "#dbeafe" }}>Files</div>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <button onClick={() => { setCurrentIndex(i); setTab("code"); }} style={{ flex: 1, textAlign: "left", padding: "6px 8px", borderRadius: 8, background: currentIndex === i ? "#5b3cff" : "transparent", color: currentIndex === i ? "#fff" : "#9fbff8", border: "none" }}>
                  {f.name}
                </button>
                <button onClick={() => downloadFile(f)} title="download" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.03)", color: "#9fbff8", padding: "6px 8px", borderRadius: 6 }}>↓</button>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
