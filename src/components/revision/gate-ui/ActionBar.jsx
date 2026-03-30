import React from 'react';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ActionBar — GATE-exact bottom action bar.
 * Gray background with: Mark for Review & Next | Clear Response || Previous | Save & Next | Submit
 */
const ActionBar = ({ session }) => {
    const { markAndNext, clearResponse, handlePrev, saveAndNext, handleSubmit, submitting, currentIdx, isLastQuestion } = session;
    const font = { fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" };

    return (
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5"
             style={{ ...font, background: '#e0e0e0', borderTop: '2px solid #bbb' }}>
            {/* Left: Mark + Clear */}
            <div className="flex items-center gap-3">
                <button onClick={markAndNext}
                    className="px-4 py-2 text-xs font-semibold rounded transition-all"
                    style={{ background: '#f0f0f0', border: '1px solid #999', color: '#333' }}>
                    Mark for Review & Next
                </button>
                <button onClick={clearResponse}
                    className="px-4 py-2 text-xs font-semibold rounded transition-all"
                    style={{ background: '#f0f0f0', border: '1px solid #999', color: '#333' }}>
                    Clear Response
                </button>
            </div>

            {/* Right: Previous, Save & Next, Submit */}
            <div className="flex items-center gap-3">
                <button onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className="px-4 py-2 text-xs font-semibold rounded transition-all disabled:opacity-40"
                    style={{ background: '#f0f0f0', border: '1px solid #999', color: '#333' }}>
                    Previous
                </button>
                <button onClick={saveAndNext}
                    className="px-5 py-2 text-xs font-bold rounded text-white transition-all"
                    style={{ background: '#2E86C1', border: '1px solid #1B6FA0' }}>
                    {isLastQuestion ? 'Save' : 'Save & Next'}
                </button>
                <button onClick={handleSubmit}
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold rounded text-white transition-all disabled:opacity-50"
                    style={{ background: '#27AE60', border: '1px solid #1E8449' }}>
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </div>
    );
};

export default ActionBar;
