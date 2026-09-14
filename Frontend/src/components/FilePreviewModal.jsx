import React, { useEffect } from 'react';
import { X, Download, ExternalLink, Trash2, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Video, Music, HelpCircle } from 'lucide-react';

const FilePreviewModal = ({ file, isOpen, onClose, onDelete, onNext, onPrev }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || !file) return null;

  // Detect file type
  const ext = file.file_name?.split('.').pop()?.toLowerCase();
  const isImage = file.file_type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const isVideo = file.file_type?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
  const isAudio = file.file_type?.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext);
  const isPDF = file.file_type?.includes('pdf') || ext === 'pdf';

  // Format Bytes helper
  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreviewContent = () => {
    if (isImage) {
      return (
        <div className="flex items-center justify-center w-full h-full p-4">
          <img
            src={file.file_url}
            alt={file.file_name}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center w-full h-full p-4 bg-black rounded-lg overflow-hidden">
          <video
            src={file.file_url}
            controls
            autoPlay
            className="max-w-full max-h-[70vh] rounded-lg"
          />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-8 bg-slate-900 text-white rounded-2xl max-w-md mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-2xl flex items-center justify-center mb-6">
            <Music className="w-10 h-10" />
          </div>
          <h4 className="font-bold text-center mb-4 truncate w-full px-4">{file.file_name}</h4>
          <audio
            src={file.file_url}
            controls
            autoPlay
            className="w-full"
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="w-full h-[70vh] rounded-xl overflow-hidden border border-slate-700/30 bg-white">
          <iframe
            src={`${file.file_url}#toolbar=1`}
            title={file.file_name}
            className="w-full h-full"
          />
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl max-w-md mx-auto shadow-2xl border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">{file.file_name}</h3>
        <p className="text-xs text-slate-500 mt-2">
          Preview is not supported for this file type ({ext?.toUpperCase() || 'Unknown'}).
        </p>
        <div className="flex gap-3 mt-6 w-full">
          <a
            href={file.file_url}
            download={file.file_name}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </a>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl bg-slate-950/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-slate-950/80 text-white z-10">
          <div className="min-w-0 flex-1 pr-4">
            <h3 className="text-sm sm:text-base font-bold truncate tracking-tight">{file.file_name}</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">
              {formatBytes(file.file_size)} • Uploaded on {new Date(file.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={file.file_url}
              download={file.file_name}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>
            
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {onDelete && (
              <button
                onClick={() => onDelete(file._id, file.file_name)}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition cursor-pointer"
                title="Delete File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="h-6 w-px bg-white/10 mx-1" />

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body & Viewer Area */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 min-h-[50vh]">
          {/* Navigation Controls */}
          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white border border-white/5 hover:scale-105 transition cursor-pointer z-10"
              title="Previous File"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {renderPreviewContent()}

          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white border border-white/5 hover:scale-105 transition cursor-pointer z-10"
              title="Next File"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default FilePreviewModal;
