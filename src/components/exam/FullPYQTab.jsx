import React, { useState } from 'react';
import { BookOpen, ListTodo, Clock, Play, Sparkles, Loader2 } from 'lucide-react';
import { pyq as pyqApi } from '../../services/api';

const FullPYQTab = ({ papers, loading, onStartTest }) => {
    const [startingPaper, setStartingPaper] = useState(null);

    const handleStart = async (paper) => {
        if (paper.status === 'COMPLETED') {
            alert('Review feature coming soon!');
            return;
        }

        setStartingPaper(paper.id);
        try {
            // 1. Check for in-progress attempt
            let attempt = await pyqApi.getInProgressAttempt(paper.id);
            
            // 2. If none, create new attempt
            if (!attempt) {
                const fullPaper = await pyqApi.getPaper(paper.id);
                const order = fullPaper.questions.map(q => q.id);
                attempt = await pyqApi.createAttempt(paper.id, order, 'exam');
            }
            
            onStartTest(paper, attempt);
        } catch (err) {
            console.error('Failed to start test:', err);
            alert('Failed to start the simulation. Please try again.');
        } finally {
            setStartingPaper(null);
        }
    };
    if (loading) {
        return <div className="text-center py-20 text-surface-500">Loading papers...</div>;
    }

    if (!papers || papers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center text-surface-400 mb-4">
                    <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold text-heading mb-2">No past papers available yet</h3>
                <p className="text-surface-500 max-w-md">Check back later or run the database seeder to populate the PYQ mock test data.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {papers.map((paper) => (
                    <div key={paper.id} className="bg-surface-900 rounded-[2rem] p-8 border border-surface-800 shadow-sm hover:border-primary-500/50 hover:bg-surface-800/50 transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-heading mb-1">{paper.title}</h3>
                                <p className="text-surface-500 font-medium">Official GATE Examination</p>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                                paper.status === 'COMPLETED' ? 'bg-primary-500/10 text-primary-400' :
                                paper.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-surface-800 text-surface-400'
                            }`}>
                                {paper.status ? paper.status.replace('_', ' ') : 'NOT ATTEMPTED'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-surface-800 rounded-2xl p-4 flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ListTodo size={12}/> Questions</span>
                                <span className="text-xl font-black text-heading">{paper.total_questions || paper.actual_question_count || 65}</span>
                            </div>
                            <div className="bg-surface-800 rounded-2xl p-4 flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={12}/> Duration</span>
                                <span className="text-xl font-black text-heading">{paper.duration_minutes || 180}m</span>
                            </div>
                        </div>

                        {paper.status && paper.status !== 'NOT_ATTEMPTED' && (
                            <div className="mb-8 flex-1">
                                <div className="flex justify-between text-xs font-bold text-surface-500 uppercase tracking-widest mb-2">
                                    <span>Progress</span>
                                    <span className="text-heading">{(paper.best_score || 0)} / {paper.total_marks || 100} Marks</span>
                                </div>
                                <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary-500 transition-all duration-1000" 
                                        style={{ width: `${((paper.best_score || 0) / (paper.total_marks || 100)) * 100}%` }} 
                                    />
                                </div>
                            </div>
                        )}
                        {!paper.status || paper.status === 'NOT_ATTEMPTED' ? <div className="flex-1 mb-8"></div> : null}

                        <button 
                            onClick={() => handleStart(paper)}
                            disabled={startingPaper === paper.id}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-auto ${
                            paper.status === 'COMPLETED' ? 'border border-surface-700 text-surface-300 hover:bg-surface-800' :
                            'bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50'
                        }`}>
                            {startingPaper === paper.id ? (
                                <><Loader2 size={16} className="animate-spin" /> Starting...</>
                            ) : paper.status === 'COMPLETED' ? (
                                'Review Attempt'
                            ) : (
                                <>Start Simulation <Play size={16} className="fill-current" /></>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Adaptive Revision Banner */}
            <div className="bg-surface-900 rounded-3xl p-6 md:p-8 border border-surface-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center shrink-0">
                    <Sparkles size={28} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-bold text-heading mb-1">Adaptive Revision</h4>
                    <p className="text-sm text-surface-500 max-w-xl">
                        Our AI analyzes your simulation errors to build custom revision sets for weak topics.
                    </p>
                </div>
                <div className="flex items-center gap-8 md:border-l border-surface-800 md:pl-8">
                    <div className="text-center">
                        <div className="text-2xl font-black text-heading">12</div>
                        <div className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">Weak Areas<br/>Identified</div>
                    </div>
                    <div className="w-px h-12 bg-surface-200 hidden md:block"></div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-primary-700">08</div>
                        <div className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">Sets<br/>Prepared</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullPYQTab;
