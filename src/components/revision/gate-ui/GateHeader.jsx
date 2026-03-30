import React from 'react';
import { Pause, Calculator, Clock, BookOpen } from 'lucide-react';

/**
 * GateHeader — Pixel-accurate GATE exam header.
 * Blue header bar + subject line + section tabs + question info.
 */
const GateHeader = ({ session, showCalc, onToggleCalc }) => {
    const { set, mode, timer, totalTime, timePerQ, timerPct, formatTime, pause } = session;
    const subject = set.topics ? set.topics.split(',')[0].trim() : set.title;

    return (
        <div className="shrink-0" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            {/* ── Top Blue Header ── */}
            <div style={{ background: 'linear-gradient(180deg, #2E86C1 0%, #1B4F72 100%)', borderBottom: '3px solid #F39C12' }}
                 className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                         style={{ background: '#F39C12' }}>
                        <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-wide">
                            GRADUATE APTITUDE TEST IN ENGINEERING (GATE 2027)
                        </h1>
                        <p className="text-[10px] text-white/70">Organizing Institute: GATE Vault Practice Platform</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onToggleCalc}
                        className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                        style={{ background: showCalc ? '#F39C12' : 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                        Calculator
                    </button>
                    <button onClick={pause}
                        className="px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1"
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
                        <Pause size={12} /> Pause
                    </button>
                    {mode === 'study' && (
                        <span className="px-3 py-1 rounded text-[10px] font-bold"
                              style={{ background: '#F39C12', color: '#fff' }}>
                            <BookOpen size={10} className="inline mr-1" /> STUDY MODE
                        </span>
                    )}
                </div>
            </div>

            {/* ── Subject breadcrumb line ── */}
            <div style={{ background: '#f0f0f0', borderBottom: '1px solid #ccc' }} className="px-4 py-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: '#333' }}>{set.title}</span>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium" style={{ color: '#666' }}>×</span>
                </div>
            </div>

            {/* ── Section tabs + Time row ── */}
            <div style={{ background: '#e8e8e8', borderBottom: '1px solid #ccc' }} className="px-4 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded text-[11px] font-bold text-white"
                          style={{ background: '#1B4F72' }}>
                        {subject}
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#555' }}>Sections</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: '#555' }}>Time Left :</span>
                    <span className="text-sm font-bold font-mono" style={{ color: timerPct > 80 ? '#E74C3C' : '#1B4F72' }}>
                        {mode === 'exam' ? formatTime(timePerQ - timer) : formatTime(totalTime)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GateHeader;
