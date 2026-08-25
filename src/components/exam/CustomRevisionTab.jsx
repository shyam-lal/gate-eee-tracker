import React, { useState } from 'react';
import { Check, Info, FlaskConical, BoxSelect, TrendingUp, Clock, BookOpen, Zap, RotateCcw, Play } from 'lucide-react';

const SUBJECTS = [
    'Power Systems', 'Electric Circuits', 'Signal & Systems', 
    'Digital Logic', 'Control Systems'
];

const DIFFICULTIES = [
    { id: 'easy', label: 'Easy', desc: 'Focus on fundamentals' },
    { id: 'medium', label: 'Medium', desc: 'Standard GATE level' },
    { id: 'hard', label: 'Hard', desc: 'Complex multi-concept' },
    { id: 'mixed', label: 'Mixed', desc: 'Exam-like variance' }
];

const CustomRevisionTab = () => {
    const [selectedSubjects, setSelectedSubjects] = useState(['Power Systems', 'Signal & Systems']);
    const [difficulty, setDifficulty] = useState('medium');
    const [questionCount, setQuestionCount] = useState(25);

    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubjectToggle = (sub) => {
        if (selectedSubjects.includes(sub)) {
            setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
        } else {
            setSelectedSubjects([...selectedSubjects, sub]);
        }
    };

    const handleGenerateTest = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/revision/generate-from-pyq', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    subjects: selectedSubjects,
                    difficulty,
                    numQuestions: questionCount
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate test');
            }

            const data = await res.json();
            alert(`Success! Generated a new Custom Test "${data.title}" with ${data.questions.length} questions. Redirect to Mock Test Player next!`);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-heading mb-2">Design Your Revision Path</h2>
                    <p className="text-surface-500">
                        Select specific parameters to generate a laser-focused revision session based on previous year questions.
                    </p>
                </div>

                {/* Subject Selection */}
                <div className="bg-surface-900 rounded-[2rem] p-8 border border-surface-800 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-black text-heading mb-1">Target Subjects</h3>
                            <p className="text-surface-500">Select the areas you want to test</p>
                        </div>
                        <span className="bg-surface-800 text-surface-400 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-widest">
                            {selectedSubjects.length} Selected
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {SUBJECTS.map(subject => {
                            const isSelected = selectedSubjects.includes(subject);
                            return (
                                <button
                                    key={subject}
                                    onClick={() => handleSubjectToggle(subject)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        isSelected 
                                            ? 'bg-primary-500/10 text-primary-400 border border-primary-500/30' 
                                            : 'bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600 hover:text-surface-300'
                                    }`}
                                >
                                    {subject}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Difficulty & Length */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-surface-900 rounded-[2rem] p-8 border border-surface-800 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-heading mb-1">Difficulty Level</h3>
                            <p className="text-surface-500">Match the real exam variance</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            {DIFFICULTIES.map(diff => (
                                <button
                                    key={diff.id}
                                    onClick={() => setDifficulty(diff.id)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                        difficulty === diff.id
                                            ? 'bg-primary-500/5 border-primary-500/50'
                                            : 'border-surface-700 bg-surface-800 hover:bg-surface-700/50'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        difficulty === diff.id ? 'border-primary-500' : 'border-surface-500'
                                    }`}>
                                        {difficulty === diff.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${difficulty === diff.id ? 'text-primary-400' : 'text-surface-400'}`}>{diff.label}</div>
                                        <div className="text-xs text-surface-500">{diff.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-surface-900 rounded-[2rem] p-8 border border-surface-800 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-heading mb-1">Test Length</h3>
                            <p className="text-surface-500">How many questions to generate</p>
                        </div>
                        
                        <div className="flex items-center justify-center py-8">
                            <div className="text-6xl font-black text-primary-500">{questionCount}</div>
                            <div className="text-surface-500 font-bold ml-2 mt-4 uppercase tracking-widest">Questions</div>
                        </div>

                        <input 
                            type="range" 
                            min="5" 
                            max="65" 
                            step="5"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                        <div className="flex justify-between text-xs font-bold text-surface-500 mt-2 uppercase tracking-widest">
                            <span>5 Qs</span>
                            <span>65 Qs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Summary Card */}
            <div className="lg:col-span-1">
                <div className="sticky top-8 bg-surface-900 rounded-[2rem] border border-surface-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
                    <div className="h-48 bg-surface-800 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" 
                            alt="Study desk" 
                            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
                        />
                        <div className="absolute bottom-4 left-6">
                            <div className="text-white font-black text-xl">Custom Test Ready</div>
                        </div>
                    </div>
                    
                    <div className="p-8 flex flex-col flex-1">
                        <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Test Parameters</h4>
                        
                        <div className="space-y-4 flex-1">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 mt-1 shrink-0">
                                    <BookOpen size={16} />
                                </div>
                                <div>
                                    <div className="font-bold text-heading text-sm">Subjects</div>
                                    <div className="text-xs text-surface-500 mt-1">
                                        {selectedSubjects.length > 0 ? selectedSubjects.join(', ') : 'None selected'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 mt-1 shrink-0">
                                    <TrendingUp size={16} />
                                </div>
                                <div>
                                    <div className="font-bold text-heading text-sm">Difficulty</div>
                                    <div className="text-xs text-surface-500 mt-1 capitalize">{difficulty}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 mt-1 shrink-0">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <div className="font-bold text-heading text-sm">Duration</div>
                                    <div className="text-xs text-surface-500 mt-1">~{questionCount * 2} Minutes</div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerateTest}
                            disabled={selectedSubjects.length === 0 || isGenerating}
                            className="w-full bg-primary-500 hover:bg-primary-400 text-surface-900 font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? 'Generating...' : 'Generate Test'} <Play size={16} className="fill-current" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomRevisionTab;
