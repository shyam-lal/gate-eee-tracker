import React, { useState, useEffect, useRef } from 'react';
import { focus as focusApi } from '../../services/api';
import { Play, Square, Save, X, Hash, Clock, Target, RotateCcw, Pause, Timer, Maximize2, Minimize2 } from 'lucide-react';

const formatTimeHHMMSS = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const GlobalFocusOverlay = ({
    isOpen,
    onClose,
    focusToolId,
    onSessionSaved,
    // Add minimized state support
    isMinimized,
    onToggleMinimize
}) => {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const [taggableItems, setTaggableItems] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveData, setSaveData] = useState({ durationMinutes: 0, subjectId: "", topicId: "", notes: "" });

    const timerRef = useRef(null);

    useEffect(() => {
        if (isOpen && taggableItems.length === 0) {
            focusApi.getTaggableItems().then(setTaggableItems).catch(console.error);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning]);

    const handleStartPause = () => setIsRunning(!isRunning);

    const handleStop = () => {
        setIsRunning(false);
        const mins = Math.ceil(seconds / 60);
        if (mins >= 1) {
            setSaveData(prev => ({ ...prev, durationMinutes: mins }));
            setShowSaveModal(true);
        } else {
            handleReset();
            onClose();
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setSeconds(0);
    };

    const handleSaveSession = async (e) => {
        e.preventDefault();
        try {
            await focusApi.logSession({
                toolId: focusToolId,
                durationMinutes: saveData.durationMinutes,
                linkedSubjectId: saveData.subjectId ? parseInt(saveData.subjectId) : null,
                linkedTopicId: saveData.topicId ? parseInt(saveData.topicId) : null,
                notes: saveData.notes
            });
            handleReset();
            setShowSaveModal(false);
            setSaveData({ durationMinutes: 0, subjectId: "", topicId: "", notes: "" });
            onSessionSaved?.();
            onClose(); // completely close overlay after saving
        } catch (err) {
            console.error(err);
            alert('Failed to save session');
        }
    };

    if (!isOpen && !isMinimized) return null;

    // MINIMIZED PILL (Floating in the corner)
    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5">
                <div className="bg-slate-900 border border-slate-700 p-2 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                        <Timer size={20} className={isRunning ? 'animate-pulse' : ''} />
                    </div>
                    <div className="font-mono text-lg font-black text-white px-2 tabular-nums">
                        {formatTimeHHMMSS(seconds)}
                    </div>
                    <div className="flex gap-1 pr-2">
                        <button onClick={handleStartPause} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
                            {isRunning ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current" />}
                        </button>
                        <button onClick={onToggleMinimize} className="p-2 text-slate-400 hover:text-indigo-400 rounded-full hover:bg-slate-800 transition-colors">
                            <Maximize2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // FULL SCREEN OVERLAY
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Main Timer Dialog */}
            {!showSaveModal && (
                <div className="bg-gradient-to-br from-slate-900 via-[#0b1121] to-slate-950 border border-slate-800 rounded-[3rem] w-full max-w-2xl p-8 md:p-16 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden animate-in zoom-in-95">
                    {isRunning && <div className="absolute inset-0 bg-indigo-500/5 animate-pulse rounded-[3rem] pointer-events-none" />}

                    {/* Top Controls */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                        <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-sm">
                            <Timer size={18} /> Focus Mode
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onToggleMinimize} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all">
                                <Minimize2 size={20} />
                            </button>
                            <button onClick={onClose} className="p-3 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 mb-16">
                        <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter font-mono tabular-nums drop-shadow-2xl z-10 text-center">
                            {formatTimeHHMMSS(seconds)}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 w-full justify-center z-10">
                        {/* Play/Pause Button */}
                        <button
                            onClick={handleStartPause}
                            className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center shadow-2xl transition-all ${isRunning
                                    ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/30'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95'
                                }`}
                        >
                            {isRunning ? <Pause size={40} className="fill-current" /> : <Play size={44} className="fill-current ml-2" />}
                        </button>

                        {/* Stop / Finish Button */}
                        <button
                            onClick={handleStop}
                            className="w-20 h-20 md:w-24 md:h-24 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-full flex items-center justify-center shadow-lg transition-all"
                        >
                            <Square size={28} className="fill-current" />
                        </button>

                        {/* Reset Button */}
                        {!isRunning && seconds > 0 && (
                            <button
                                onClick={handleReset}
                                className="w-16 h-16 md:w-20 md:h-20 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700"
                            >
                                <RotateCcw size={22} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Save Modal */}
            {showSaveModal && (
                <div className="bg-[#0b1121] border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-white font-black uppercase tracking-tighter text-lg flex items-center gap-2">
                            <Save size={18} className="text-indigo-400" /> Save Focus Session
                        </h3>
                        <button onClick={() => setShowSaveModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSaveSession} className="p-6 space-y-6">
                        <div className="flex items-center gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                            <div className="w-16 h-16 bg-indigo-500/10 flex items-center justify-center text-indigo-400 rounded-xl">
                                <Clock size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Elapsed</p>
                                <div className="flex items-baseline gap-2">
                                    <input
                                        type="number"
                                        value={saveData.durationMinutes}
                                        onChange={e => setSaveData({ ...saveData, durationMinutes: parseInt(e.target.value) || 0 })}
                                        className="bg-transparent border-b-2 border-indigo-500 text-3xl font-black text-white w-20 outline-none text-center"
                                    />
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Minutes</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex justify-between items-center">
                                Optional Topic Tagging
                                <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[8px]">Auto-Syncs</span>
                            </label>

                            <div className="space-y-3">
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500"
                                    value={saveData.subjectId}
                                    onChange={e => setSaveData({ ...saveData, subjectId: e.target.value, topicId: "" })}
                                >
                                    <option value="">-- Select Subject (General Study) --</option>
                                    {taggableItems.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>

                                {saveData.subjectId && (
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500"
                                        value={saveData.topicId}
                                        onChange={e => setSaveData({ ...saveData, topicId: e.target.value })}
                                    >
                                        <option value="">-- Select Topic --</option>
                                        {taggableItems.find(s => s.id == saveData.subjectId)?.topics.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                                If you select a subject/topic, this study time will automatically be added to your Course Tracker progress!
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Quick Notes (Optional)</label>
                            <textarea
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white outline-none focus:border-indigo-500 resize-none h-24"
                                placeholder="What did you focus on?"
                                value={saveData.notes}
                                onChange={e => setSaveData({ ...saveData, notes: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-white text-black hover:bg-indigo-500 hover:text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all flex justify-center items-center gap-2">
                            Save Focus Lock
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default GlobalFocusOverlay;
