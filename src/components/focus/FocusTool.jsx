import React, { useState, useEffect } from 'react';
import { focus as focusApi } from '../../services/api';
import { Hash, Target, Timer, BarChart3, CalendarDays, TrendingUp } from 'lucide-react';

const formatMinsToHours = (mins) => {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
};

const FocusTool = ({ tool }) => {
    const [recentSessions, setRecentSessions] = useState([]);
    const [stats, setStats] = useState({ totalTime: 0, timeToday: 0 });

    useEffect(() => {
        if (tool?.id) {
            loadData();
        }
    }, [tool?.id]);

    const loadData = async () => {
        try {
            const [sessionsData, statsData] = await Promise.all([
                focusApi.getSessions(tool.id),
                focusApi.getStats(tool.id)
            ]);
            setRecentSessions(sessionsData);
            setStats(statsData);
        } catch (err) {
            console.error("Failed to load focus data", err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <BarChart3 className="text-indigo-400" /> Focus Analytics
                    </h2>
                    <p className="text-slate-400 mt-2 font-medium">Tracking all your intense study periods.</p>
                </div>
                <div className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} /> Auto-Sync Active
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Timer size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Time Today</p>
                        <p className="text-5xl font-black text-white">{formatMinsToHours(stats.timeToday)}</p>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden group md:col-span-1 lg:col-span-2">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CalendarDays size={100} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Focus Time All-Time</p>
                        <p className="text-5xl font-black text-indigo-400 tracking-tighter">{formatMinsToHours(stats.totalTime)}</p>
                    </div>
                </div>
            </div>

            {/* Recent Sessions List */}
            <div>
                <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-6">Recent Sessions</h3>
                {recentSessions.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[3rem] p-16 text-center">
                        <Timer size={64} className="mx-auto text-slate-700 mb-6" />
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-lg mb-2">No focus sessions yet</h4>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">Click "Start Focus Mode" on your dashboard to log your first intense study session.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentSessions.map(session => (
                            <div key={session.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="text-white font-black text-2xl tracking-tighter mb-1">{session.duration_minutes}m</h4>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                            {new Date(session.completed_at).toLocaleDateString()} at {new Date(session.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {session.linked_topic_id && (
                                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl" title="Synced to Course Tracker">
                                            <Target size={20} />
                                        </div>
                                    )}
                                </div>

                                {session.notes && (
                                    <div className="bg-slate-950/50 rounded-xl p-4 mb-6">
                                        <p className="text-slate-400 text-sm italic">"{session.notes}"</p>
                                    </div>
                                )}

                                <div className="mt-auto">
                                    {session.linked_topic_id ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wide w-full truncate">
                                            <Hash size={14} className="text-indigo-400 shrink-0" />
                                            <span className="truncate">{session.subject_name} / {session.topic_name}</span>
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wide w-full">
                                            <Timer size={14} className="shrink-0" /> General Study
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FocusTool;
