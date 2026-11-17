import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download, ExternalLink, FileText, Image as ImageIcon,
  Film, Music, HardDrive, ArrowLeft, Loader2, AlertCircle, Share2
} from 'lucide-react';
import DriveLogo from '../components/DriveLogo';
import { getSharedFile } from '../services/api';

const SharedFile = () => {
  const { shareToken } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShared = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getSharedFile(shareToken);
        if (res.success && res.file) {
          setFile(res.file);
        } else {
          setError(res.message || 'Shared file could not be found or access has been revoked.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load shared file.');
      } finally {
        setLoading(false);
      }
    };

    if (shareToken) {
      fetchShared();
    }
  }, [shareToken]);

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
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20">
        <Link to="/login" className="flex items-center gap-2.5 active:scale-98 transition">
          <DriveLogo size="sm" />
          <span className="font-bold text-lg text-slate-800 tracking-tight font-['Outfit']">
            CloudDrive
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading shared document...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 font-['Outfit'] mb-1">
              File Unavailable
            </h2>
            <p className="text-xs text-slate-500 mb-6">{error}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to CloudDrive</span>
            </Link>
          </div>
        ) : file ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl w-full">
            {/* File Info Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden pr-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  {isImage ? (
                    <ImageIcon className="w-5 h-5" />
                  ) : isVideo ? (
                    <Film className="w-5 h-5" />
                  ) : isAudio ? (
                    <Music className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate font-['Outfit']" title={file.file_name}>
                    {file.file_name}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {formatBytes(file.file_size)} • Shared on {formatDate(file.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={file.file_url}
                  download={file.file_name}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </div>

            {/* File Viewer Box */}
            <div className="p-4 sm:p-6 bg-slate-50 flex items-center justify-center min-h-[260px] sm:min-h-[360px]">
              {isImage ? (
                <img
                  src={file.file_url}
                  alt={file.file_name}
                  className="max-h-[50vh] max-w-full rounded-2xl shadow-md object-contain"
                />
              ) : isVideo ? (
                <video
                  src={file.file_url}
                  controls
                  className="max-h-[50vh] max-w-full rounded-2xl shadow-md"
                />
              ) : isAudio ? (
                <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                  <Music className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-800 mb-4 truncate">{file.file_name}</p>
                  <audio src={file.file_url} controls className="w-full" />
                </div>
              ) : isPDF ? (
                <iframe
                  src={`${file.file_url}#toolbar=1`}
                  title={file.file_name}
                  className="w-full h-[50vh] rounded-2xl border border-slate-200 bg-white"
                />
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-2xs text-blue-600">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{file.file_name}</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Preview is not available for this file format ({ext?.toUpperCase() || 'FILE'}).
                  </p>
                  <a
                    href={file.file_url}
                    download={file.file_name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download file to view</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Shared publicly via CloudDrive</span>
              </span>

              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Direct URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default SharedFile;
