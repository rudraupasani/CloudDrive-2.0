import React, { useState, useEffect } from 'react';
import { HardDrive, Image as ImageIcon, FileText, Film, Folder } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/api';

const DataUsage = () => {
    const { user, setUser: setAuthUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res = await getUserProfile();
                if (res.success && (res.userData || res.user)) {
                    const data = res.userData || res.user;
                    setProfileData(data);
                    setAuthUser(data);
                    localStorage.setItem('cloud_drive_user', JSON.stringify(data));
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [setAuthUser]);

    const storageUsed = profileData?.storage?.used || user?.storage?.used || 0;
    const storageLimit = profileData?.storage?.limit || user?.storage?.limit || 1073741824;
    const usedPercentage = storageLimit > 0 ? Math.min(Math.round((storageUsed / storageLimit) * 100), 100) : 0;
    const usedMB = (storageUsed / (1024 * 1024)).toFixed(1);
    const limitGB = (storageLimit / 1073741824).toFixed(1);

    const breakdown = profileData?.breakdown || {
        images: 0,
        documents: 0,
        media: 0,
        others: 0
    };

    const imgPct = storageUsed > 0 ? ((breakdown.images / storageUsed) * usedPercentage) : 0;
    const docPct = storageUsed > 0 ? ((breakdown.documents / storageUsed) * usedPercentage) : 0;
    const mediaPct = storageUsed > 0 ? ((breakdown.media / storageUsed) * usedPercentage) : 0;
    const otherPct = storageUsed > 0 ? Math.max(0, usedPercentage - (imgPct + docPct + mediaPct)) : 0;

    return (
        <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
                <span className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-blue-600" />
                    <span>Storage Usage</span>
                </span>
                <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {usedPercentage}%
                </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3 flex">
                <div style={{ width: `${imgPct}%` }} className="bg-purple-500 transition-all duration-500" title="Images" />
                <div style={{ width: `${docPct}%` }} className="bg-blue-500 transition-all duration-500" title="Documents" />
                <div style={{ width: `${mediaPct}%` }} className="bg-emerald-500 transition-all duration-500" title="Media" />
                <div style={{ width: `${otherPct}%` }} className="bg-amber-500 transition-all duration-500" title="Others" />
            </div>

            <p className="text-[11px] text-slate-600 font-medium mb-3">
                {usedMB} MB of {limitGB} GB used
            </p>

            {/* Category breakdown legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Images</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Docs</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Media</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Others</span>
                </div>
            </div>
        </div>
    );
};

export default DataUsage;