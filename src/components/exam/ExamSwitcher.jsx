import { useState, useRef, useEffect } from 'react';
import { useExam } from '../../contexts/ExamContext';
import { ChevronDown, Check, GraduationCap } from 'lucide-react';

/**
 * ExamSwitcher — dropdown in the header to switch between enrolled exams.
 * Only shown when user has 2+ enrollments.
 */
const ExamSwitcher = () => {
    const { activeExam, enrollments, switchExam } = useExam();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!activeExam || enrollments.length < 2) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-indigo-500/50 transition-all"
            >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeExam.primary_color }} />
                <span className="text-xs font-bold text-white uppercase tracking-wide max-w-[100px] truncate">{activeExam.name}</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-12 right-0 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-3 border-b border-slate-800">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Switch Exam</p>
                    </div>
                    {enrollments.map(e => (
                        <button
                            key={e.exam_id}
                            onClick={async () => { await switchExam(e.exam_id); setOpen(false); }}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                                activeExam.id === e.exam_id
                                    ? 'bg-indigo-500/10 text-indigo-400'
                                    : 'text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.primary_color }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{e.name}</p>
                                <p className="text-[10px] text-slate-600">{e.category_name}</p>
                            </div>
                            {activeExam.id === e.exam_id && <Check size={14} className="text-indigo-400 shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExamSwitcher;
