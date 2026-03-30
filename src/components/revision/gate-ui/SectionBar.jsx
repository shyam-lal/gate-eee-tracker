import React from 'react';

/**
 * SectionBar — GATE question info bar.
 * Shows section pill + question type + marks info, exactly matching the GATE UI.
 */
const SectionBar = ({ session }) => {
    const { set, currentQ } = session;
    const section = set.topics ? set.topics.split(',')[0].trim() : set.title;

    if (!currentQ) return null;

    return (
        <div className="shrink-0 px-4 py-2 flex flex-wrap items-center gap-4"
             style={{ background: '#fafafa', borderBottom: '1px solid #ddd', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
            {/* Section pill */}
            <span className="px-3 py-1 rounded text-[11px] font-bold text-white"
                  style={{ background: '#27AE60' }}>
                {section}
            </span>

            {/* Question type */}
            <span className="text-xs" style={{ color: '#555' }}>
                Question Type: <strong style={{ color: '#1B4F72' }}>{currentQ.question_type?.toUpperCase()}</strong>
            </span>

            {/* Marks */}
            <span className="text-xs" style={{ color: '#555' }}>
                Marks for Correct Answer: <strong style={{ color: '#27AE60' }}>{currentQ.marks || 1}</strong>
            </span>

            {/* Negative marks */}
            <span className="text-xs" style={{ color: '#555' }}>
                Negative Marks: <strong style={{ color: '#E74C3C' }}>{currentQ.negative_marks || '0.00'}</strong>
            </span>
        </div>
    );
};

export default SectionBar;
