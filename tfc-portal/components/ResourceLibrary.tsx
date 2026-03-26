"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Resource {
  id: string;
  client_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  thumbnail_url?: string;
  uploaded_by: string;
  created_at: string;
}

interface CurrentUser {
  name: string;
  email: string;
  type: "client" | "team";
}

interface Props {
  clientId: string;
  currentUser: CurrentUser;
  isTeam: boolean;
}

const CATEGORIES = ["All", "General", "Brand Assets", "Templates", "Content"];

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "PDF", color: "#EF4444" },
  doc: { icon: "DOC", color: "#3B82F6" },
  docx: { icon: "DOC", color: "#3B82F6" },
  xls: { icon: "XLS", color: "#10B981" },
  xlsx: { icon: "XLS", color: "#10B981" },
  ppt: { icon: "PPT", color: "#F59E0B" },
  pptx: { icon: "PPT", color: "#F59E0B" },
  png: { icon: "PNG", color: "#8B5CF6" },
  jpg: { icon: "JPG", color: "#8B5CF6" },
  jpeg: { icon: "JPG", color: "#8B5CF6" },
  gif: { icon: "GIF", color: "#EC4899" },
  svg: { icon: "SVG", color: "#06B6D4" },
  mp4: { icon: "MP4", color: "#E02020" },
  mov: { icon: "MOV", color: "#E02020" },
  mp3: { icon: "MP3", color: "#A78BFA" },
  wav: { icon: "WAV", color: "#A78BFA" },
  zip: { icon: "ZIP", color: "#6B7280" },
  ai: { icon: "AI", color: "#FF6F00" },
  psd: { icon: "PSD", color: "#31A8FF" },
  fig: { icon: "FIG", color: "#A259FF" },
};

const IMAGE_TYPES = ["png", "jpg", "jpeg", "gif", "svg", "webp"];

function getFileIcon(fileType: string) {
  const ext = fileType.toLowerCase().replace(".", "");
  return FILE_ICONS[ext] || { icon: ext.toUpperCase().slice(0, 3) || "FILE", color: "#5A5652" };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourceLibrary({ clientId, currentUser, isTeam }: Props) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources?client_id=${clientId}`);
      if (res.ok) {
        setResources(await res.json());
      }
    } catch {
      // Handle silently
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const filtered = category === "All"
    ? resources
    : resources.filter((r) => r.category === category);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", clientId);
      formData.append("uploaded_by", currentUser.name);
      formData.append("category", category === "All" ? "General" : category);

      try {
        const res = await fetch("/api/resources", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const resource = await res.json();
          setResources((prev) => [resource, ...prev]);
        }
      } catch {
        // Handle silently
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // Handle silently
    }
  };

  const handleDownload = (resource: Resource) => {
    const a = document.createElement("a");
    a.href = resource.file_url;
    a.download = resource.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <h3 className="text-text font-heading text-[15px] font-bold m-0">Resource Library</h3>
          <span className="text-text-3 text-[12px]">{filtered.length} file{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <button
          className="tfc-btn shrink-0"
          style={{ padding: "8px 16px", fontSize: 12 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "+ Upload File"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Category Tabs */}
      <div className="px-5 py-2.5 border-b border-border flex gap-1.5 overflow-x-auto shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`tfc-pill${category === cat ? " active" : ""}`}
            style={{ padding: "6px 14px", fontSize: 12, whiteSpace: "nowrap" }}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {loading && (
          <div className="text-text-3 text-[13px] text-center py-10">Loading resources...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-text-3 text-[13px] text-center py-16">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-30">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
            No resources {category !== "All" ? `in "${category}"` : "uploaded yet"}.
            <br />
            <span className="text-text-3 text-[11px]">Click Upload File to add resources.</span>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((resource) => {
              const ext = resource.file_type.toLowerCase().replace(".", "");
              const isImage = IMAGE_TYPES.includes(ext);
              const icon = getFileIcon(resource.file_type);

              return (
                <div
                  key={resource.id}
                  className="bg-surface border border-border rounded-xl overflow-hidden group transition-colors hover:border-border-2"
                >
                  {/* Thumbnail / Icon */}
                  <div
                    className="h-[120px] flex items-center justify-center relative overflow-hidden"
                    style={{ background: "#0D0D0D" }}
                  >
                    {isImage && resource.thumbnail_url ? (
                      <img
                        src={resource.thumbnail_url}
                        alt={resource.name}
                        className="w-full h-full object-cover"
                      />
                    ) : isImage && resource.file_url ? (
                      <img
                        src={resource.file_url}
                        alt={resource.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="text-[22px] font-bold font-heading tracking-[0.06em] py-2 px-3.5 rounded-lg"
                        style={{
                          background: `${icon.color}15`,
                          color: icon.color,
                          border: `1px solid ${icon.color}30`,
                        }}
                      >
                        {icon.icon}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-text text-[13px] font-medium m-0 truncate" title={resource.name}>
                      {resource.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-text-3 text-[10px] uppercase font-bold tracking-[0.06em]">{ext}</span>
                      <span className="text-text-3 text-[10px]">{formatFileSize(resource.file_size)}</span>
                      <span className="text-text-3 text-[10px] ml-auto">
                        {new Date(resource.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="flex-1 text-[11px] font-semibold py-1.5 rounded-md cursor-pointer font-body transition-colors bg-surface-3 border border-border text-text-2 hover:text-text hover:border-border-2"
                        onClick={() => handleDownload(resource)}
                      >
                        Download
                      </button>
                      {(isTeam || resource.uploaded_by === currentUser.name) && (
                        <button
                          className="text-[11px] font-semibold py-1.5 px-3 rounded-md cursor-pointer font-body transition-colors bg-transparent border border-border text-text-3 hover:text-red hover:border-red"
                          onClick={() => handleDelete(resource.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
