import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserAvatar, updateUserProfile } from '../services/api';
import { uploadAvatar } from '../lib/uploadAvatar';
import DriveLogo from '../components/DriveLogo';
import {
  User, Mail, HardDrive, Shield, Calendar, Key, ArrowLeft,
  LogOut, Edit3, CheckCircle, Copy, Check, Lock, RefreshCw,
  AlertCircle, X, Save, Camera, Loader2,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user: authUser, logout, setUser: setAuthUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profileData, setProfileData] = useState(authUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Avatar upload state
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Edit profile modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getUserProfile();
        if (res.success && (res.userData || res.user)) {
          const data = res.userData?._doc || res.userData || res.user;
          setProfileData(data);
          setAuthUser(data);
          localStorage.setItem('cloud_drive_user', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Could not refresh profile from server. Showing cached user data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setAuthUser]);

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Avatar upload ──────────────────────────────────────────────────
  const handleAvatarClick = () => {
    if (avatarUploading) return;
    setAvatarError('');
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      setAvatarUploading(true);
      setAvatarError('');

      const userId = profileData?._id || profileData?.id || 'unknown';
      const publicUrl = await uploadAvatar(file, userId);
      const res = await updateUserAvatar(publicUrl);

      if (res.success && (res.userData || res.user)) {
        const data = res.userData || res.user;
        setProfileData(data);
        setAuthUser(data);
        localStorage.setItem('cloud_drive_user', JSON.stringify(data));
        setAvatarPreview(null); // now use the real URL from DB
        showToast('Profile photo updated successfully!', 'success');
      } else {
        throw new Error(res.message || 'Failed to save avatar.');
      }
    } catch (err) {
      setAvatarError(err.message || 'Avatar upload failed.');
      showToast(err.message || 'Avatar upload failed.', 'error');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      // Reset input so the same file can be selected again
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ── Edit profile modal ─────────────────────────────────────────────
  const openEditModal = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setEditError('');
    setEditSuccess('');
    setEditOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();

    if (!trimmedName && !trimmedEmail) {
      setEditError('Please fill in at least one field.');
      showToast('Please fill in at least one field.', 'error');
      return;
    }
    if (trimmedName === userName && trimmedEmail === userEmail) {
      setEditError('No changes detected.');
      showToast('No changes detected.', 'info');
      return;
    }

    const payload = {};
    if (trimmedName !== userName) payload.name = trimmedName;
    if (trimmedEmail !== userEmail) payload.email = trimmedEmail;

    try {
      setSaving(true);
      const res = await updateUserProfile(payload);
      if (res.success && (res.userData || res.user)) {
        const data = res.userData || res.user;
        setProfileData(data);
        setAuthUser(data);
        localStorage.setItem('cloud_drive_user', JSON.stringify(data));
        setEditSuccess('Profile updated successfully!');
        showToast('Profile details updated successfully!', 'success');
        setTimeout(() => setEditOpen(false), 1200);
      } else {
        setEditError(res.message || 'Update failed.');
        showToast(res.message || 'Update failed.', 'error');
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────
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
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateString; }
  };

  // ── Derived values ─────────────────────────────────────────────────
  const storageLimit = profileData?.storage?.limit;
  const storageUsed = profileData?.storage?.used;
  const usedPercentage = Math.min(Math.round((storageUsed / storageLimit) * 100), 100);

  const userId = profileData?._id || profileData?.id || 'usr_68f4a9b20e';
  const userName = profileData?.name || 'Drive User';
  const userEmail = profileData?.email || 'user@workspace.com';
  const userRole = profileData?.role || 'Standard User';
  const userAvatar = profileData?.avatar;
  const createdAt = profileData?.createdAt ? formatDate(profileData.createdAt) : 'August 11, 2026';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans']">

      {/* Hidden file input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        className="hidden"
        onChange={handleAvatarFileChange}
        id="avatar-file-input"
      />

      {/* Top Header Navigation */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="hidden md:flex items-center gap-2">
            <DriveLogo size="sm" />
            <span className="font-bold text-slate-900 font-['Outfit']">CloudDrive </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Server error banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-amber-900 font-bold underline hover:text-amber-950 flex items-center gap-1 ml-2"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Avatar upload error banner */}
        {avatarError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{avatarError}</span>
            </div>
            <button onClick={() => setAvatarError('')} className="ml-2 text-red-500 hover:text-red-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">

            <div className="flex items-center gap-5">
              {/* ── Clickable Avatar ── */}
              <div className="relative group">
                <button
                  id="change-avatar-btn"
                  onClick={handleAvatarClick}
                  disabled={avatarUploading}
                  title="Change profile photo"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Change profile photo"
                >
                  {/* Avatar image or letter fallback */}
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                    {avatarUploading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-white" />
                        <span className="text-white text-[10px] font-semibold mt-1">Change</span>
                      </>
                    )}
                  </div>

                  {/* Upload spinner overlay (even without hover) */}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </button>

                {/* Online dot */}
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20 pointer-events-none" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
                    {userName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                    {userRole}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userEmail}</span>
                </p>

                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] text-slate-600">
                    ID: {userId}
                  </span>
                  <button
                    onClick={() => handleCopyId(userId)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                    title="Copy User ID"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: storage badge + Edit Profile button */}
            <div className="flex flex-col items-start sm:items-end gap-3">
              <div className="w-full sm:w-auto p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-start sm:items-end">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Storage Plan</span>
                <span className="text-sm font-bold text-blue-600 mt-0.5">1 GB Free Quota</span>
                <span className="text-[11px] text-slate-500 mt-1">{formatBytes(storageUsed)} of {formatBytes(storageLimit)} used</span>
              </div>

              <button
                id="edit-profile-btn"
                onClick={openEditModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-all duration-200 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </div>

          </div>

          {/* Avatar hint text */}
          <p className="relative z-10 mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Camera className="w-3 h-3" />
            Click on your photo to change your profile picture (JPG, PNG, WEBP · max 5 MB)
          </p>
        </div>

        {/* 2-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">

            {/* Account Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 font-['Outfit'] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Account Information</span>
              </h2>

              <div className="divide-y divide-slate-100 text-xs sm:text-sm">

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Full Name</span>
                  <span className="font-semibold text-slate-900">{userName}</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span>{userEmail}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">User ID</span>
                  <span className="font-mono text-slate-700 text-xs">{userId}</span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Account Created</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {createdAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Security & Authentication Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 font-['Outfit'] mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Security &amp; Sessions</span>
              </h2>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-slate-600" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Authentication Method</h4>
                      <p className="text-slate-500 text-[11px]">JWT HTTP-Only Secured Cookie Session</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">Active</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Data Encryption</h4>
                      <p className="text-slate-500 text-[11px]">AES-256 Bit Cloud File Encryption</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">Enabled</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-6">

            {/* Storage Quota Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 font-['Outfit'] mb-4 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Storage Breakdown</span>
              </h2>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Used Space</span>
                  <span className="font-bold text-blue-600">{usedPercentage}% Used</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${usedPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-right">
                  {formatBytes(storageUsed)} of {formatBytes(storageLimit)} Total
                </p>
              </div>

              <button
                onClick={() => alert('Storage upgrade plans coming soon!')}
                className="w-full cursor-pointer mt-6 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>Upgrade Storage Plan</span>
              </button>
            </div>

          </div>
        </div>

      </main>

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
            style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">Edit Profile</h3>
                  <p className="text-[11px] text-slate-500">Update your name or email address</p>
                </div>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-name" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />Full Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-email" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />Email Address
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>

              {editError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{editError}</span>
                </div>
              )}
              {editSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                  <CheckCircle className="w-4 h-4 shrink-0" /><span>{editSuccess}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="w-3.5 h-3.5" /> Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>

    </div>
  );
};

export default Profile;
