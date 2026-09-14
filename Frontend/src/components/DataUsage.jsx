import React, { useState, useEffect } from 'react';
import { HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/api';

const DataUsage = () => {
    const { user, setUser: setAuthUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const storageUsed = profileData?.storage?.used || 0;
    const storageLimit = profileData?.storage?.limit || 1073741824;
    const usedPercentage = storageLimit > 0 ? Math.min(Math.round((storageUsed / storageLimit) * 100), 100) : 0;
    const usedGB = (storageUsed / 1073741824).toFixed(2);
    const limitGB = (storageLimit / 1073741824).toFixed(2);

    return (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-blue-600" />
                    <span>Storage</span>
                </span>
                <span className="text-[11px] text-blue-600 font-bold">
                    {usedPercentage}%
                </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{
                        width: `${usedPercentage}%`,
                    }}
                />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
                {usedGB} GB of {limitGB} GB used
            </p>
        </div>
    );
};

export default DataUsage;