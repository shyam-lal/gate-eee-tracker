import React, { useState, useEffect } from 'react';
import { adminUsers } from '../../services/api';
import { Users, Search, Filter, Mail, Calendar, Shield, Crown, CustomIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, ArrowLeft, Activity, Edit3, Sparkles } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Details View
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    
    // Edit Subscription Mode
    const [isEditingSub, setIsEditingSub] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [selectedEndDate, setSelectedEndDate] = useState('');

    // Edit AI Mode
    const [isEditingAi, setIsEditingAi] = useState(false);
    const [selectedAiMode, setSelectedAiMode] = useState('global');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        loadUsers();
    }, [page, debouncedSearch, roleFilter]);

    useEffect(() => {
        if (selectedUser) {
            loadUserDetails(selectedUser.id);
            if (plans.length === 0) {
                loadPlans();
            }
        }
    }, [selectedUser]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await adminUsers.getUsers(page, 20, debouncedSearch, roleFilter);
            setUsers(data.users);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUserDetails = async (id) => {
        setDetailsLoading(true);
        try {
            const data = await adminUsers.getUserDetails(id);
            setUserDetails(data);
            setSelectedAiMode(data.ai_generation_mode || 'global');
        } catch (err) {
            console.error('Failed to load user details:', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const loadPlans = async () => {
        try {
            const data = await adminUsers.getPlans();
            setPlans(data);
        } catch (err) {
            console.error('Failed to load plans:', err);
        }
    };

    const handleUpdateSubscription = async () => {
        try {
            await adminUsers.updateUserSubscription(selectedUser.id, selectedPlanId ? parseInt(selectedPlanId) : null, selectedEndDate);
            setIsEditingSub(false);
            loadUserDetails(selectedUser.id);
            loadUsers(); // refresh list
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUpdateAiMode = async () => {
        try {
            await adminUsers.updateAiMode(selectedUser.id, selectedAiMode);
            setIsEditingAi(false);
            loadUserDetails(selectedUser.id);
        } catch (err) {
            alert(err.message);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: USER DETAILS VIEW
    // ─────────────────────────────────────────────────────────────────────────────
    if (selectedUser) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-surface-800 rounded-xl text-surface-400 hover:text-heading transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-heading">User Profile</h2>
                        <p className="text-xs text-surface-500 font-bold uppercase tracking-widest">Detail View & Management</p>
                    </div>
                </div>

                {detailsLoading || !userDetails ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Basic Info & Stats */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Profile Card */}
                            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-3xl font-black text-white mb-4 shadow-lg shadow-primary-500/20">
                                        {userDetails.username.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="text-xl font-bold text-heading">{userDetails.username}</h3>
                                    <p className="text-sm text-surface-400 flex items-center gap-2 mt-1">
                                        <Mail size={14} /> {userDetails.email}
                                    </p>
                                    
                                    <div className="flex gap-2 mt-4">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                                            userDetails.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-surface-800 text-surface-400 border border-surface-700'
                                        }`}>
                                            <Shield size={10} className="inline mr-1 mb-0.5" />
                                            {userDetails.role || 'User'}
                                        </span>
                                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-surface-800 text-surface-400 border border-surface-700">
                                            ID: {userDetails.id}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-surface-800 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-surface-500 flex items-center gap-2"><Calendar size={14} /> Joined</span>
                                        <span className="text-heading font-medium">{formatDate(userDetails.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Engagement Stats */}
                            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6">
                                <h4 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity size={14} /> Engagement
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-3xl font-black text-heading">{Math.round((userDetails.stats?.totalMinutes || 0) / 60)}<span className="text-sm text-surface-500 font-bold tracking-widest ml-1">HRS</span></p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-surface-500 mt-1">Total Study Time Logged</p>
                                    </div>
                                </div>
                            </div>

                            {/* AI Configuration */}
                            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-black text-surface-500 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-400" /> AI Features
                                    </h4>
                                    {!isEditingAi && (
                                        <button 
                                            onClick={() => setIsEditingAi(true)}
                                            className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 bg-primary-500/10 px-3 py-1.5 rounded-lg transition-colors border border-primary-500/20"
                                        >
                                            <Edit3 size={12} /> Edit
                                        </button>
                                    )}
                                </div>
                                {isEditingAi ? (
                                    <div className="space-y-4">
                                        <select 
                                            className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-sm text-heading focus:border-primary-500 outline-none"
                                            value={selectedAiMode}
                                            onChange={(e) => setSelectedAiMode(e.target.value)}
                                        >
                                            <option value="global">Use Global Default</option>
                                            <option value="disabled">Disabled</option>
                                            <option value="manual">Manual (Prompt Only)</option>
                                            <option value="auto">Auto (Full Integration)</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setIsEditingAi(false); setSelectedAiMode(userDetails.ai_generation_mode || 'global'); }} className="px-4 py-2 bg-surface-800 text-heading rounded-xl text-xs font-bold">Cancel</button>
                                            <button onClick={handleUpdateAiMode} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-500 transition-colors">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-bold text-heading">
                                            Mode: <span className="text-primary-400 uppercase tracking-wider text-xs ml-1">{userDetails.ai_generation_mode || 'global'}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Subscription Management */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-xs font-black text-surface-500 uppercase tracking-widest flex items-center gap-2">
                                        <Crown size={14} className="text-amber-400" /> Active Subscription
                                    </h4>
                                    {!isEditingSub && (
                                        <button 
                                            onClick={() => setIsEditingSub(true)}
                                            className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 bg-primary-500/10 px-3 py-1.5 rounded-lg transition-colors border border-primary-500/20"
                                        >
                                            <Edit3 size={12} /> Edit Tier
                                        </button>
                                    )}
                                </div>

                                {isEditingSub ? (
                                    <div className="bg-surface-950 border border-primary-500/30 rounded-xl p-5 space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest block mb-1">Select Plan</label>
                                            <select 
                                                className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-sm text-heading focus:border-primary-500 outline-none"
                                                value={selectedPlanId}
                                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                            >
                                                <option value="">None / Free (Remove active subscription)</option>
                                                {plans.filter(p => p.price > 0).map(plan => (
                                                    <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedPlanId && (
                                            <div>
                                                <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest block mb-1">Expiration Date (Optional)</label>
                                                <input 
                                                    type="date" 
                                                    className="w-full bg-surface-900 border border-surface-800 rounded-xl p-3 text-sm text-heading focus:border-primary-500 outline-none"
                                                    value={selectedEndDate}
                                                    onChange={(e) => setSelectedEndDate(e.target.value)}
                                                />
                                                <p className="text-[10px] text-surface-500 mt-1">If blank, it will persist indefinitely or use default plan duration (TODO).</p>
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => setIsEditingSub(false)} className="px-4 py-2 bg-surface-800 text-heading rounded-xl text-xs font-bold">Cancel</button>
                                            <button onClick={handleUpdateSubscription} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-500 transition-colors">Apply Changes</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {userDetails.subscriptions && userDetails.subscriptions.filter(s => s.status === 'active').length > 0 ? (
                                            userDetails.subscriptions.filter(s => s.status === 'active').map(sub => (
                                                <div key={sub.id} className="bg-gradient-to-r from-surface-800 to-surface-800/50 border border-surface-700 rounded-xl p-5 flex justify-between items-center">
                                                    <div>
                                                        <h5 className="text-xl font-black text-heading flex items-center gap-2">
                                                            {sub.plan_name} <CheckCircle size={16} className="text-emerald-400" />
                                                        </h5>
                                                        <p className="text-xs text-surface-400 mt-1">
                                                            Started: {formatDate(sub.start_date)}
                                                        </p>
                                                        {sub.end_date && (
                                                            <p className="text-xs text-amber-400/80 mt-0.5">
                                                                Expires: {formatDate(sub.end_date)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="w-12 h-12 rounded-full bg-surface-900 border border-surface-700 flex items-center justify-center shadow-inner">
                                                        <Crown size={20} className={
                                                            sub.plan_name.toLowerCase().includes('premium') ? 'text-amber-400' : 'text-primary-400'
                                                        } />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-surface-950 border border-surface-800 rounded-xl p-6 text-center">
                                                <div className="w-12 h-12 rounded-full bg-surface-800 text-surface-500 flex items-center justify-center mx-auto mb-3">
                                                    <Users size={20} />
                                                </div>
                                                <h5 className="text-sm font-bold text-heading">Free Tier</h5>
                                                <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mt-1">No active premium subscription</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6">
                                <h4 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-4">Subscription History</h4>
                                <div className="space-y-3">
                                    {userDetails.subscriptions && userDetails.subscriptions.length > 0 ? (
                                        userDetails.subscriptions.map(sub => (
                                            <div key={sub.id} className="flex justify-between items-center p-3 rounded-lg border border-surface-800 bg-surface-950">
                                                <div>
                                                    <p className="text-sm font-bold text-heading">{sub.plan_name} <span className="text-[10px] text-surface-500 font-normal">({sub.status})</span></p>
                                                    <p className="text-[10px] text-surface-500">{formatDate(sub.start_date)} - {formatDate(sub.end_date) || 'Present'}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded ${
                                                    sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    sub.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' :
                                                    'bg-surface-800 text-surface-400'
                                                }`}>
                                                    {sub.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-surface-500 text-center py-4">No subscription history available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: USERS LIST VIEW
    // ─────────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-heading flex items-center gap-2">
                        <Users size={20} className="text-primary-400" /> All Users
                    </h2>
                    <p className="text-xs text-surface-500 font-bold uppercase tracking-widest">Manage User Accounts & Subscriptions</p>
                </div>
                
                <div className="flex bg-surface-900 p-1.5 rounded-xl border border-surface-800 gap-1 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                        <input 
                            type="text" 
                            placeholder="Search name or email..." 
                            className="w-full bg-surface-950 border border-surface-800 rounded-lg pl-9 pr-3 py-2 text-xs text-heading focus:border-primary-500 outline-none transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-surface-950 border border-surface-800 rounded-lg px-3 py-2 text-xs text-heading focus:border-primary-500 outline-none"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-surface-800 bg-surface-900/80">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-500 w-1/3">User</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-500">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-500">Plan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-500">Joined Date</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-surface-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500 mx-auto mb-3"></div>
                                        <span className="text-xs font-bold uppercase tracking-widest">Loading users...</span>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-surface-500">
                                        <Users size={32} className="mx-auto mb-3 opacity-20" />
                                        <span className="text-xs font-bold uppercase tracking-widest">No users found</span>
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-surface-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500/20 to-indigo-500/20 text-primary-400 flex items-center justify-center font-bold text-xs border border-primary-500/20">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-heading group-hover:text-primary-400 transition-colors">{user.username}</p>
                                                    <p className="text-[10px] text-surface-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded flex inline-flex items-center gap-1 ${
                                                user.role === 'admin' ? 'bg-rose-500/10 text-rose-400' : 'bg-surface-800 text-surface-400'
                                            }`}>
                                                {user.role === 'admin' && <Shield size={10} />}
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded flex inline-flex items-center gap-1 ${
                                                user.subscription_status === 'active' && user.subscription_tier !== 'Free' 
                                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                                                : 'bg-surface-800 text-surface-500'
                                            }`}>
                                                {user.subscription_status === 'active' && user.subscription_tier !== 'Free' && <Crown size={10} />}
                                                {user.subscription_tier || 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-surface-400">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedUser(user)}
                                                className="px-3 py-1.5 bg-primary-500/10 text-primary-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-surface-800 flex justify-between items-center bg-surface-900/40">
                        <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">
                            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}
                        </p>
                        <div className="flex gap-1">
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(p => p - 1)}
                                className="p-1 rounded bg-surface-800 text-surface-400 disabled:opacity-30 hover:bg-surface-700"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-1 text-xs font-bold text-heading">{page} / {totalPages}</span>
                            <button 
                                disabled={page === totalPages} 
                                onClick={() => setPage(p => p + 1)}
                                className="p-1 rounded bg-surface-800 text-surface-400 disabled:opacity-30 hover:bg-surface-700"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
