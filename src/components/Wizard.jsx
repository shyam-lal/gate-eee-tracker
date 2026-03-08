import React, { useState } from 'react';
import { ChevronRight, Target, Clock, Boxes, GraduationCap, CheckCircle2, PenTool, ArrowLeft, Brain } from 'lucide-react';

const Wizard = ({ onComplete, onBack }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        name: '',
        exam: 'GATE',
        mode: 'time' // 'time' or 'module'
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => {
        if (step > 1) setStep(s => s - 1);
        else if (onBack) onBack();
    };

    const steps = [
        {
            id: 1,
            title: "Name Your Tool",
            label: "TOOL IDENTITY",
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                            <PenTool size={28} />
                        </div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block">Tool Name</label>
                        <input
                            type="text"
                            autoFocus
                            placeholder="e.g. GATE EE Course Tracker"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xl font-bold text-white placeholder-slate-700 focus:border-indigo-500 outline-none transition-all shadow-inner"
                            value={data.name}
                            onChange={e => setData({ ...data, name: e.target.value })}
                        />
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            Give your tool a unique name so you can easily identify it later. You can create multiple tools with different names.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 2,
            title: "Choose Your Mission",
            label: "EXAM SELECT",
            content: (
                <div className="space-y-4">
                    <div
                        onClick={() => setData({ ...data, exam: 'GATE' })}
                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${data.exam === 'GATE' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${data.exam === 'GATE' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-tight text-lg">GATE 2027</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Graduate Aptitude Test in Engineering</p>
                            </div>
                        </div>
                        {data.exam === 'GATE' && <CheckCircle2 className="text-indigo-400" />}
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-800/50 bg-slate-900/20 opacity-40 cursor-not-allowed flex items-center gap-4">
                        <div className="p-3 bg-slate-800 rounded-2xl text-slate-600"><Target size={24} /></div>
                        <div>
                            <h4 className="font-black uppercase tracking-tight text-lg">ESE / IES</h4>
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Coming Soon</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: "Tracking Protocol",
            label: "LOGGING MODE",
            content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                        onClick={() => setData({ ...data, mode: 'time' })}
                        className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col gap-6 relative group ${data.mode === 'time' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.mode === 'time' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-white'}`}>
                            <Clock size={32} />
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-tight text-xl mb-2">Course Progress</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Track your course completion. Set hour estimates for topics and log study time to see when you'll finish. Best for course-based prep.</p>
                        </div>
                        {data.mode === 'time' && <div className="absolute top-6 right-6"><CheckCircle2 className="text-indigo-400" /></div>}
                    </div>

                    <div
                        onClick={() => setData({ ...data, mode: 'module' })}
                        className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col gap-6 relative group ${data.mode === 'module' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.mode === 'module' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-white'}`}>
                            <Boxes size={32} />
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-tight text-xl mb-2">Module-Based</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Progress by blocks. Count finished modules instead of watching the clock. Best for topic mastery.</p>
                        </div>
                        {data.mode === 'module' && <div className="absolute top-6 right-6"><CheckCircle2 className="text-indigo-400" /></div>}
                    </div>

                    <div
                        onClick={() => setData({ ...data, mode: 'flashcard' })}
                        className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col gap-6 relative group sm:col-span-2 ${data.mode === 'flashcard' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                    >
                        <div className="flex items-start gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${data.mode === 'flashcard' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-white'}`}>
                                <Brain size={32} />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-tight text-xl mb-2">Flashcards (SRS)</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">
                                    Spaced Repetition System. Create decks, add flashcards, and use the Anki SM-2 algorithm to permanently memorize formulas and concepts.
                                </p>
                            </div>
                        </div>
                        {data.mode === 'flashcard' && <div className="absolute top-6 right-6"><CheckCircle2 className="text-indigo-400" /></div>}
                    </div>
                </div>
            )
        }
    ];

    const currentStep = steps.find(s => s.id === step);
    const canProceed = step === 1 ? data.name.trim().length > 0 : true;

    return (
        <div className="fixed inset-0 z-[200] bg-[#020617] flex items-center justify-center p-4">
            <div className="max-w-xl w-full">
                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-12">
                    {steps.map(s => (
                        <div key={s.id} className={`h-1.5 rounded-full transition-all duration-500 ${s.id === step ? 'w-12 bg-indigo-500' : s.id < step ? 'w-6 bg-indigo-500/40' : 'w-4 bg-slate-800'}`} />
                    ))}
                </div>

                <div className="space-y-2 mb-8 text-center sm:text-left">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">{currentStep.label}</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">{currentStep.title}</h2>
                </div>

                <div className="mb-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    {currentStep.content}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={prevStep}
                        className="flex items-center justify-center gap-2 px-6 py-5 border border-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-slate-600 hover:text-white transition-all"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button
                        onClick={step === steps.length ? () => onComplete(data) : nextStep}
                        disabled={!canProceed}
                        className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-2xl shadow-indigo-600/10 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {step === steps.length ? "Create Tool" : "Next Phase"} <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Wizard;
