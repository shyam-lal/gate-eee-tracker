import React, { useState, useEffect } from 'react';
import { onboarding as onboardingApi } from '../../services/api';
import { ChevronRight, ArrowLeft, Layers, Columns, GripVertical, AlertTriangle } from 'lucide-react';

const BattlePlanSetup = ({ onComplete, onBack, subjects = [] }) => {
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState('SUBJECT_BY_SUBJECT');
    const [subjectOrder, setSubjectOrder] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (subjects.length > 0 && subjectOrder.length === 0) {
            setSubjectOrder(subjects.map(s => s.subject_id || s.id));
        }
    }, [subjects]);

    const handleNext = () => setStep(2);
    
    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newOrder = [...subjectOrder];
        const temp = newOrder[index - 1];
        newOrder[index - 1] = newOrder[index];
        newOrder[index] = temp;
        setSubjectOrder(newOrder);
    };

    const handleMoveDown = (index) => {
        if (index === subjectOrder.length - 1) return;
        const newOrder = [...subjectOrder];
        const temp = newOrder[index + 1];
        newOrder[index + 1] = newOrder[index];
        newOrder[index] = temp;
        setSubjectOrder(newOrder);
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            await onboardingApi.savePreferences({
                mode,
                subject_order: subjectOrder,
                parallel_limit: mode === 'PARALLEL' ? 2 : 1
            });
            onComplete();
        } catch (err) {
            alert('Failed to save preferences: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-base flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-surface-900/90 border border-surface-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
                
                <div className="text-center mb-8">
                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em]">Battle Planner Setup</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-heading uppercase tracking-tighter mt-2">
                        {step === 1 ? 'Learning Mode' : 'Subject Priority'}
                    </h2>
                </div>

                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <p className="text-surface-500 text-sm mb-4 text-center">How do you want the planner to schedule your topics?</p>
                        
                        <div 
                            onClick={() => setMode('SUBJECT_BY_SUBJECT')}
                            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex gap-4 ${mode === 'SUBJECT_BY_SUBJECT' ? 'border-primary-500 bg-primary-500/10' : 'border-surface-800 hover:border-surface-700'}`}
                        >
                            <div className={`p-3 rounded-xl h-fit ${mode === 'SUBJECT_BY_SUBJECT' ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400'}`}>
                                <Layers size={24} />
                            </div>
                            <div>
                                <h4 className="font-black uppercase text-lg text-heading">Deep Dive</h4>
                                <p className="text-xs text-surface-500 mt-1">Subject-by-subject. Master one entire subject before the planner introduces the next one.</p>
                            </div>
                        </div>

                        <div 
                            onClick={() => setMode('PARALLEL')}
                            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex gap-4 ${mode === 'PARALLEL' ? 'border-primary-500 bg-primary-500/10' : 'border-surface-800 hover:border-surface-700'}`}
                        >
                            <div className={`p-3 rounded-xl h-fit ${mode === 'PARALLEL' ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400'}`}>
                                <Columns size={24} />
                            </div>
                            <div>
                                <h4 className="font-black uppercase text-lg text-heading">Balanced</h4>
                                <p className="text-xs text-surface-500 mt-1">Parallel study. The planner will interleave topics from 2 active subjects to prevent burnout.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            {onBack && (
                                <button onClick={onBack} className="px-6 py-4 border border-surface-800 text-surface-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-heading">
                                    <ArrowLeft size={16} className="inline mr-2" /> Back
                                </button>
                            )}
                            <button onClick={handleNext} className="flex-1 bg-primary-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-500">
                                Next Step <ChevronRight size={18} className="inline ml-1" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="text-xs text-amber-200/80 leading-relaxed">
                                    Drag to reorder subjects. The planner will strictly block topics if their prerequisites aren't met, regardless of this order.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {subjectOrder.map((id, index) => {
                                const subject = subjects.find(s => (s.subject_id || s.id) === id);
                                if (!subject) return null;
                                return (
                                    <div key={id} className="flex items-center gap-3 p-3 bg-surface-950 border border-surface-800 rounded-xl">
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="text-surface-600 hover:text-white disabled:opacity-20"><GripVertical size={14} className="rotate-90" /></button>
                                            <button onClick={() => handleMoveDown(index)} disabled={index === subjectOrder.length - 1} className="text-surface-600 hover:text-white disabled:opacity-20"><GripVertical size={14} className="rotate-90" /></button>
                                        </div>
                                        <span className="font-bold text-sm text-heading">{subject.subject_name || subject.name}</span>
                                        <span className="ml-auto text-[10px] text-surface-500 font-bold uppercase tracking-widest">#{index + 1}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setStep(1)} className="px-6 py-4 border border-surface-800 text-surface-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-heading">
                                <ArrowLeft size={16} className="inline mr-2" /> Back
                            </button>
                            <button onClick={handleFinish} disabled={loading} className="flex-1 bg-primary-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-500 disabled:opacity-50">
                                {loading ? 'Saving...' : 'Confirm Setup'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BattlePlanSetup;
