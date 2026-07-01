import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Bell, Settings, Edit2, Shield, Lock,
    CreditCard, GraduationCap, Laptop, Smartphone,
    Check, AlertTriangle, Monitor, LogOut, Loader2,
    User, Activity, Sun, Moon, Trash2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { MODES, THEMES } from '../theme/colors';

const Profile = ({ user, onBack, onResetProgress, onLogout }) => {
    const { mode, toggleMode, theme, setTheme } = useTheme();
    const isDark = mode === MODES.DARK;

    const [activeTab, setActiveTab] = useState('profile');

    const [learningMode, setLearningMode] = useState('parallel');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false
    });

    const [sessions, setSessions] = useState([]);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/users/sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions);
            }
        } catch (err) {
            console.error("Failed to load sessions", err);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setActionError('');
        setActionSuccess('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profileForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update profile');

            // Note: In a real app we should update the global user context here
            setActionSuccess('Profile updated successfully');
            setTimeout(() => { setIsEditingProfile(false); setActionSuccess(''); }, 1500);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setActionError('');
        setActionSuccess('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/users/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(passwordForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to change password');

            setActionSuccess('Password changed successfully');
            setTimeout(() => { setIsChangingPassword(false); setActionSuccess(''); setPasswordForm({ currentPassword: '', newPassword: '' }); }, 1500);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/users/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== sessionId));
            }
        } catch (err) {
            console.error("Failed to revoke session", err);
        }
    };

    const themeOptions = [
        { id: THEMES.FOREST_GREEN, color: '#3D6652', name: 'Forest' },
        { id: THEMES.ORIGINAL_BLUE, color: '#6366f1', name: 'Blue' },
        { id: THEMES.AMETHYST_PURPLE, color: '#7535D4', name: 'Amethyst' },
        { id: THEMES.SUNSET_ORANGE, color: '#EA580C', name: 'Sunset' },
        { id: THEMES.CRIMSON_RED, color: '#E11D48', name: 'Crimson' }
    ];

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'preferences', label: 'Preferences', icon: Settings },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'privacy', label: 'Privacy & Data', icon: AlertTriangle }
    ];

    return (
        <div className="min-h-screen bg-base text-surface-400 font-sans pb-16">
            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* Header */}
                {/* <div className="mb-8">
                    {onBack && (
                        <button onClick={onBack} className="flex items-center gap-2 text-surface-500 hover:text-heading transition-colors font-bold text-sm mb-4">
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-heading mb-1">Manage Workspace</h1>
                    <p className="text-sm text-surface-500">Configure your academic sanctuary and account preferences.</p>
                </div> */}

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-8 border-b border-surface-800 mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-500'
                                    : 'border-transparent text-surface-500 hover:text-heading'
                                }`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-primary-500' : 'text-surface-400'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Profile Card */}
                            <div className="w-full md:w-72 bg-surface-900/30 border border-surface-800 rounded-2xl p-6 flex flex-col items-center text-center h-max">
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary-600/20 overflow-hidden">
                                        {user?.username?.[0]?.toUpperCase()}
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center text-surface-400 hover:text-white transition-colors bg-primary-600">
                                        <Edit2 size={12} className="text-white" />
                                    </button>
                                </div>
                                <h2 className="text-lg font-bold text-heading mb-1">{user?.username || 'Arunima'}</h2>
                                <p className="text-sm text-surface-500 mb-6">{user?.email || 'arunima1019@gmail.com'}</p>

                                <div className="w-full space-y-3">
                                    <button onClick={() => setIsEditingProfile(true)} className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                                        Edit Details
                                    </button>
                                    <button onClick={() => setIsChangingPassword(true)} className="w-full py-2.5 bg-transparent border border-surface-700 hover:border-surface-600 text-heading rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                                        Change Password
                                    </button>
                                </div>
                            </div>

                            {/* Academic Profile */}
                            <div className="flex-1 bg-surface-900/30 border border-surface-800 rounded-2xl p-6 h-max">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="text-primary-500"><GraduationCap size={20} /></div>
                                    <h2 className="text-base font-bold text-heading">Academic Profile</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs text-surface-500 mb-2">Target Exam & Branch</label>
                                        <select className="w-full bg-surface-950 border border-surface-800 rounded-lg px-4 py-3 text-sm text-heading focus:outline-none focus:border-primary-500 appearance-none">
                                            <option>GATE EE 2027</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-surface-500 mb-2">Learning Strategy</label>
                                        <div className="flex items-center justify-between bg-surface-950 border border-surface-800 rounded-lg px-4 py-3 cursor-pointer" onClick={() => setLearningMode(learningMode === 'parallel' ? 'subject' : 'parallel')}>
                                            <div>
                                                <p className="text-sm font-bold text-heading">{learningMode === 'parallel' ? 'Parallel Study' : 'Subject by Subject'}</p>
                                                <p className="text-[10px] text-surface-500">{learningMode === 'parallel' ? 'Study multiple subjects' : 'Master one subject at a time'}</p>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${learningMode === 'parallel' ? 'bg-primary-500' : 'bg-surface-700'}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${learningMode === 'parallel' ? 'right-0.5' : 'left-0.5'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PREFERENCES TAB */}
                    {activeTab === 'preferences' && (
                        <div className="bg-surface-900/30 border border-surface-800 rounded-2xl p-6 max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-primary-500"><Settings size={20} /></div>
                                <h2 className="text-base font-bold text-heading">App Preferences</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs text-surface-500 mb-2">Theme Preference</label>
                                    <div className="flex bg-surface-950 border border-surface-800 rounded-xl p-1 w-full max-w-xs">
                                        <button onClick={() => isDark && toggleMode()} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${!isDark ? 'bg-surface-800 text-heading shadow' : 'text-surface-500 hover:text-heading'}`}>
                                            <Sun size={14} /> Day
                                        </button>
                                        <button onClick={() => !isDark && toggleMode()} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-surface-800 text-heading shadow' : 'text-surface-500 hover:text-heading'}`}>
                                            <Moon size={14} /> Midnight
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-surface-500 mb-2">Accent Color</label>
                                    <div className="flex flex-wrap gap-3">
                                        {themeOptions.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id)}
                                                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${theme === t.id ? 'ring-2 ring-offset-2 ring-offset-surface-900 ring-heading' : 'opacity-80 hover:opacity-100'}`}
                                                style={{ backgroundColor: t.color }}
                                                title={t.name}
                                            >
                                                {theme === t.id && <Check size={12} className="text-white" strokeWidth={4} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="bg-surface-900/30 border border-surface-800 rounded-2xl p-6 max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-primary-500"><CreditCard size={20} /></div>
                                <h2 className="text-base font-bold text-heading">Subscription & Billing</h2>
                            </div>

                            <div className="bg-surface-950 border border-surface-800 rounded-xl p-5 mb-6">
                                <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full mb-3">Active Plan</span>
                                <h3 className="text-lg font-bold text-heading mb-1">Standard Member</h3>
                                <p className="text-sm text-surface-500">You have access to all core features.</p>
                            </div>

                            <div className="bg-surface-950 border border-surface-800 rounded-xl p-5 mb-6">
                                <p className="text-xs text-surface-500 mb-2">AI Credits Balance</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-heading leading-none">{user?.credits || 0}</span>
                                    <span className="text-sm font-bold text-surface-500">Credits</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="py-2.5 px-6 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                                    <CreditCard size={14} /> Top-up Credits
                                </button>
                                <button className="py-2.5 px-6 bg-transparent border border-surface-700 hover:border-surface-600 text-heading rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                                    <Activity size={14} /> Transaction History
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="bg-surface-900/30 border border-surface-800 rounded-2xl p-6 max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-primary-500"><Shield size={20} /></div>
                                <h2 className="text-base font-bold text-heading">Security Settings</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs text-surface-500 mb-2">Two-Factor Auth</label>
                                    <div className="flex items-center justify-between border border-surface-800 border-dashed rounded-xl p-4 bg-surface-950">
                                        <div className="flex gap-3 items-center">
                                            <Shield size={16} className="text-surface-500" />
                                            <div>
                                                <p className="text-sm font-bold text-heading">2FA is Disabled</p>
                                                <p className="text-[10px] text-surface-500">Secure your vault with an extra layer</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-surface-800 text-heading text-xs font-bold rounded-lg hover:bg-surface-700 transition-colors">Enable</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-surface-500 mb-2">Active Sessions</label>
                                    <div className="space-y-2">
                                        {sessions.length > 0 ? sessions.map(session => (
                                            <div key={session.id} className="flex items-center justify-between bg-surface-950 border border-surface-800 rounded-xl px-4 py-3">
                                                <div className="flex gap-3 items-center">
                                                    {session.device_name?.includes('iPhone') || session.device_name?.includes('Android') ? <Smartphone size={16} className="text-surface-400" /> : <Laptop size={16} className="text-surface-400" />}
                                                    <div>
                                                        <p className="text-sm font-bold text-heading">{session.device_name || 'Unknown Device'}</p>
                                                        <p className="text-[10px] text-surface-500">
                                                            {new Date(session.last_active).toLocaleString()} • {session.ip_address || 'Unknown IP'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRevokeSession(session.id)} className="p-2 hover:bg-surface-800 rounded-lg transition-colors">
                                                    <LogOut size={16} className="text-surface-500 hover:text-rose-500 cursor-pointer" />
                                                </button>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-surface-500 italic">No active sessions found.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRIVACY TAB */}
                    {activeTab === 'privacy' && (
                        <div className="bg-surface-900/30 border border-surface-800 rounded-2xl p-6 max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-rose-500"><AlertTriangle size={20} /></div>
                                <h2 className="text-base font-bold text-rose-500">Danger Zone</h2>
                            </div>

                            <p className="text-sm text-surface-500 mb-6">Warning: These actions are irreversible and will permanently remove your data from the Vault.</p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <button onClick={() => {
                                    if (confirm("This will permanently delete your syllabus progress. Continue?")) {
                                        onResetProgress();
                                    }
                                }} className="py-2.5 px-6 border border-rose-500/30 text-rose-500 rounded-lg font-bold text-sm hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                                    <Settings size={14} /> Reset Progress
                                </button>
                                <button className="py-2.5 px-6 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                                    <Trash2 size={14} /> Delete Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-surface-800 flex flex-col md:flex-row justify-between items-center text-xs text-surface-500">
                    <p>© 2024 Vault Academic. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <button className="hover:text-heading transition-colors">Privacy Policy</button>
                        <button className="hover:text-heading transition-colors">Terms</button>
                        <button className="hover:text-heading transition-colors">Support</button>
                    </div>
                </div>
            </main>

            {/* MODALS */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-surface-950 border border-surface-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-surface-900 px-6 py-4 border-b border-surface-800 flex justify-between items-center">
                            <h3 className="text-heading font-black uppercase tracking-tighter">Edit Profile</h3>
                            <button onClick={() => setIsEditingProfile(false)} className="text-surface-500 hover:text-heading transition-colors"><Check size={20} className="opacity-0" /><span className="sr-only">Close</span>✕</button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                            {actionError && <div className="p-3 bg-rose-500/10 text-rose-500 text-xs rounded-xl font-bold">{actionError}</div>}
                            {actionSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 text-xs rounded-xl font-bold">{actionSuccess}</div>}

                            <div>
                                <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-1">Username</label>
                                <input
                                    type="text"
                                    value={profileForm.username}
                                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-sm text-heading focus:border-primary-500 outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-1">Email</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-sm text-heading focus:border-primary-500 outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 bg-surface-800 text-heading rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-700 transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary-500 transition-colors disabled:opacity-50">
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isChangingPassword && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-surface-950 border border-surface-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-surface-900 px-6 py-4 border-b border-surface-800 flex justify-between items-center">
                            <h3 className="text-heading font-black uppercase tracking-tighter">Change Password</h3>
                            <button onClick={() => setIsChangingPassword(false)} className="text-surface-500 hover:text-heading transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            {actionError && <div className="p-3 bg-rose-500/10 text-rose-500 text-xs rounded-xl font-bold">{actionError}</div>}
                            {actionSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-500 text-xs rounded-xl font-bold">{actionSuccess}</div>}

                            <div>
                                <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-sm text-heading focus:border-primary-500 outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-sm text-heading focus:border-primary-500 outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 py-3 bg-surface-800 text-heading rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-700 transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary-500 transition-colors disabled:opacity-50">
                                    {actionLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
