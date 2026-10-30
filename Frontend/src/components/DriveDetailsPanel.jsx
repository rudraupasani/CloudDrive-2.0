import React from 'react';
import {
  X, FileText, Image as ImageIcon, Film, Music, Download,
  Share2, Star, Trash2, ExternalLink, HardDrive, Calendar,
  User, Check, Copy, Folder, Eye, ShieldCheck, Sparkles
} from 'lucide-react';

const DriveDetailsPanel = ({
  file,
  isOpen,
  onClose,
  onToggleFavorite,
  onShare,
  onDelete,
  onPreview,
  copiedId
}) => {
  if (!isOpen) return null;

  const ext = file?.file_name?.split('.').pop()?.toLowerCase();
  const isImage = file?.file_type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const isVideo = file?.file_type?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
  const isAudio = file?.file_type?.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext);
  const isPDF = file?.file_type?.includes('pdf') || ext === 'pdf';

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-84 max-w-[88vw] bg-white border-l border-slate-200 shadow-2xl lg:shadow-none lg:static lg:z-20 h-full flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <span className="font-bold text-sm text-slate-800 font-['Outfit'] truncate">
              {file ? file.file_name : 'File details'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 active:scale-95 transition cursor-pointer"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!file ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <HardDrive className="w-8 h-8 stroke-1" />
            </div>
            <p className="text-xs font-semibold text-slate-600">No file selected</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Click on any file or folder to view its properties and activity.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* File Thumbnail / Preview Banner */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-3 flex flex-col items-center justify-center overflow-hidden group relative">
              {isImage ? (
                <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : isVideo ? (
                <div className="h-36 w-full flex items-center justify-center bg-slate-900 rounded-xl text-emerald-400">
                  <Film className="w-12 h-12" />
                </div>
              ) : isAudio ? (
                <div className="h-36 w-full flex items-center justify-center bg-pink-50 rounded-xl text-pink-500">
                  <Music className="w-12 h-12" />
                </div>
              ) : (
                <div className="h-36 w-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 text-blue-600 shadow-2xs">
                  <FileText className="w-12 h-12 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {ext || 'DOCUMENT'}
                  </span>
                </div>
              )}

              <p className="text-xs font-bold text-slate-800 mt-3 truncate w-full text-center px-1">
                {file.file_name}
              </p>

              {onPreview && (
                <button
                  onClick={() => onPreview(file)}
                  className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Preview file</span>
                </button>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-2 py-1">
              {/* Star Button */}
              <button
                onClick={() => onToggleFavorite(file._id || file.id)}
                className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  file.is_favorite
                    ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title={file.is_favorite ? 'Starred in Redis (Click to unstar)' : 'Add to Starred (Cached in Redis)'}
              >
                <Star className={`w-4 h-4 ${file.is_favorite ? 'fill-amber-400 text-amber-500' : 'text-slate-500'}`} />
                <span className="text-[10px] font-bold">
                  {file.is_favorite ? 'Starred' : 'Star'}
                </span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => onShare(file)}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                title="Get shareable link"
              >
                {copiedId === (file._id || file.id) ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-bold">Share</span>
                  </>
                )}
              </button>

              {/* Download Button */}
              <a
                href={file.file_url}
                download={file.file_name}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                title="Download file"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span className="text-[10px] font-bold">Download</span>
              </a>

              {/* Delete Button */}
              <button
                onClick={() => onDelete(file._id || file.id, file.file_name)}
                className="p-2.5 rounded-xl bg-red-50/70 hover:bg-red-100/80 border border-red-200 text-red-600 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                title="Move to trash"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold">Trash</span>
              </button>
            </div>

            {/* System Properties */}
            <div className="pt-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>File Properties</span>
              </h4>
              <div className="space-y-2.5 text-xs bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium">Type</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[160px] truncate">
                    {file.file_type || ext?.toUpperCase() || 'Binary'}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium">Size</span>
                  <span className="font-semibold text-slate-800">
                    {formatBytes(file.file_size)}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium">Storage Location</span>
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    <span>My Drive</span>
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium">Redis Star Cache</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {file.is_favorite ? (
                      <span className="text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-300">
                        ★ Active in Redis
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Unstarred</span>
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium">Created</span>
                  <span className="font-medium text-slate-800 text-right">
                    {formatDate(file.createdAt)}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500 font-medium">Modified</span>
                  <span className="font-medium text-slate-800 text-right">
                    {formatDate(file.updatedAt || file.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Access & Sharing Details */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Access Management</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">Private workspace</p>
                    <p className="text-[10px] text-slate-500">Only accessible to you</p>
                  </div>
                </div>
                <button
                  onClick={() => onShare(file)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default DriveDetailsPanel;
