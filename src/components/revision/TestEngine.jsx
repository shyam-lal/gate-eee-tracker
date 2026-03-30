import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Pause, Play, X } from 'lucide-react';
import useTestSession from '../../hooks/useTestSession';
import GateHeader from './gate-ui/GateHeader';
import SectionBar from './gate-ui/SectionBar';
import QuestionPanel from './gate-ui/QuestionPanel';
import QuestionPalette from './gate-ui/QuestionPalette';
import ActionBar from './gate-ui/ActionBar';
import ScientificCalc from './gate-ui/ScientificCalc';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/dist/contrib/auto-render.js';

/**
 * TestEngine — GATE exam-style test interface.
 * Uses useTestSession hook for all state and composes modular UI components.
 */
const TestEngine = ({ set, attempt, mode = 'exam', toolId, onComplete, onExit }) => {
    const session = useTestSession({ set, attempt, mode, toolId, onComplete, onExit });
    const [showCalc, setShowCalc] = useState(false);
    const containerRef = useRef(null);

    // Render LaTeX whenever question changes
    useEffect(() => {
        if (containerRef.current) {
            renderMathInElement(containerRef.current, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }
    }, [session.currentIdx, session.checked, session.feedback, session.questions]);

    if (session.loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: '#f5f5f5' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: '#2E86C1' }} />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#ffffff' }}>
            {/* Header: Title bar + Subject + Timer */}
            <GateHeader session={session} showCalc={showCalc} onToggleCalc={() => setShowCalc(v => !v)} />

            {/* Section bar: Topic tabs + Question info */}
            <SectionBar session={session} />

            {/* Main content: Question Panel + Palette sidebar */}
            <div className="flex-1 flex overflow-hidden" style={{ borderTop: '1px solid #ddd' }}>
                <QuestionPanel session={session} />
                <QuestionPalette session={session} />
            </div>

            {/* Bottom action bar */}
            <ActionBar session={session} />

            {/* Scientific Calculator (draggable popup) */}
            {showCalc && <ScientificCalc onClose={() => setShowCalc(false)} />}

            {/* Pause Menu Overlay */}
            {session.showPauseMenu && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                     style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="max-w-sm w-full text-center rounded-lg p-8"
                         style={{ background: '#fff', border: '2px solid #2E86C1', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontFamily: "'Segoe UI', sans-serif" }}>
                        <Pause size={48} style={{ color: '#F39C12' }} className="mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#1B4F72' }}>Test Paused</h3>
                        <p className="text-sm mb-6" style={{ color: '#666' }}>Your progress has been saved.</p>
                        <div className="space-y-3">
                            <button onClick={session.resume}
                                className="w-full py-3 rounded font-bold text-sm text-white flex items-center justify-center gap-2"
                                style={{ background: '#2E86C1' }}>
                                <Play size={16} /> Resume Test
                            </button>
                            <button onClick={session.exitSave}
                                className="w-full py-3 rounded font-bold text-sm"
                                style={{ background: '#f0f0f0', border: '1px solid #ccc', color: '#333' }}>
                                Save & Exit
                            </button>
                            <button onClick={session.handleSubmit}
                                className="w-full py-3 rounded font-bold text-sm text-white"
                                style={{ background: '#27AE60', border: '1px solid #1E8449' }}>
                                Submit Test
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestEngine;
