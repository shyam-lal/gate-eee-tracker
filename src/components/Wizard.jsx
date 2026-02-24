import React, { useState } from 'react';
import { ChevronRight, Target, Clock, Boxes, GraduationCap, CheckCircle2 } from 'lucide-react';

const Wizard = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        exam: 'GATE',
        mode: 'time' // 'time' or 'module'
    });

    const nextStep = () => setStep(s => s + 1);

    const steps = [
        {
            id: 1,
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
            id: 2,
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
                            <h4 className="font-black uppercase tracking-tight text-xl mb-2">Time-Based</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Classic tracking. Set hour estimates for topics and log your study minutes. Best for strict schedules.</p>
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
                </div>
            )
        }
    ];

    const currentStep = steps.find(s => s.id === step);

    return (
        <div className="fixed inset-0 z-[200] bg-[#020617] flex items-center justify-center p-4">
            <div className="max-w-xl w-full">
                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-12">
                    {steps.map(s => (
                        <div key={s.id} className={`h-1.5 rounded-full transition-all duration-500 ${s.id === step ? 'w-12 bg-indigo-500' : 'w-4 bg-slate-800'}`} />
                    ))}
                </div>

                <div className="space-y-2 mb-8 text-center sm:text-left">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">{currentStep.label}</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">{currentStep.title}</h2>
                </div>

                <div className="mb-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    {currentStep.content}
                </div>

                <button
                    onClick={step === steps.length ? () => onComplete(data) : nextStep}
                    className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-2xl shadow-indigo-600/10 flex items-center justify-center gap-3"
                >
                    {step === steps.length ? "Initialize Vault" : "Next Phase"} <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default Wizard;
