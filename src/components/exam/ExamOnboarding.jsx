import { useState, useEffect } from 'react';
import { useExam } from '../../contexts/ExamContext';
import {
    ChevronRight, ChevronLeft, GraduationCap, Sparkles, Rocket,
    Check, Calendar, ArrowRight
} from 'lucide-react';

/**
 * ExamOnboarding — Multi-step wizard shown to new users.
 * 
 * Step 1: Select exam category
 * Step 2: Choose specific exam
 * Step 3: Set target date (optional) & confirm
 */
const ExamOnboarding = ({ onComplete, onBack }) => {
    const { categories, availableExams, enrollInExam, completeOnboarding } = useExam();
    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedExam, setSelectedExam] = useState(null);
    const [targetDate, setTargetDate] = useState('');
    const [loading, setLoading] = useState(false);

    const filteredExams = selectedCategory
        ? availableExams.filter(e => e.category_id === selectedCategory.id)
        : availableExams;

    const categoryIcons = {
        'engineering-entrance': '⚡',
        'civil-services': '🏛️',
        'banking-finance': '🏦',
        'medical-entrance': '🩺',
        'staff-selection': '📋',
    };

    const handleFinish = async () => {
        if (!selectedExam) return;
        setLoading(true);
        try {
            await enrollInExam(selectedExam.id, targetDate || null);
            await completeOnboarding();
            onComplete(selectedExam.id);
        } catch (err) {
            alert('Failed to complete setup: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-base text-surface-400 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-30%] left-[-20%] w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 text-primary-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                        <Sparkles size={12} /> Getting Started
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-heading uppercase tracking-tighter mb-2">
                        {step === 1 && 'Choose Your Path'}
                        {step === 2 && 'Select Your Exam'}
                        {step === 3 && 'Almost There!'}
                    </h1>
                    <p className="text-surface-500 text-sm font-medium">
                        {step === 1 && 'What kind of exam are you preparing for?'}
                        {step === 2 && `Pick the specific exam from ${selectedCategory?.name || 'available options'}`}
                        {step === 3 && 'Set your target date and start your journey'}
                    </p>
                </div>

                {/* Step indicators */}
                <div className="flex justify-center gap-2 mb-10">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${
                            s === step ? 'w-10 bg-primary-500' :
                            s < step ? 'w-6 bg-primary-500/50' : 'w-6 bg-surface-800'
                        }`} />
                    ))}
                </div>

                {/* Step 1: Category Selection */}
                {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setSelectedCategory(cat); setStep(2); }}
                                className="bg-surface-900/50 border border-surface-800 p-6 rounded-2xl text-left hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group"
                            >
                                <div className="text-3xl mb-3">{categoryIcons[cat.slug] || '📚'}</div>
                                <h3 className="text-heading font-black uppercase tracking-tighter text-lg group-hover:text-primary-400 transition-colors">
                                    {cat.name}
                                </h3>
                                {cat.description && (
                                    <p className="text-xs text-surface-500 mt-1 line-clamp-2">{cat.description}</p>
                                )}
                                <div className="flex items-center gap-1 text-[10px] text-surface-600 font-bold uppercase tracking-widest mt-3">
                                    <span>{availableExams.filter(e => e.category_id === cat.id).length} exams</span>
                                    <ChevronRight size={12} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 2: Exam Selection */}
                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredExams.map(exam => (
                                <button
                                    key={exam.id}
                                    onClick={() => { setSelectedExam(exam); setStep(3); }}
                                    className={`bg-surface-900/50 border p-6 rounded-2xl text-left transition-all group ${
                                        selectedExam?.id === exam.id
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-surface-800 hover:border-primary-500/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: exam.primary_color + '20' }}>
                                            <GraduationCap size={20} style={{ color: exam.primary_color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-heading font-black uppercase tracking-tighter group-hover:text-primary-400 transition-colors">
                                                {exam.name}
                                            </h3>
                                            <p className="text-[10px] text-surface-500 truncate">{exam.full_name}</p>
                                        </div>
                                    </div>
                                    {exam.description && (
                                        <p className="text-xs text-surface-500 line-clamp-2">{exam.description}</p>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <button
                                onClick={() => { setStep(1); setSelectedCategory(null); }}
                                className="flex items-center gap-2 text-surface-500 hover:text-heading text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                <ChevronLeft size={14} /> Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Target Date + Confirm */}
                {step === 3 && selectedExam && (
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Selected exam card */}
                        <div className="bg-surface-900/50 border border-primary-500/30 p-6 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: selectedExam.primary_color + '20' }}>
                                    <GraduationCap size={28} style={{ color: selectedExam.primary_color }} />
                                </div>
                                <div>
                                    <h3 className="text-heading font-black uppercase tracking-tighter text-xl">{selectedExam.name}</h3>
                                    <p className="text-xs text-surface-500">{selectedExam.full_name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Target date */}
                        <div className="bg-surface-900/50 border border-surface-800 p-6 rounded-2xl space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar size={18} className="text-primary-400" />
                                <label className="text-sm font-bold text-heading">Target Exam Date <span className="text-surface-600 font-normal">(optional)</span></label>
                            </div>
                            <input
                                type="date"
                                value={targetDate}
                                onChange={e => setTargetDate(e.target.value)}
                                className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3.5 text-sm text-heading focus:border-primary-500 outline-none [color-scheme:dark]"
                            />
                            <p className="text-[10px] text-surface-600 font-medium">This helps us calculate daily study goals. You can change this later.</p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={handleFinish}
                                disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50"
                            >
                                {loading ? 'Setting up...' : (
                                    <>
                                        <Rocket size={18} /> Start Your Journey
                                    </>
                                )}
                            </button>
                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 text-surface-500 hover:text-heading text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    <ChevronLeft size={14} /> Back
                                </button>
                                {onBack && (
                                    <button
                                        onClick={onBack}
                                        className="text-surface-600 hover:text-surface-400 text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Skip for now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamOnboarding;
