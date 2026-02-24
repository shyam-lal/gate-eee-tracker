import React, { useState, useEffect } from 'react';
import {
    Users, Search, UserPlus, UserMinus,
    Award, Flame, Trophy,
    ChevronRight, ArrowLeft, SearchIcon,
    Globe, Shield, Medal, Star
} from 'lucide-react';
import { social as socialApi } from '../services/api';

const Social = ({ currentUser, onBack }) => {
    const [activeTab, setActiveTab] = useState('friends');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [following, setFollowing] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [selectedUserProfile, setSelectedUserProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSocialData();
        loadAchievements();
    }, []);

    const loadSocialData = async () => {
        try {
            const data = await socialApi.getFollowing();
            setFollowing(data.following || []);
        } catch (err) { console.error(err); }
    };

    const loadAchievements = async () => {
        try {
            const data = await socialApi.getAchievements();
            setAchievements(data);
        } catch (err) { console.error(err); }
    };

    const handleSearch = async (e) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const results = await socialApi.search(q);
            setSearchResults(results);
        } catch (err) { console.error(err); }
    };

    const toggleFollow = async (userId, isFollowing) => {
        try {
            if (isFollowing) {
                await socialApi.unfollow(userId);
            } else {
                await socialApi.follow(userId);
            }
            loadSocialData();
            if (selectedUserProfile && selectedUserProfile.id === userId) {
                viewProfile(userId);
            }
            // Re-run search to update status if in search results
            if (searchQuery) handleSearch({ target: { value: searchQuery } });
        } catch (err) { alert("Action failed"); }
    };

    const viewProfile = async (userId) => {
        setLoading(true);
        try {
            const profile = await socialApi.getProfile(userId);
            setSelectedUserProfile(profile);
        } catch (err) { alert("Could not load profile"); }
        finally { setLoading(false); }
    };

    const renderMedal = (type) => {
        switch (type) {
            case 'flame': return <Flame className="text-orange-500" size={24} />;
            case 'zap': return <Star className="text-yellow-400" size={24} fill="currentColor" />;
            case 'award': return <Trophy className="text-indigo-400" size={24} />;
            case 'clock': return <Medal className="text-emerald-400" size={24} />;
            case 'box': return <Award className="text-purple-400" size={24} />;
            default: return <Award className="text-slate-400" size={24} />;
        }
    };

    if (selectedUserProfile) {
        return (
            <div className="min-h-screen bg-[#020617] text-slate-200 p-6 animate-in fade-in zoom-in-95 duration-300">
                <button onClick={() => setSelectedUserProfile(null)} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest">
                    <ArrowLeft size={14} /> Back to Hub
                </button>

                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem]">
                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-600/20">
                            {selectedUserProfile.username[0].toUpperCase()}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">{selectedUserProfile.username}</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-6">Vault Protocol Engineer</p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 px-4 py-2 rounded-xl border border-orange-500/20">
                                    <Flame size={16} fill="currentColor" />
                                    <span className="font-black text-sm">{selectedUserProfile.current_streak} Day Streak</span>
                                </div>
                                <button
                                    onClick={() => toggleFollow(selectedUserProfile.id, selectedUserProfile.isFollowing)}
                                    className={`px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${selectedUserProfile.isFollowing ? 'bg-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'}`}
                                >
                                    {selectedUserProfile.isFollowing ? 'Following' : 'Follow Engineer'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-8">
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                                <Medal className="text-indigo-400" /> Vault Achievements
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                {selectedUserProfile.achievements?.length > 0 ? selectedUserProfile.achievements.map((ach, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 group">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            {renderMedal(ach.icon_name)}
                                        </div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase text-center leading-tight">{ach.name}</span>
                                    </div>
                                )) : (
                                    <p className="col-span-3 text-center text-slate-600 font-bold uppercase text-[10px] tracking-widest py-8">No medals collected yet</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-8">
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                                <Globe className="text-indigo-400" /> Engineer Bio
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed font-medium italic">
                                "{selectedUserProfile.bio || 'This engineer is focused on their mission and hasn\'t written a bio yet.'}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col pt-12">
            <nav className="max-w-6xl mx-auto w-full px-6 flex justify-between items-center mb-12">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest">
                    <ArrowLeft size={14} /> Back to Hub
                </button>
                <div className="flex items-center gap-3">
                    <Users size={20} className="text-indigo-400" />
                    <h1 className="text-xl font-black uppercase tracking-tighter">Social <span className="text-indigo-500">Terminal</span></h1>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto w-full px-6 flex-1 flex flex-col lg:flex-row gap-12">
                {/* Sidebar: Search & Tabs */}
                <aside className="lg:w-80 shrink-0 space-y-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search Engineers..."
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder-slate-600 focus:border-indigo-500 outline-none transition-all"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <nav className="flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex items-center justify-between p-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all ${activeTab === 'friends' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900/30 text-slate-500 hover:bg-slate-800/50'}`}
                        >
                            <span className="flex items-center gap-3"><Users size={16} /> Following</span>
                            <span>{following.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('achievements')}
                            className={`flex items-center justify-between p-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all ${activeTab === 'achievements' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900/30 text-slate-500 hover:bg-slate-800/50'}`}
                        >
                            <span className="flex items-center gap-3"><Trophy size={16} /> My Medals</span>
                            <span>{achievements.length}</span>
                        </button>
                    </nav>

                    {searchQuery.length >= 2 && (
                        <div className="bg-slate-900/30 border border-slate-800 rounded-[2rem] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/20">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Search Results</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {searchResults.length > 0 ? searchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-all border-b border-slate-800/50 last:border-0">
                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => viewProfile(user.id)}>
                                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">{user.username[0].toUpperCase()}</div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase">{user.username}</p>
                                                <p className="text-[9px] text-orange-500 font-bold flex items-center gap-1"><Flame size={10} fill="currentColor" /> {user.current_streak}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleFollow(user.id, following.some(f => f.id === user.id))} className="text-indigo-400 hover:text-white transition-colors">
                                            {following.some(f => f.id === user.id) ? <UserMinus size={18} /> : <UserPlus size={18} />}
                                        </button>
                                    </div>
                                )) : <p className="p-4 text-center text-[10px] font-bold text-slate-600">No engineers found</p>}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Content Area */}
                <section className="flex-1 bg-slate-900/20 border border-slate-800/50 rounded-[3rem] p-8 md:p-12">
                    {activeTab === 'friends' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Command Fleet <span className="text-indigo-500 italic ml-2">(Following)</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {following.length > 0 ? following.map(user => (
                                    <div key={user.id} onClick={() => viewProfile(user.id)} className="flex items-center justify-between bg-slate-900/40 p-5 rounded-3xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-lg group-hover:bg-indigo-600 transition-colors">{user.username[0].toUpperCase()}</div>
                                            <div>
                                                <h4 className="font-black text-white uppercase tracking-tight">{user.username}</h4>
                                                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                    <span className="flex items-center gap-1 text-orange-400"><Flame size={12} fill="currentColor" /> {user.current_streak} Streak</span>
                                                    <span>Sync Active</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-700 group-hover:text-indigo-500 transition-all" />
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 text-center space-y-4">
                                        <Users size={48} className="text-slate-800 mx-auto" />
                                        <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Your fleet is empty. Search for engineers to follow.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'achievements' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center md:text-left">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">My Service Medals</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                {achievements.length > 0 ? achievements.map((ach, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-4 p-8 bg-slate-900/60 rounded-[2rem] border border-slate-800 shadow-xl shadow-black/20 group hover:scale-105 transition-all">
                                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                            {renderMedal(ach.icon_name)}
                                        </div>
                                        <div className="text-center">
                                            <h4 className="font-black text-white uppercase tracking-tighter text-sm mb-1">{ach.name}</h4>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{new Date(ach.earned_at).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity">{ach.description}</p>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 text-center space-y-4">
                                        <Trophy size={48} className="text-slate-800 mx-auto" />
                                        <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">No achievements earned yet. Start sync sessions to earn medals.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Social;
