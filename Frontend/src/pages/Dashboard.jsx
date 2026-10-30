import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import DriveLogo from '../components/DriveLogo';
import {
  Search, Plus, HardDrive, Clock, Star, Trash2,
  LogOut, FileText, Image as ImageIcon, Folder, Download,
  Share2, UploadCloud, ChevronRight, Grid, List, ListFilter, User, Loader2,
  AlertCircle, ExternalLink, Check, Copy, Menu, X, Info,
  SlidersHorizontal, Home, Users, HelpCircle, Settings,
  MoreVertical, Eye, ArrowUpDown, ChevronDown, CheckSquare,
  Square, Film, Music, Archive, RefreshCw, FolderPlus,
  Layers, FileCode, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataUsage from '../components/DataUsage';
import {
  getUserFiles, uploadFileMetadata, deleteUserFile,
  getUserProfile, toggleFavoriteFile, generateShareLink
} from '../services/api';
import { uploadFile } from '../lib/uploadFile';
import FilePreviewModal from '../components/FilePreviewModal';
import DriveDetailsPanel from '../components/DriveDetailsPanel';
import DriveUploadWidget from '../components/DriveUploadWidget';
import DriveContextMenu from '../components/DriveContextMenu';
import DragDropOverlay from '../components/DragDropOverlay';
import NewFolderModal from '../components/NewFolderModal';

const Dashboard = () => {
  const { user, logout, setUser: setAuthUser } = useAuth();
  const navigate = useNavigate();

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState('mydrive'); // 'home', 'mydrive', 'shared', 'recent', 'starred', 'trash'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterChip, setActiveFilterChip] = useState('all'); // 'all', 'docs', 'images', 'pdfs', 'media', 'starred'
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'images', 'documents', 'pdf', 'media', 'archives'
  const [filterDate, setFilterDate] = useState('all'); // 'all', 'today', '7days', '30days'

  // Sort State
  const [sortBy, setSortBy] = useState('modified'); // 'name' | 'modified' | 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Virtual Folders State
  const [folders, setFolders] = useState([
    { id: 'f-1', name: 'Work Documents', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'f-2', name: 'Personal Assets', createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  ]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);

  // Files State
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);

  // Modals & Popovers
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    file: null
  });

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const newMenuRef = useRef(null);
  const filterMenuRef = useRef(null);
  const sortMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Fetch files from backend (Redis-backed starred status)
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

  // Refresh user profile for updated storage metrics
  const refreshProfile = async () => {
    try {
      const res = await getUserProfile();
      if (res.success && (res.userData || res.user)) {
        const data = res.userData || res.user;
        setAuthUser(data);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Close popup menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target)) {
        setShowNewMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowSearchFilters(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Drag and Drop event listeners for Google Drive drop-zone
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];
        await handleProcessUpload(droppedFile);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [user]);

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Toggle Favorite / Star status (Stored in Redis on backend)
  const handleToggleFavorite = async (fileId) => {
    try {
      const res = await toggleFavoriteFile(fileId);
      if (res.success) {
        setFiles(prev =>
          prev.map(f => (f._id === fileId || f.id === fileId ? { ...f, is_favorite: res.is_favorite } : f))
        );
        if (selectedFile && (selectedFile._id === fileId || selectedFile.id === fileId)) {
          setSelectedFile(prev => ({ ...prev, is_favorite: res.is_favorite }));
        }
        if (selectedPreviewFile && (selectedPreviewFile._id === fileId || selectedPreviewFile.id === fileId)) {
          setSelectedPreviewFile(prev => ({ ...prev, is_favorite: res.is_favorite }));
        }
      }
    } catch (err) {
      console.error('Redis favorite toggle failed:', err);
    }
  };

  // Share File link generator
  const handleShareFile = async (file) => {
    try {
      const res = await generateShareLink(file._id || file.id);
      if (res.success) {
        const shareUrl = `${window.location.origin}/#/share/${res.share_token}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopiedId(file._id || file.id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch (err) {
      console.error('Share link generation failed:', err);
      await navigator.clipboard.writeText(file.file_url);
      setCopiedId(file._id || file.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Core file upload handler
  const handleProcessUpload = async (file) => {
    if (!file || uploading) return;

    try {
      setUploading(true);
      setUploadingFileName(file.name);
      setUploadError('');
      setUploadSuccess('');

      const userId = user?._id || user?.id || 'unknown';

      // 1. Upload Blob to Supabase Storage
      const publicUrl = await uploadFile(file, userId);

      // 2. Save metadata to MongoDB Backend
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
        throw new Error(res.message || 'Upload metadata failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessUpload(file);
  };

  // Delete file handler
  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return false;
    }

    try {
      const res = await deleteUserFile(fileId);
      if (res.success) {
        setFiles(prev => prev.filter(f => f._id !== fileId && f.id !== fileId));
        if (selectedFile && (selectedFile._id === fileId || selectedFile.id === fileId)) {
          setSelectedFile(null);
        }
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

  // Delete from Preview Modal wrapper
  const handleDeleteFromPreview = async (fileId, fileName) => {
    const success = await handleDeleteFile(fileId, fileName);
    if (success) {
      setPreviewOpen(false);
      setSelectedPreviewFile(null);
    }
  };

  // Create Virtual Folder
  const handleCreateFolder = (name) => {
    const newFolder = {
      id: `f-${Date.now()}`,
      name,
      createdAt: new Date().toISOString()
    };
    setFolders(prev => [newFolder, ...prev]);
  };

  // Icon & File Type styling helper
  const getFileMeta = (type, name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return { icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-100 text-purple-700', category: 'images' };
    }
    if (type?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return { icon: Film, color: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-700', category: 'media' };
    }
    if (type?.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext)) {
      return { icon: Music, color: 'text-pink-600', bg: 'bg-pink-100 text-pink-700', category: 'media' };
    }
    if (type?.includes('pdf') || ext === 'pdf') {
      return { icon: FileText, color: 'text-red-600', bg: 'bg-red-100 text-red-700', category: 'pdf' };
    }
    if (type?.includes('word') || type?.includes('document') || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100 text-blue-700', category: 'documents' };
    }
    if (type?.includes('zip') || type?.includes('rar') || type?.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: Archive, color: 'text-amber-600', bg: 'bg-amber-100 text-amber-700', category: 'archives' };
    }
    return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100 text-slate-700', category: 'documents' };
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    // Filter by Tab
    if (activeTab === 'starred') {
      result = result.filter(f => Boolean(f.is_favorite));
    } else if (activeTab === 'recent') {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
    } else if (activeTab === 'shared') {
      result = result.filter(f => Boolean(f.is_public));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => f.file_name?.toLowerCase().includes(q));
    }

    // Filter by Top Quick Chips
    if (activeFilterChip === 'docs') {
      result = result.filter(f => getFileMeta(f.file_type, f.file_name).category === 'documents');
    } else if (activeFilterChip === 'images') {
      result = result.filter(f => getFileMeta(f.file_type, f.file_name).category === 'images');
    } else if (activeFilterChip === 'pdfs') {
      result = result.filter(f => getFileMeta(f.file_type, f.file_name).category === 'pdf');
    } else if (activeFilterChip === 'media') {
      result = result.filter(f => getFileMeta(f.file_type, f.file_name).category === 'media');
    } else if (activeFilterChip === 'starred') {
      result = result.filter(f => Boolean(f.is_favorite));
    }

    // Filter by Advanced Search Options
    if (filterType !== 'all') {
      result = result.filter(f => getFileMeta(f.file_type, f.file_name).category === filterType);
    }
    if (filterDate !== 'all') {
      const now = Date.now();
      result = result.filter(f => {
        const fileTime = new Date(f.createdAt).getTime();
        if (filterDate === 'today') return now - fileTime <= 86400000;
        if (filterDate === '7days') return now - fileTime <= 86400000 * 7;
        if (filterDate === '30days') return now - fileTime <= 86400000 * 30;
        return true;
      });
    }

    // Sort files
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.file_name.localeCompare(b.file_name);
      } else if (sortBy === 'size') {
        comparison = (a.file_size || 0) - (b.file_size || 0);
      } else {
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, activeTab, searchQuery, activeFilterChip, filterType, filterDate, sortBy, sortOrder]);

  // Preview Modal Navigation
  const currentPreviewIndex = selectedPreviewFile
    ? filteredAndSortedFiles.findIndex(f => (f._id || f.id) === (selectedPreviewFile._id || selectedPreviewFile.id))
    : -1;

  const handlePrevPreviewFile = () => {
    if (currentPreviewIndex > 0) {
      setSelectedPreviewFile(filteredAndSortedFiles[currentPreviewIndex - 1]);
    }
  };

  const handleNextPreviewFile = () => {
    if (currentPreviewIndex >= 0 && currentPreviewIndex < filteredAndSortedFiles.length - 1) {
      setSelectedPreviewFile(filteredAndSortedFiles[currentPreviewIndex + 1]);
    }
  };

  // Right-click context menu trigger
  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setSelectedFile(file);
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  // Nav Item Renderer
  const renderNavItem = (id, label, IconComponent, badge = null) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => {
          setActiveTab(id);
          setCurrentFolder(null);
          setMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-98 ${isActive
          ? 'bg-blue-100 text-blue-900 shadow-2xs font-bold'
          : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
          }`}
      >
        <span className="flex items-center gap-3">
          <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
          <span>{label}</span>
        </span>
        {badge !== null && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-200/80 text-blue-900' : 'bg-slate-200/80 text-slate-700'
            }`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans'] select-none">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory="true"
        directory="true"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Full-screen Drag and Drop Overlay */}
      <DragDropOverlay isDragging={isDragging} />

      {/* New Folder Modal */}
      <NewFolderModal
        isOpen={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* Right-Click Context Menu */}
      <DriveContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        file={contextMenu.file}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onPreview={(file) => {
          setSelectedPreviewFile(file);
          setPreviewOpen(true);
        }}
        onDownload={(file) => {
          window.open(file.file_url, '_blank');
        }}
        onShare={handleShareFile}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteFile}
        onDetails={(file) => {
          setSelectedFile(file);
          setDetailsPanelOpen(true);
        }}
      />

      {/* Floating Upload Progress Widget */}
      <DriveUploadWidget
        uploading={uploading}
        fileName={uploadingFileName}
        uploadSuccess={uploadSuccess}
        uploadError={uploadError}
        onDismiss={() => {
          setUploadSuccess('');
          setUploadError('');
        }}
      />

      {/* ========================================================================= */}
      {/* 1. GOOGLE DRIVE RESPONSIVE HEADER                                         */}
      {/* ========================================================================= */}
      <header className="h-16 px-3 sm:px-6 bg-[#F8FAFD] border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile Menu Trigger + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 sm:w-60 shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 active:scale-95 transition cursor-pointer"
            title="Main menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => {
              setActiveTab('mydrive');
              setCurrentFolder(null);
            }}
            className="flex items-center gap-2.5 cursor-pointer active:scale-98 transition"
          >
            <DriveLogo size="sm" />
            <span className="font-bold text-lg sm:text-xl text-slate-800 tracking-tight font-['Outfit']">
              Drive
            </span>
          </div>
        </div>

        {/* Center: Search Bar (Responsive: Full on desktop, expandable on mobile) */}
        <div className="flex-1 max-w-2xl mx-2 sm:mx-6">
          <div className="relative w-full">
            <div className="flex items-center w-full bg-[#EDF2FC] hover:bg-[#E3EBF7] focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-500/20 rounded-full px-3.5 sm:px-4 py-2 transition-all duration-200">
              <Search className="w-4 h-4 text-slate-600 shrink-0 mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files, docs, media..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-200/80 transition cursor-pointer mr-1"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Advanced Filter Popover Toggle */}
              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => setShowSearchFilters(!showSearchFilters)}
                  className={`p-1.5 rounded-full text-slate-600 hover:bg-slate-200 transition active:scale-95 cursor-pointer ${showSearchFilters || filterType !== 'all' || filterDate !== 'all' ? 'bg-blue-100 text-blue-700' : ''
                    }`}
                  title="Filter options"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>

                {/* Filter Dropdown Popover */}
                {showSearchFilters && (
                  <div className="absolute right-0 mt-3 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                      <span className="font-bold text-slate-900 font-['Outfit']">Search filters</span>
                      <button
                        onClick={() => {
                          setFilterType('all');
                          setFilterDate('all');
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Reset all
                      </button>
                    </div>

                    {/* Type Filter */}
                    <div className="mb-3">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">File Type</label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="all">Any type</option>
                        <option value="documents">Documents (.doc, .txt)</option>
                        <option value="images">Photos & Images (.png, .jpg)</option>
                        <option value="pdf">PDF Documents (.pdf)</option>
                        <option value="media">Video & Audio (.mp4, .mp3)</option>
                        <option value="archives">Archives (.zip, .rar)</option>
                      </select>
                    </div>

                    {/* Date Modified Filter */}
                    <div className="mb-4">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Modified Time</label>
                      <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="all">Any time</option>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setShowSearchFilters(false)}
                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Support, Settings, Profile Avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Support / Shortcuts Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 active:scale-95 transition cursor-pointer hidden md:flex"
            title="Help & Shortcuts"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 active:scale-95 transition cursor-pointer hidden sm:flex"
            title="Profile & Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Account Popover */}
          <div className="relative ml-1" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:ring-4 hover:ring-blue-100 transition cursor-pointer active:scale-95"
              title="Google Account"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-xs border border-white"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mb-2 shadow-md">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <h4 className="text-sm font-bold text-slate-900">{user?.name || 'Drive User'}</h4>
                  <p className="text-xs text-slate-500 font-medium">{user?.email || 'user@drive.com'}</p>
                  <span className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Google Drive Member
                  </span>
                </div>

                <div className="py-3 space-y-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition active:scale-98 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Profile & Account Settings</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition active:scale-98 cursor-pointer"
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

      {/* ========================================================================= */}
      {/* 2. MAIN DRIVE BODY (SIDEBAR + CONTENT + DETAILS PANE)                      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP PERMANENT SIDEBAR */}
        <aside className="w-64 p-3 flex flex-col justify-between hidden md:flex shrink-0">
          <div>
            {/* GOOGLE DRIVE "+ NEW" BUTTON WITH DROPDOWN */}
            <div className="relative mb-5" ref={newMenuRef}>
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-600"
              >
                {/* 4-Color Styled Plus Icon */}
                <div className="w-4 h-4 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white stroke-[2.7]" />
                </div>
                <span className="font-['Outfit'] font-bold text-white text-sm tracking-wide">New</span>
              </button>

              {/* "+ New" Dropdown Menu */}
              {showNewMenu && (
                <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-2xl py-2 z-40 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      setNewFolderModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition text-left cursor-pointer active:scale-98"
                  >
                    <div className="p-1 rounded-lg bg-blue-50 text-blue-600">
                      <FolderPlus className="w-4 h-4" />
                    </div>
                    <span>New folder</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition text-left cursor-pointer active:scale-98"
                  >
                    <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <span>File upload</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      folderInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 transition text-left cursor-pointer active:scale-98"
                  >
                    <div className="p-1 rounded-lg bg-amber-50 text-amber-600">
                      <Folder className="w-4 h-4" />
                    </div>
                    <span>Folder upload</span>
                  </button>
                </div>
              )}
            </div>

            {/* Google Drive Navigation Items */}
            <nav className="space-y-1">
              {renderNavItem('home', 'Home', Home)}
              {renderNavItem('mydrive', 'My Drive', HardDrive, files.length)}
              {renderNavItem('shared', 'Shared with me', Users)}
              {renderNavItem('recent', 'Recent', Clock)}
              {renderNavItem('starred', 'Starred', Star, files.filter(f => f.is_favorite).length)}
              {renderNavItem('trash', 'Trash', Trash2)}
            </nav>
          </div>

          {/* Storage Quota Card */}
          <div className="pt-4">
            <DataUsage />
          </div>
        </aside>

        {/* MOBILE DRAWER SIDEBAR */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <DriveLogo size="sm" />
                    <span className="font-bold text-base text-slate-900 font-['Outfit']">Drive</span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-3.5 px-4 mb-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Upload File</span>
                </button>

                <nav className="space-y-1">
                  {renderNavItem('home', 'Home', Home)}
                  {renderNavItem('mydrive', 'My Drive', HardDrive)}
                  {renderNavItem('shared', 'Shared with me', Users)}
                  {renderNavItem('recent', 'Recent', Clock)}
                  {renderNavItem('starred', 'Starred (Redis)', Star)}
                  {renderNavItem('trash', 'Trash', Trash2)}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <DataUsage />
              </div>
            </aside>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MAIN CONTENT CONTAINER (WHITE CANVAS)                                 */}
        {/* ========================================================================= */}
        <main className="flex-1 bg-white rounded-tl-3xl border-t border-l border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          {/* DRIVE VIEW TOOLBAR */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              {/* Location Breadcrumb */}
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 truncate">
                  {activeTab === 'starred' ? (
                    <>
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                      <span>Starred</span>
                      <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Redis In-Memory
                      </span>
                    </>
                  ) : activeTab === 'recent' ? (
                    <>
                      <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>Recent Files</span>
                    </>
                  ) : activeTab === 'shared' ? (
                    <>
                      <Users className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>Shared with me</span>
                    </>
                  ) : activeTab === 'trash' ? (
                    <>
                      <Trash2 className="w-5 h-5 text-slate-500 shrink-0" />
                      <span>Trash</span>
                    </>
                  ) : currentFolder ? (
                    <div className="flex items-center gap-1.5 text-sm truncate">
                      <button
                        onClick={() => setCurrentFolder(null)}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        My Drive
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-800 truncate">{currentFolder.name}</span>
                    </div>
                  ) : (
                    <span>My Drive</span>
                  )}
                </h1>
              </div>

              {/* Right Toolbar Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Sort Dropdown */}
                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 border border-slate-200/80"
                    title="Sort files"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden md:inline capitalize">{sortBy}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
                  </button>

                  {showSortDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-40 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">Sort by</div>
                      <button
                        onClick={() => {
                          setSortBy('name');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center justify-between cursor-pointer ${sortBy === 'name' ? 'text-blue-600 font-bold' : ''
                          }`}
                      >
                        <span>Name</span>
                        {sortBy === 'name' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('modified');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center justify-between cursor-pointer ${sortBy === 'modified' ? 'text-blue-600 font-bold' : ''
                          }`}
                      >
                        <span>Last modified</span>
                        {sortBy === 'modified' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('size');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-100 flex items-center justify-between cursor-pointer ${sortBy === 'size' ? 'text-blue-600 font-bold' : ''
                          }`}
                      >
                        <span>File size</span>
                        {sortBy === 'size' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 text-slate-600 flex items-center justify-between cursor-pointer"
                      >
                        <span>Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* View Mode Toggle: Grid vs List */}
                <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition cursor-pointer active:scale-95 ${viewMode === 'grid' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    title="Grid view"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition cursor-pointer active:scale-95 ${viewMode === 'list' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Info / Details Panel Toggle Button */}
                <button
                  onClick={() => setDetailsPanelOpen(!detailsPanelOpen)}
                  className={`p-2 rounded-xl transition cursor-pointer active:scale-95 border ${detailsPanelOpen
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100 border-slate-200/80'
                    }`}
                  title="View details"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Filter Chips with Icons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
              {[
                { id: 'all', label: 'All files', icon: Layers },
                { id: 'docs', label: 'Documents', icon: FileText },
                { id: 'images', label: 'Photos & Images', icon: ImageIcon },
                { id: 'pdfs', label: 'PDFs', icon: FileCode },
                { id: 'media', label: 'Video & Audio', icon: Film },
                { id: 'starred', label: 'Starred (Redis)', icon: Star },
              ].map(chip => {
                const IconCmp = chip.icon;
                const isSelected = activeFilterChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setActiveFilterChip(chip.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                  >
                    <IconCmp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN FILES CANVAS */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-8">
            {/* Virtual Folders Section */}
            {activeTab === 'mydrive' && !currentFolder && folders.length > 0 && !searchQuery && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Folders</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {folders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolder(folder)}
                      className="p-3 rounded-2xl bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/90 hover:border-blue-300 transition-all flex items-center gap-2.5 cursor-pointer group active:scale-98 shadow-2xs"
                    >
                      <Folder className="w-5 h-5 text-slate-500 group-hover:text-blue-600 fill-slate-200 group-hover:fill-blue-100 transition shrink-0" />
                      <span className="text-xs font-bold text-slate-800 truncate">{folder.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Loading State */}
            {loadingFiles ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-500 mt-3 font-semibold">Loading your Drive files...</p>
              </div>
            ) : filteredAndSortedFiles.length === 0 ? (
              /* Empty Drive State */
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
                  {activeTab === 'starred' ? (
                    <Star className="w-10 h-10 fill-amber-400 text-amber-500" />
                  ) : (
                    <UploadCloud className="w-10 h-10" />
                  )}
                </div>
                <h3 className="font-bold text-base text-slate-900 font-['Outfit']">
                  {activeTab === 'starred'
                    ? 'No starred files yet'
                    : searchQuery
                      ? `No results found for "${searchQuery}"`
                      : 'A place for all your files'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs">
                  {activeTab === 'starred'
                    ? 'Star important files to quickly access them here. Starred files are cached in high-speed Redis.'
                    : searchQuery
                      ? 'Check your spelling or try different keywords or filters.'
                      : 'Drag and drop files here or click New to upload documents, photos, and videos.'}
                </p>
                {!searchQuery && activeTab !== 'starred' && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload files</span>
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* ========================================================================= */
              /* GOOGLE DRIVE GRID VIEW                                                   */
              /* ========================================================================= */
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Files</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4.5">
                  {filteredAndSortedFiles.map(file => {
                    const meta = getFileMeta(file.file_type, file.file_name);
                    const IconComponent = meta.icon;
                    const isSelected = (selectedFile?._id || selectedFile?.id) === (file._id || file.id);

                    return (
                      <div
                        key={file._id || file.id}
                        onClick={() => setSelectedFile(file)}
                        onDoubleClick={() => {
                          setSelectedPreviewFile(file);
                          setPreviewOpen(true);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        className={`rounded-2xl border transition-all duration-150 flex flex-col justify-between overflow-hidden cursor-pointer group active:scale-[0.99] ${isSelected
                          ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                          }`}
                      >
                        {/* Top Card Info & Star Action */}
                        <div className="p-3.5 flex items-center justify-between pb-2">
                          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                            <div className={`p-1.5 rounded-lg ${meta.bg} shrink-0`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 truncate" title={file.file_name}>
                              {file.file_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(file._id || file.id);
                              }}
                              className={`p-1.5 rounded-full transition active:scale-90 cursor-pointer ${file.is_favorite
                                ? 'opacity-100 text-amber-500 hover:bg-amber-50'
                                : 'opacity-100 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                                }`}
                              title={file.is_favorite ? 'Starred in Redis (Click to unstar)' : 'Star (Redis)'}
                            >
                              <Star className={`w-4 h-4 ${file.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, file);
                              }}
                              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-100 sm:opacity-0 group-hover:opacity-100 transition active:scale-90 cursor-pointer"
                              title="More actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Card Center Preview Area */}
                        <div className="h-32 bg-slate-50/80 border-y border-slate-100 flex items-center justify-center overflow-hidden relative">
                          {meta.category === 'images' ? (
                            <img
                              src={file.file_url}
                              alt={file.file_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                              <IconComponent className="w-12 h-12 stroke-1" />
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Metadata */}
                        <div className="p-3 bg-white flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>{formatDate(file.createdAt)}</span>
                          <span className="font-semibold text-slate-700">{formatBytes(file.file_size)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* GOOGLE DRIVE LIST VIEW                                                   */
              /* ========================================================================= */
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Owner</th>
                      <th className="py-3 px-4 hidden md:table-cell">Last modified</th>
                      <th className="py-3 px-4">File size</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedFiles.map(file => {
                      const meta = getFileMeta(file.file_type, file.file_name);
                      const IconComponent = meta.icon;
                      const isSelected = (selectedFile?._id || selectedFile?.id) === (file._id || file.id);

                      return (
                        <tr
                          key={file._id || file.id}
                          onClick={() => setSelectedFile(file)}
                          onDoubleClick={() => {
                            setSelectedPreviewFile(file);
                            setPreviewOpen(true);
                          }}
                          onContextMenu={(e) => handleContextMenu(e, file)}
                          className={`hover:bg-slate-50/90 transition cursor-pointer group ${isSelected ? 'bg-blue-50/80 font-semibold' : ''
                            }`}
                        >
                          {/* Name + Icon */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${meta.bg} shrink-0`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md" title={file.file_name}>
                                {file.file_name}
                              </span>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="py-3 px-4 hidden sm:table-cell text-slate-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'me'}
                              </div>
                              <span className="text-xs">me</span>
                            </div>
                          </td>

                          {/* Last Modified */}
                          <td className="py-3 px-4 hidden md:table-cell text-slate-500 font-medium">
                            {formatDate(file.createdAt)}
                          </td>

                          {/* Size */}
                          <td className="py-3 px-4 text-slate-700 font-semibold">
                            {formatBytes(file.file_size)}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(file._id || file.id);
                                }}
                                className={`p-1.5 rounded-full transition active:scale-90 cursor-pointer ${file.is_favorite
                                  ? 'text-amber-500'
                                  : 'text-slate-400 opacity-100 sm:opacity-0 group-hover:opacity-100 hover:text-amber-500'
                                  }`}
                                title={file.is_favorite ? 'Starred in Redis' : 'Star (Redis)'}
                              >
                                <Star className={`w-4 h-4 ${file.is_favorite ? 'fill-amber-400' : ''}`} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareFile(file);
                                }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 opacity-100 sm:opacity-0 group-hover:opacity-100 transition active:scale-90 cursor-pointer"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContextMenu(e, file);
                                }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 opacity-100 sm:opacity-0 group-hover:opacity-100 transition active:scale-90 cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* FLOATING ACTION TOOLBAR WHEN ITEM IS SELECTED                             */}
          {/* ========================================================================= */}
          {selectedFile && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/80 animate-in slide-in-from-bottom-3 duration-200 max-w-[95vw]">
              <span className="text-xs font-semibold max-w-[140px] sm:max-w-xs truncate hidden sm:inline">
                {selectedFile.file_name}
              </span>

              <div className="h-4 w-px bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleFavorite(selectedFile._id || selectedFile.id)}
                  className={`p-2 rounded-xl transition active:scale-95 cursor-pointer ${selectedFile.is_favorite ? 'text-amber-400 bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  title={selectedFile.is_favorite ? 'Remove Star (Redis)' : 'Add Star (Redis)'}
                >
                  <Star className={`w-4 h-4 ${selectedFile.is_favorite ? 'fill-amber-400' : ''}`} />
                </button>

                <button
                  onClick={() => handleShareFile(selectedFile)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
                  title="Share link"
                >
                  {copiedId === (selectedFile._id || selectedFile.id) ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>

                <a
                  href={selectedFile.file_url}
                  download={selectedFile.file_name}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={() => {
                    setSelectedPreviewFile(selectedFile);
                    setPreviewOpen(true);
                  }}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDetailsPanelOpen(true)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
                  title="File details"
                >
                  <Info className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteFile(selectedFile._id || selectedFile.id, selectedFile.file_name)}
                  className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/20 transition active:scale-95 cursor-pointer"
                  title="Move to trash"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer ml-1"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* MOBILE FLOATING ACTION BUTTON (FAB) FOR UPLOAD */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="md:hidden fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full bg-white hover:bg-slate-50 text-slate-800 shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_6px_10px_0_rgba(0,0,0,0.14),0_1px_18px_0_rgba(0,0,0,0.12)] border border-slate-200/80 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Upload file"
          >
            <Plus className="w-6 h-6 text-blue-600 stroke-[2.7]" />
          </button>
        </main>

        {/* ========================================================================= */}
        {/* 4. GOOGLE DRIVE DETAILS & ACTIVITY SIDE PANEL                             */}
        {/* ========================================================================= */}
        <DriveDetailsPanel
          file={selectedFile}
          isOpen={detailsPanelOpen}
          onClose={() => setDetailsPanelOpen(false)}
          onToggleFavorite={handleToggleFavorite}
          onShare={handleShareFile}
          onDelete={handleDeleteFile}
          onPreview={(file) => {
            setSelectedPreviewFile(file);
            setPreviewOpen(true);
          }}
          copiedId={copiedId}
        />
      </div>

      {/* ========================================================================= */}
      {/* 5. FULL-SCREEN FILE PREVIEW MODAL                                         */}
      {/* ========================================================================= */}
      <FilePreviewModal
        file={selectedPreviewFile}
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedPreviewFile(null);
        }}
        onDelete={handleDeleteFromPreview}
        onToggleFavorite={handleToggleFavorite}
        onNext={currentPreviewIndex < filteredAndSortedFiles.length - 1 ? handleNextPreviewFile : null}
        onPrev={currentPreviewIndex > 0 ? handlePrevPreviewFile : null}
      />

      {/* ========================================================================= */}
      {/* 6. HELP & SHORTCUTS MODAL                                                 */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Drive Shortcuts & Tips</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Open file preview</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">Double click</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Context action menu</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">Right click</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Quick upload files</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">Drag & drop anywhere</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Starred status</span>
                <span className="font-mono bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200">Redis In-Memory</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs active:scale-95 cursor-pointer transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
