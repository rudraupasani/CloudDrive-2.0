import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DriveLogo from '../components/DriveLogo';
import {
  Search, Plus, HardDrive, Clock, Star, Trash2,
  LogOut, FileText, Image as ImageIcon, Folder, MoreVertical, Download,
  Share2, UploadCloud, ChevronRight, Grid, ListFilter, User, Loader2,
  AlertCircle, ExternalLink, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataUsage from '../components/DataUsage';
import { getUserFiles, uploadFileMetadata, deleteUserFile, getUserProfile } from '../services/api';
import { uploadFile } from '../lib/uploadFile';
import FilePreviewModal from '../components/FilePreviewModal';

const Dashboard = () => {
  const { user, logout, setUser: setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mydrive');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Files state
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Preview Modal state
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load files from backend
  const fetchFiles = async () => {
    try {
      setLoadingFiles(true);
      const res = await getUserFiles();
      if (res.success) {
        setFiles(res.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Refresh profile info to update storage usage in sidebar
  const refreshProfile = async () => {
    try {
      const res = await getUserProfile();
      if (res.success && (res.userData || res.user)) {
        const data = res.userData?._doc || res.userData || res.user;
        setAuthUser(data);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Trigger file selection input
  const handleUploadClick = () => {
    if (uploading) return;
    setUploadError('');
    setUploadSuccess('');
    fileInputRef.current?.click();
  };

  // Handle selected file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess('');

      const userId = user?._id || user?.id || 'unknown';

      // 1. Upload to Supabase Storage
      const publicUrl = await uploadFile(file, userId);

      // 2. Save metadata to Backend
      const res = await uploadFileMetadata({
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        file_url: publicUrl
      });

      if (res.success) {
        setUploadSuccess(`"${file.name}" uploaded successfully!`);
        await fetchFiles();
        await refreshProfile();
      } else {
        throw new Error(res.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${fileName}"?`)) {
      return false;
    }

    try {
      const res = await deleteUserFile(fileId);
      if (res.success) {
        setFiles(prev => prev.filter(f => f._id !== fileId));
        await refreshProfile();
        return true;
      } else {
        alert(res.message || 'Failed to delete file.');
        return false;
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete file.');
      return false;
    }
  };

  // Delete wrapper for preview modal
  const handleDeleteFromPreview = async (fileId, fileName) => {
    const success = await handleDeleteFile(fileId, fileName);
    if (success) {
      setPreviewOpen(false);
      setSelectedPreviewFile(null);
    }
  };

  // Icon type mapper
  const getFileIcon = (type, name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return { icon: ImageIcon, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    }
    if (type?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' };
    }
    if (type?.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext)) {
      return { icon: FileText, color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200' };
    }
    if (type?.includes('pdf') || ext === 'pdf') {
      return { icon: FileText, color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    }
    if (type?.includes('word') || type?.includes('document') || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    }
    if (type?.includes('zip') || type?.includes('rar') || type?.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: Folder, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    }
    return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Filter files by search query
  const filteredFiles = files.filter(f =>
    f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination index trackers for preview modal
  const currentPreviewIndex = selectedPreviewFile
    ? filteredFiles.findIndex(f => f._id === selectedPreviewFile._id)
    : -1;

  const handlePrevFile = () => {
    if (currentPreviewIndex > 0) {
      setSelectedPreviewFile(filteredFiles[currentPreviewIndex - 1]);
    }
  };

  const handleNextFile = () => {
    if (currentPreviewIndex >= 0 && currentPreviewIndex < filteredFiles.length - 1) {
      setSelectedPreviewFile(filteredFiles[currentPreviewIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans']">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        id="dashboard-file-upload"
      />

      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-30 shadow-xs">

        {/* Left Logo */}
        <div className="flex items-center gap-3 w-64">
          <DriveLogo size="sm" />
          <span className="font-bold text-lg text-slate-900 tracking-tight font-['Outfit']">
            CloudDrive
          </span>
        </div>

        {/* Search input bar */}
        <div className="flex flex-1 max-w-2xl mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex cursor-pointer items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition border border-slate-200"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Drive User'}</h4>
                    <p className="text-xs text-slate-500 truncate">{user?.email || 'user@drive.com'}</p>
                  </div>
                </div>

                <div className="py-3 px-3 space-y-1.5">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full cursor-pointer flex items-center justify-between px-3 py-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-5 text-blue-600" />
                      <span>Profile</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 p-4 flex flex-col justify-between bg-white hidden md:flex">

          <div className="space-y-6">
            {/* New Upload Button */}
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2.5 transition transform hover:scale-[1.01] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Upload File</span>
                </>
              )}
            </button>

            {/* Sidebar Nav */}
            <nav className="space-y-1 text-sm font-medium">
              <button
                onClick={() => setActiveTab('mydrive')}
                className={`w-full flex cursor-pointer items-center gap-3 px-4 py-2.5 rounded-xl transition ${activeTab === 'mydrive' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>My Drive</span>
              </button>

              <button
                onClick={() => setActiveTab('recent')}
                className={`w-full flex cursor-pointer items-center gap-3 px-4 py-2.5 rounded-xl transition ${activeTab === 'recent' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Clock className="w-4 h-4" />
                <span>Recent Files</span>
              </button>
            </nav>
          </div>

          {/* Storage Quota Footer */}
          <DataUsage />

        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">

          {/* Notification Banners */}
          {uploadError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button onClick={() => setUploadError('')} className="text-red-500 hover:text-red-700 font-bold">Dismiss</button>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
              <button onClick={() => setUploadSuccess('')} className="text-emerald-500 hover:text-emerald-700 font-bold">Dismiss</button>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-['Outfit']">
                Welcome back, {user?.name || 'User'} 👋
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Access, upload, and organize your cloud workspace files.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-2xs">
                <Grid className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-2xs">
                <ListFilter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Files Section */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>{activeTab === 'mydrive' ? 'All Files' : 'Recent Files'}</span>
            </h2>

            {loadingFiles ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs text-slate-500 mt-3 font-semibold">Loading your workspace files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-2xs">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-slate-900 font-['Outfit']">No files in your cloud yet</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
                  {searchQuery ? `No files matching "${searchQuery}" could be found.` : 'Upload documents, images, video or zip archives directly to your personal drive.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="mt-5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition cursor-pointer"
                  >
                    Upload First File
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                {filteredFiles.map((file) => {
                  const iconStyle = getFileIcon(file.file_type, file.file_name);
                  const IconComponent = iconStyle.icon;
                  return (
                    <div
                      key={file._id}
                      onClick={() => {
                        setSelectedPreviewFile(file);
                        setPreviewOpen(true);
                      }}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:scale-[1.01] transition flex flex-col justify-between h-44 group relative cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2.5 rounded-xl ${iconStyle.bg} ${iconStyle.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>

                          {/* Options / Action Menu */}
                          <div
                            className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()} // Stop modal from opening
                          >
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                              title="Open in New Tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteFile(file._id, file.file_name)}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3
                          className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 break-all"
                          title={file.file_name}
                        >
                          {file.file_name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-3 border-t border-slate-100">
                        <span>{formatBytes(file.file_size)}</span>
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>

      </div>

      {/* Reusable File Preview Lightbox Modal */}
      <FilePreviewModal
        file={selectedPreviewFile}
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedPreviewFile(null);
        }}
        onDelete={handleDeleteFromPreview}
        onNext={currentPreviewIndex < filteredFiles.length - 1 ? handleNextFile : null}
        onPrev={currentPreviewIndex > 0 ? handlePrevFile : null}
      />

    </div>
  );
};

export default Dashboard;
