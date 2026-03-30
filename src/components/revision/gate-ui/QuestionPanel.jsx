import React from 'react';
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { healLatexContent } from '../../../utils/jsonUtils';

/**
 * QuestionPanel — GATE-exact question content area.
 * White background, black text, radio/checkbox options, study mode feedback.
 */
const QuestionPanel = ({ session }) => {
    const {
        currentQ, currentQId, currentIdx, answers, marked, checked, feedback, mode,
        selectMCQ, toggleMSQ, setNAT, toggleMark, checkAnswer, revealAnswer
    } = session;

    if (!currentQ) return null;

    const font = { fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" };

    return (
        <div className="flex-1 overflow-y-auto p-6" style={{ ...font, background: '#ffffff', color: '#222' }}>
            {/* Question number */}
            <h3 className="text-sm font-bold mb-4" style={{ color: '#333' }}>
                Question No. {currentIdx + 1}
            </h3>

            {/* Question text */}
            <div className="text-sm leading-relaxed mb-6 question-latex" style={{ color: '#222' }}>
                {healLatexContent(currentQ.question_text)}
            </div>

            {/* Answer area */}
            {currentQ.question_type === 'nat' ? (
                <NATInput session={session} />
            ) : (
                <OptionsInput session={session} />
            )}

            {/* Study mode feedback */}
            {mode === 'study' && <StudyFeedback session={session} />}
        </div>
    );
};

// ─── NAT Input ──────────────────────────────────────────────────
const NATInput = ({ session }) => {
    const { currentQId, answers, checked, mode, setNAT, checkAnswer } = session;

    return (
        <div className="mt-4">
            <label className="text-xs font-semibold block mb-2" style={{ color: '#555' }}>Your Answer (Numerical):</label>
            <div className="flex items-center gap-3">
                <input
                    type="number"
                    step="any"
                    disabled={checked[currentQId]?.isCorrect}
                    value={answers[currentQId]?.value ?? ''}
                    onChange={e => setNAT(e.target.value)}
                    placeholder="Enter answer"
                    className="w-64 px-3 py-2 text-sm font-mono outline-none"
                    style={{
                        border: '1px solid #aaa', borderRadius: '3px',
                        background: checked[currentQId]?.isCorrect ? '#e8f5e9' : '#fff', color: '#222'
                    }}
                    autoFocus
                />
                {mode === 'study' && !checked[currentQId]?.isCorrect && (
                    <button onClick={checkAnswer}
                        className="px-4 py-2 text-xs font-bold text-white rounded"
                        style={{ background: '#2E86C1' }}>
                        Check
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── MCQ / MSQ Options ──────────────────────────────────────────
const OptionsInput = ({ session }) => {
    const { currentQ, currentQId, answers, checked, mode, selectMCQ, toggleMSQ, checkAnswer } = session;
    const isMCQ = currentQ.question_type === 'mcq';

    return (
        <div className="space-y-2.5 mt-2">
            {currentQ.question_type === 'msq' && (
                <p className="text-xs font-semibold mb-2" style={{ color: '#8E44AD' }}>Select one or more correct answers</p>
            )}
            {(currentQ.options || []).map((opt, optIdx) => {
                const isCorrect = currentQ.correct_answer?.includes(optIdx);
                const selected = isMCQ
                    ? (Array.isArray(answers[currentQId]) && answers[currentQId][0] === optIdx)
                    : (Array.isArray(answers[currentQId]) && answers[currentQId].includes(optIdx));

                const isRevealed = checked[currentQId]?.revealed;
                const isVerified = checked[currentQId]?.isCorrect;

                // Determine option styling
                let optBg = '#fff';
                let optBorder = '#ccc';
                if (selected) { optBg = '#EBF5FB'; optBorder = '#2E86C1'; }
                if (mode === 'study' && (isRevealed || (selected && isVerified))) {
                    if (isCorrect) { optBg = '#E8F8E9'; optBorder = '#27AE60'; }
                    else if (selected) { optBg = '#FDEDEC'; optBorder = '#E74C3C'; }
                }

                return (
                    <label key={optIdx}
                        className={`flex items-center gap-3 p-2.5 rounded cursor-pointer transition-all`}
                        style={{ border: `1px solid ${optBorder}`, background: optBg }}
                        onClick={(e) => {
                            e.preventDefault();
                            if (checked[currentQId]?.isCorrect || checked[currentQId]?.revealed) return;
                            isMCQ ? selectMCQ(optIdx) : toggleMSQ(optIdx);
                        }}
                    >
                        {/* Radio / Checkbox */}
                        <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                  border: `2px solid ${selected ? '#2E86C1' : '#aaa'}`,
                                  borderRadius: isMCQ ? '50%' : '3px',
                                  background: selected ? '#2E86C1' : 'transparent'
                              }}>
                            {selected && (
                                <span className="block w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />
                            )}
                        </span>

                        {/* Option letter */}
                        <span className="text-xs font-bold shrink-0" style={{ color: '#555', minWidth: '16px' }}>
                            {String.fromCharCode(65 + optIdx)}.
                        </span>

                        {/* Option text */}
                        <span className="text-sm flex-1" style={{ color: '#333' }}>
                            {healLatexContent(opt)}
                        </span>

                        {/* Correct indicator (study mode) */}
                        {mode === 'study' && (isRevealed || isVerified) && isCorrect && (
                            <CheckCircle2 size={16} style={{ color: '#27AE60' }} />
                        )}
                    </label>
                );
            })}

            {mode === 'study' && !checked[currentQId]?.isCorrect && !checked[currentQId]?.revealed && (
                <button onClick={checkAnswer}
                    className="w-full py-2.5 mt-2 text-xs font-bold rounded transition-all"
                    style={{ background: '#EBF5FB', color: '#2E86C1', border: '1px solid #2E86C1' }}>
                    Check Selected Answer
                </button>
            )}
        </div>
    );
};

// ─── Study Mode Feedback ────────────────────────────────────────
const StudyFeedback = ({ session }) => {
    const { currentQ, currentQId, checked, feedback, revealAnswer } = session;

    return (
        <div className="mt-6">
            {feedback && (
                <div className="flex items-start gap-3 p-4 rounded"
                     style={{
                         background: feedback.isCorrect ? '#E8F8E9' : '#FDEDEC',
                         border: `1px solid ${feedback.isCorrect ? '#27AE60' : '#E74C3C'}`
                     }}>
                    {feedback.isCorrect ? <CheckCircle2 size={20} style={{ color: '#27AE60' }} /> : <XCircle size={20} style={{ color: '#E74C3C' }} />}
                    <div className="flex-1">
                        <p className="text-xs font-bold" style={{ color: feedback.isCorrect ? '#27AE60' : '#E74C3C' }}>
                            {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#555' }}>{feedback.message}</p>
                    </div>
                    {!feedback.isCorrect && !checked[currentQId]?.revealed && (
                        <button onClick={revealAnswer}
                            className="px-3 py-1.5 text-[10px] font-bold rounded"
                            style={{ background: '#f0f0f0', border: '1px solid #ccc', color: '#333' }}>
                            Reveal Answer
                        </button>
                    )}
                </div>
            )}

            {checked[currentQId]?.revealed && (
                <div className="mt-4 p-4 rounded" style={{ background: '#FEFCF5', border: '1px solid #F39C12' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={14} style={{ color: '#F39C12' }} />
                        <span className="text-xs font-bold" style={{ color: '#F39C12' }}>Explanation & Answer</span>
                    </div>
                    <div className="p-3 rounded mb-3" style={{ background: '#E8F8E9', border: '1px solid #27AE60' }}>
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: '#27AE60' }}>Correct Answer</p>
                        <p className="text-sm font-bold" style={{ color: '#222' }}>
                            {currentQ.question_type === 'nat'
                                ? `${currentQ.correct_answer.value} (±${currentQ.correct_answer.tolerance || 0.01})`
                                : currentQ.correct_answer.map(idx => String.fromCharCode(65 + idx)).join(', ')}
                        </p>
                    </div>
                    {currentQ.explanation && (
                        <div className="text-xs leading-relaxed" style={{ color: '#444' }}
                             dangerouslySetInnerHTML={{ __html: healLatexContent(currentQ.explanation) }} />
                    )}
                </div>
            )}
        </div>
    );
};

export default QuestionPanel;
