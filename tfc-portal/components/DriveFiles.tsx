"use client";

import { useState, useEffect, useCallback } from "react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string | null;
  iconLink: string;
  thumbnailLink: string | null;
  isFolder: boolean;
  owner: string;
}

interface Props {
  folderId?: string;
  onFileSelect?: (file: DriveFile) => void;
  compact?: boolean;
}

const FILE_ICONS: Record<string, string> = {
  "application/vnd.google-apps.folder": "📁",
  "application/vnd.google-apps.document": "📄",
  "application/vnd.google-apps.spreadsheet": "📊",
  "application/vnd.google-apps.presentation": "📽️",
  "application/pdf": "📕",
  "video/mp4": "🎬",
  "video/quicktime": "🎬",
  "video/x-msvideo": "🎬",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/gif": "🖼️",
  "image/webp": "🖼️",
  "audio/mpeg": "🎵",
  "audio/wav": "🎵",
  "application/zip": "📦",
  "text/plain": "📝",
  "text/csv": "📊",
};

function getFileIcon(mimeType: string): string {
  if (FILE_ICONS[mimeType]) return FILE_ICONS[mimeType];
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("audio/")) return "🎵";
  return "📄";
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DriveFiles({ folderId, onFileSelect, compact = false }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([]);
  const [currentFolder, setCurrentFolder] = useState(folderId || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [connected, setConnected] = useState(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (currentFolder) params.set("folder_id", currentFolder);
      if (searchDebounced) params.set("search", searchDebounced);

      const res = await fetch(`/api/drive?${params}`);
      const data = await res.json();

      // Handle disconnected state
      if (data.connected === false) {
        setConnected(false);
        setFiles([]);
        setLoading(false);
        return;
      }

      setConnected(true);

      if (!res.ok) {
        setError(data.error || "Failed to load files");
        setFiles([]);
        return;
      }

      // Sort: folders first, then by modified date
      const sorted = (data.files || []).sort((a: DriveFile, b: DriveFile) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
      });

      setFiles(sorted);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }, [currentFolder, searchDebounced]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const navigateToFolder = (file: DriveFile) => {
    setFolderStack((prev) => [...prev, { id: currentFolder, name: "..." }]);
    setCurrentFolder(file.id);
    setSearch("");
  };

  const navigateBack = () => {
    const prev = folderStack[folderStack.length - 1];
    if (prev) {
      setCurrentFolder(prev.id);
      setFolderStack((s) => s.slice(0, -1));
      setSearch("");
    }
  };

  const openFile = (file: DriveFile) => {
    if (file.isFolder) {
      navigateToFolder(file);
    } else if (onFileSelect) {
      onFileSelect(file);
    } else {
      window.open(file.webViewLink, "_blank");
    }
  };

  if (!connected && !loading) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">
          <svg className="mx-auto" width="48" height="48" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H1.2c0 1.55.4 3.1 1.2 4.5l4.2 9.35z" fill="#0066DA"/>
            <path d="M43.65 25.15L29.9 1.35c-1.35.8-2.5 1.9-3.3 3.3L1.2 52.95c-.8 1.4-1.2 2.95-1.2 4.5h27.5l16.15-32.3z" fill="#00AC47"/>
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85L53.5 64.85l-3.75 11.95h10.4c4.95 0 9.55-2.55 13.4-0z" fill="#EA4335"/>
            <path d="M43.65 25.15L57.4 1.35C56.05.55 54.5 0 52.85 0H34.45c-1.65 0-3.2.55-4.55 1.35l13.75 23.8z" fill="#00832D"/>
            <path d="M59.85 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.55 1.2h36.7c1.65 0 3.2-.4 4.55-1.2L59.85 53z" fill="#2684FC"/>
            <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25.15 59.85 53h27.45c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z" fill="#FFBA00"/>
          </svg>
        </div>
        <h3 className="text-text font-heading font-bold text-lg mb-2">Connect Google Drive</h3>
        <p className="text-text-3 text-sm mb-6 max-w-md mx-auto">
          Link your Google Drive to browse and access your files directly from the portal.
        </p>
        <a
          href="/api/drive/connect"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Connect Google Drive
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {folderStack.length > 0 && (
          <button
            onClick={navigateBack}
            className="p-2 rounded-lg bg-surface border border-border hover:border-border-2 cursor-pointer transition-colors text-text-2 hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Search */}
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="tfc-input w-full pl-9"
          />
        </div>

        {/* View Toggle */}
        {!compact && (
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 cursor-pointer transition-colors ${viewMode === "grid" ? "bg-surface-3 text-text" : "bg-surface text-text-3 hover:text-text-2"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 cursor-pointer transition-colors ${viewMode === "list" ? "bg-surface-3 text-text" : "bg-surface text-text-3 hover:text-text-2"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={loadFiles}
          className="p-2 rounded-lg bg-surface border border-border hover:border-border-2 cursor-pointer transition-colors text-text-2 hover:text-text"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {/* Breadcrumb */}
      {folderStack.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-text-3">
          <button onClick={() => { setCurrentFolder(folderId || ""); setFolderStack([]); }} className="hover:text-text cursor-pointer bg-transparent border-none text-text-3 font-body text-xs">
            Root
          </button>
          {folderStack.map((f, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>/</span>
              <span className="text-text-3">...</span>
            </span>
          ))}
          <span>/</span>
          <span className="text-text-2">Current Folder</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red/10 border border-red/20 text-sm">
          <p className="text-red font-semibold mb-1">Unable to connect to Google Drive</p>
          <p className="text-text-2 text-xs">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <span className="inline-block w-5 h-5 border-2 border-red/30 border-t-red rounded-full animate-spin" />
          <span className="ml-3 text-text-3 text-sm">Loading files...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && files.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-text-2 text-sm font-semibold">
            {search ? "No files found" : "This folder is empty"}
          </p>
          <p className="text-text-3 text-xs mt-1">
            {search ? "Try a different search term" : "Files shared with the team will appear here"}
          </p>
        </div>
      )}

      {/* Grid View */}
      {!loading && !error && files.length > 0 && viewMode === "grid" && (
        <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => openFile(file)}
              className="text-left p-3 rounded-xl border border-border bg-surface hover:border-border-2 hover:bg-surface-2 transition-all cursor-pointer group"
            >
              {/* Thumbnail or Icon */}
              <div className="w-full aspect-[4/3] rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-2 overflow-hidden">
                {file.thumbnailLink && !file.isFolder ? (
                  <img
                    src={file.thumbnailLink}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-3xl">${getFileIcon(file.mimeType)}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-3xl">{getFileIcon(file.mimeType)}</span>
                )}
              </div>

              {/* File Info */}
              <p className="text-text text-[12px] font-semibold truncate group-hover:text-red transition-colors">
                {file.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {file.size > 0 && (
                  <span className="text-text-3 text-[10px]">{formatFileSize(file.size)}</span>
                )}
                <span className="text-text-3 text-[10px]">{formatDate(file.modifiedTime)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && !error && files.length > 0 && viewMode === "list" && (
        <div className="border border-border rounded-xl overflow-hidden">
          {files.map((file, i) => (
            <button
              key={file.id}
              onClick={() => openFile(file)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors cursor-pointer ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="text-xl shrink-0">{getFileIcon(file.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-text text-[13px] font-semibold truncate">{file.name}</p>
                <p className="text-text-3 text-[10px]">{file.owner}</p>
              </div>
              {file.size > 0 && (
                <span className="text-text-3 text-[11px] shrink-0">{formatFileSize(file.size)}</span>
              )}
              <span className="text-text-3 text-[11px] shrink-0">{formatDate(file.modifiedTime)}</span>
              <svg className="text-text-3 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setPreviewFile(null)}
        >
          <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-text font-heading font-bold text-sm truncate">{previewFile.name}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tfc-btn-ghost text-xs py-1.5 px-3"
                >
                  Open in Drive
                </a>
                <button onClick={() => setPreviewFile(null)} className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-xl">&times;</button>
              </div>
            </div>
            <div className="p-6">
              <iframe
                src={`https://drive.google.com/file/d/${previewFile.id}/preview`}
                className="w-full rounded-lg border border-border"
                style={{ height: "70vh" }}
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
