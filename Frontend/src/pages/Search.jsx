import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DriveLogo from '../components/DriveLogo';
import {
  Search as SearchIcon, X, ArrowLeft, FileText, Image as ImageIcon,
  Folder, MoreVertical, HardDrive, Clock, Calendar, ChevronRight, Grid, List,
  Share2, Download, Trash2, SlidersHorizontal, Check, Loader2, ExternalLink, Star
} from 'lucide-react';
import { getUserFiles, deleteUserFile, getUserProfile, toggleFavoriteFile } from '../services/api';
import FilePreviewModal from '../components/FilePreviewModal';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser: setAuthUser } = useAuth();

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('anytime');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Files state
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preview state
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Sync state if query URL param changes
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await getUserFiles();
      if (res.success) {
        setFiles(res.files || []);
      }
    } catch (err) {
      console.error('Failed to load files for search page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

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

  // Search submit
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClearQuery = () => {
    setQuery('');
    setSearchParams({});
  };

  const handleToggleFavorite = async (fileId) => {
    try {
      const res = await toggleFavoriteFile(fileId);
      if (res.success) {
        setFiles(prev => prev.map(f => f._id === fileId ? { ...f, is_favorite: res.is_favorite } : f));
      }
    } catch (err) {
      console.error('Failed to toggle favorite in search:', err);
    }
  };

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
      }
      return false;
    } catch (err) {
      console.error('Failed to delete file:', err);
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

  // Icon type mapping
  const getFileIcon = (type, name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return { icon: ImageIcon, color: 'text-emerald-600', category: 'image', extension: ext.toUpperCase(), bg: 'bg-emerald-50 border-emerald-200' };
    }
    if (type?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return { icon: FileText, color: 'text-purple-600', category: 'video', extension: ext.toUpperCase(), bg: 'bg-purple-50 border-purple-200' };
    }
    if (type?.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext)) {
      return { icon: FileText, color: 'text-pink-600', category: 'audio', extension: ext.toUpperCase(), bg: 'bg-pink-50 border-pink-200' };
    }
    if (type?.includes('pdf') || ext === 'pdf') {
      return { icon: FileText, color: 'text-red-600', category: 'document', extension: 'PDF', bg: 'bg-red-50 border-red-200' };
    }
    if (type?.includes('word') || type?.includes('document') || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return { icon: FileText, color: 'text-blue-600', category: 'document', extension: ext.toUpperCase(), bg: 'bg-blue-50 border-blue-200' };
    }
    if (type?.includes('zip') || type?.includes('rar') || type?.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: Folder, color: 'text-amber-600', category: 'archive', extension: ext.toUpperCase(), bg: 'bg-amber-50 border-amber-200' };
    }
    return { icon: FileText, color: 'text-slate-600', category: 'other', extension: ext ? ext.toUpperCase() : 'FILE', bg: 'bg-slate-50 border-slate-200' };
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

  // Filter items based on criteria
  const filteredItems = files.filter((file) => {
    const fileMeta = getFileIcon(file.file_type, file.file_name);
    
    // Text search query filter
    const matchesQuery = !query.trim() || 
      file.file_name.toLowerCase().includes(query.toLowerCase().trim()) || 
      fileMeta.extension.toLowerCase().includes(query.toLowerCase().trim());
    
    // Type filter
    const matchesType = selectedType === 'all' || fileMeta.category === selectedType;

    // Date filter
    let matchesDate = true;
    if (selectedDate !== 'anytime') {
      const fileTime = new Date(file.createdAt).getTime();
      const now = Date.now();
      if (selectedDate === 'today') {
        matchesDate = (now - fileTime) < 24 * 60 * 60 * 1000;
      } else if (selectedDate === 'week') {
        matchesDate = (now - fileTime) < 7 * 24 * 60 * 60 * 1000;
      } else if (selectedDate === 'month') {
        matchesDate = (now - fileTime) < 30 * 24 * 60 * 60 * 1000;
      }
    }

    return matchesQuery && matchesType && matchesDate;
  });

  // Pagination for search results preview modal
  const currentPreviewIndex = selectedPreviewFile
    ? filteredItems.findIndex(f => f._id === selectedPreviewFile._id)
    : -1;

  const handlePrevFile = () => {
    if (currentPreviewIndex > 0) {
      setSelectedPreviewFile(filteredItems[currentPreviewIndex - 1]);
    }
  };

  const handleNextFile = () => {
    if (currentPreviewIndex >= 0 && currentPreviewIndex < filteredItems.length - 1) {
      setSelectedPreviewFile(filteredItems[currentPreviewIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans']">

      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-30 shadow-xs">
        
        {/* Left Back & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1 text-xs font-semibold"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <DriveLogo size="sm" />
            <span className="font-bold text-lg text-slate-900 tracking-tight font-['Outfit'] hidden md:inline">
              CloudDrive Search
            </span>
          </div>
        </div>

        {/* Center Search Form Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-3 sm:mx-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your uploads..."
              autoFocus
              className="w-full pl-10 pr-10 py-2 rounded-xl text-sm bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Right User Avatar */}
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition border border-slate-200"
            title="Profile"
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
          </Link>
        </div>

      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* File Type Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'document', label: 'Documents' },
              { id: 'image', label: 'Images' },
              { id: 'archive', label: 'Archives' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  selectedType === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Controls: Date Filter & View Switcher */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* Date filter dropdown */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="anytime">Any Date</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Results Header Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <div>
            {query ? (
              <span>Showing results for <strong className="text-slate-900 font-bold">"{query}"</strong></span>
            ) : (
              <span>All Workspace Files</span>
            )}
            <span className="ml-2 font-semibold text-blue-600">({filteredItems.length} found)</span>
          </div>

          {(query || selectedType !== 'all' || selectedDate !== 'anytime') && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedType('all');
                setSelectedDate('anytime');
                setSearchParams({});
              }}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search Results Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 mt-3 font-semibold">Searching your workspace...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center my-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <SearchIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No matching files found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              We couldn't find any file matching your current search criteria or filters. Try adjusting your query or resetting filters.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setSelectedType('all');
                setSelectedDate('anytime');
                setSearchParams({});
              }}
              className="mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((file) => {
              const fileMeta = getFileIcon(file.file_type, file.file_name);
              const IconComponent = fileMeta.icon;
              return (
                <div
                  key={file._id}
                  onClick={() => {
                    setSelectedPreviewFile(file);
                    setPreviewOpen(true);
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-500/50 hover:shadow-md hover:scale-[1.01] transition flex flex-col justify-between h-44 group relative cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${fileMeta.bg} ${fileMeta.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div 
                        className={`flex items-center gap-1 transition-opacity ${
                          file.is_favorite ? 'opacity-100' : 'opacity-100 sm:opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(file._id);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            file.is_favorite
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                          }`}
                          title={file.is_favorite ? 'Unstar file' : 'Star file'}
                        >
                          <Star className={`w-3.5 h-3.5 ${file.is_favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                          title="Open Link"
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
                      className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 break-all"
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
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {filteredItems.map((file) => {
                const fileMeta = getFileIcon(file.file_type, file.file_name);
                const IconComponent = fileMeta.icon;
                return (
                  <div
                    key={file._id}
                    onClick={() => {
                      setSelectedPreviewFile(file);
                      setPreviewOpen(true);
                    }}
                    className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2 rounded-xl ${fileMeta.bg} ${fileMeta.color} shrink-0`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {file.file_name}
                        </h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{fileMeta.extension}</span>
                          <span>•</span>
                          <span>Uploaded {formatDate(file.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    <div 
                      className="flex items-center gap-3 shrink-0 text-xs text-slate-500 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-mono text-[11px] mr-2">{formatBytes(file.file_size)}</span>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file._id, file.file_name)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
        onNext={currentPreviewIndex < filteredItems.length - 1 ? handleNextFile : null}
        onPrev={currentPreviewIndex > 0 ? handlePrevFile : null}
      />

    </div>
  );
};

export default SearchPage;
