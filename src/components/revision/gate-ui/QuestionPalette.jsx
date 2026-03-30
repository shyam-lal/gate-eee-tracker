import React, { useState } from 'react';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * QuestionPalette — GATE-exact right sidebar.
 * Profile icon, status legend, section name, numbered question grid.
 */
const QuestionPalette = ({ session }) => {
    const { questions, currentIdx, set, goTo, getQuestionStatus } = session;
    const [collapsed, setCollapsed] = useState(false);

    const sectionName = set.topics ? set.topics.split(',')[0].trim() : set.title;

    // GATE-exact status colors
    const statusColors = {
        'current':         { bg: '#F39C12', color: '#fff', border: '#F39C12' },
        'answered':        { bg: '#27AE60', color: '#fff', border: '#27AE60' },
        'not-answered':    { bg: '#E74C3C', color: '#fff', border: '#E74C3C' },
        'marked':          { bg: '#8E44AD', color: '#fff', border: '#8E44AD' },
        'answered-marked': { bg: '#27AE60', color: '#fff', border: '#8E44AD' },
        'not-visited':     { bg: '#BDC3C7', color: '#555', border: '#BDC3C7' },
    };

    // Count statuses for legend
    const counts = { answered: 0, 'not-answered': 0, 'not-visited': 0, marked: 0, 'answered-marked': 0 };
    questions.forEach(qId => {
        const s = getQuestionStatus(qId);
        if (s !== 'current') counts[s] = (counts[s] || 0) + 1;
    });

    const font = { fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" };

    if (collapsed) {
        return (
            <div className="shrink-0 w-8 flex flex-col items-center pt-4"
                 style={{ ...font, background: '#f5f5f5', borderLeft: '1px solid #ccc' }}>
                <button onClick={() => setCollapsed(false)} style={{ color: '#666' }}><ChevronLeft size={16} /></button>
            </div>
        );
    }

    return (
        <div className="shrink-0 w-64 flex flex-col overflow-hidden"
             style={{ ...font, background: '#f5f5f5', borderLeft: '1px solid #ccc' }}>

            {/* Profile + Collapse */}
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid #ddd' }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                         style={{ background: '#2E86C1', color: '#fff' }}>
                        <User size={16} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#333' }}>Candidate</span>
                </div>
                <button onClick={() => setCollapsed(true)} style={{ color: '#888' }}><ChevronRight size={14} /></button>
            </div>

            {/* Status Legend */}
            <div className="px-3 py-2 space-y-1" style={{ borderBottom: '1px solid #ddd', fontSize: '10px' }}>
                <LegendRow bg="#27AE60" label="Answered" count={counts.answered} />
                <LegendRow bg="#E74C3C" label="Not Answered" count={counts['not-answered']} />
                <LegendRow bg="#BDC3C7" textColor="#555" label="Not Visited" count={counts['not-visited']} />
                <LegendRow bg="#8E44AD" label="Marked for Review" count={counts.marked} />
                <LegendRow bg="#27AE60" ring="#8E44AD" label="Answered & Marked for Review (will also be evaluated)" count={counts['answered-marked']} />
            </div>

            {/* Section name */}
            <div className="px-3 py-2" style={{ borderBottom: '1px solid #ddd' }}>
                <p className="text-[10px] font-bold" style={{ color: '#E74C3C' }}>{sectionName}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#555' }}>Choose a Question</p>
            </div>

            {/* Question grid */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
                <div className="grid grid-cols-4 gap-1.5">
                    {questions.map((qId, idx) => {
                        const status = getQuestionStatus(qId);
                        const s = statusColors[status] || statusColors['not-visited'];
                        const ringStyle = status === 'answered-marked' ? { boxShadow: `0 0 0 2px ${s.border}` } : {};

                        return (
                            <button
                                key={qId}
                                onClick={() => goTo(idx)}
                                className="w-full aspect-square rounded text-xs font-bold transition-all"
                                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, ...ringStyle }}
                                title={`Q${idx + 1} — ${status.replace('-', ' ')}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const LegendRow = ({ bg, ring, textColor = '#fff', label, count }) => (
    <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-sm shrink-0 inline-block"
              style={{ background: bg, color: textColor, border: ring ? `2px solid ${ring}` : 'none' }} />
        <span className="flex-1 leading-tight" style={{ color: '#555', fontSize: '9px' }}>
            {count > 0 && <strong>{count} </strong>}{label}
        </span>
    </div>
);

export default QuestionPalette;
