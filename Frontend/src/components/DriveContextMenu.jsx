import React, { useEffect, useRef } from 'react';
import { Eye, Download, Share2, Star, Trash2, Info, ExternalLink } from 'lucide-react';

const DriveContextMenu = ({
  x,
  y,
  file,
  isOpen,
  onClose,
  onPreview,
  onDownload,
  onShare,
  onToggleFavorite,
  onDelete,
  onDetails
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  // Prevent context menu from clipping off right or bottom of screen
  const menuWidth = 200;
  const menuHeight = 260;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 16);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 16);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-3 py-1.5 border-b border-slate-100 font-semibold text-slate-900 truncate">
        {file.file_name}
      </div>

      <div className="py-1">
        <button
          onClick={() => {
            onPreview(file);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition text-left cursor-pointer"
        >
          <Eye className="w-4 h-4 text-slate-500" />
          <span>Preview</span>
        </button>

        <a
          href={file.file_url}
          download={file.file_name}
          onClick={onClose}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition text-left cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Download</span>
        </a>

        <button
          onClick={() => {
            onShare(file);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition text-left cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-slate-500" />
          <span>Get link</span>
        </button>

        <button
          onClick={() => {
            onToggleFavorite(file._id || file.id);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition text-left cursor-pointer"
        >
          <Star className={`w-4 h-4 ${file.is_favorite ? 'fill-amber-400 text-amber-500' : 'text-slate-500'}`} />
          <span>{file.is_favorite ? 'Remove from Starred' : 'Add to Starred'}</span>
        </button>

        <button
          onClick={() => {
            onDetails(file);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-100 transition text-left cursor-pointer"
        >
          <Info className="w-4 h-4 text-slate-500" />
          <span>File information</span>
        </button>
      </div>

      <div className="pt-1 border-t border-slate-100">
        <button
          onClick={() => {
            onDelete(file._id || file.id, file.file_name);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600 transition text-left cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
          <span>Move to trash</span>
        </button>
      </div>
    </div>
  );
};

export default DriveContextMenu;

