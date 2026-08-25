import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Clock, Calculator, Flag, Trash2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useDiagnosticStore } from '../../store/useDiagnosticStore';

const DiagnosticQuiz = ({ setView }) => {
  const { 
    subjectName, 
    questions, 
    currentQuestionIndex, 
    answers, 
    setAnswer, 
    nextQuestion,
    prevQuestion,
    calculateResults 
  } = useDiagnosticStore();

  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes total placeholder or per question? Let's say 3 mins total.
  const [questionTime, setQuestionTime] = useState(0); // tracks time spent on CURRENT question instance
  const intervalRef = useRef(null);

  const currentQ = questions[currentQuestionIndex];
  const selectedOption = answers[currentQ?.id];

  useEffect(() => {
    // Overall timer
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleEndTest();
          return 0;
        }
        return prev - 1;
      });
      setQuestionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Reset question timer when question changes
  useEffect(() => {
    setQuestionTime(0);
  }, [currentQuestionIndex]);

  const handleOptionSelect = (optionId) => {
    // Record the time spent so far when they click an option
    setAnswer(currentQ.id, optionId, questionTime);
    setQuestionTime(0); // Reset for any subsequent time spent on this same question before moving on
  };

  const handleNext = () => {
    // Add any lingering time to the answer
    if (questionTime > 0 && selectedOption) {
      setAnswer(currentQ.id, selectedOption, questionTime);
    }
    
    if (currentQuestionIndex === questions.length - 1) {
      handleEndTest();
    } else {
      nextQuestion();
    }
  };

  const handleEndTest = () => {
    clearInterval(intervalRef.current);
    calculateResults();
    // Use setTimeout to ensure state is saved before redirecting
    setTimeout(() => {
      setView('dashboard_guest');
    }, 100);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentQ) return <div className="p-8 text-center">Loading diagnostic...</div>;

  const progressPercent = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0F172A] text-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="text-lg font-semibold tracking-wide flex items-center gap-2">
          GATE Diagnostic: {subjectName}
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progressPercent)}% Complete</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded text-sm text-slate-300">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
          <button className="flex items-center gap-2 text-slate-300 hover:text-white text-sm transition-colors">
            <Calculator className="w-4 h-4" />
            <span>Virtual Calculator</span>
          </button>
          <button 
            onClick={handleEndTest}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            End Test
          </button>
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-60px)]">
        {/* Left Sidebar - Question Palette */}
        <div className="w-64 bg-[#F8FAFC] border-r border-slate-200 p-6 overflow-y-auto">
          <h3 className="font-semibold text-slate-800 mb-1">Question Palette</h3>
          <p className="text-xs text-slate-500 mb-6">{questions.length - Object.keys(answers).length} Questions Remaining</p>

          <div className="grid grid-cols-4 gap-2 mb-8">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentQuestionIndex;
              
              let bgClass = "bg-slate-100 text-slate-600 border border-slate-200"; // not visited
              if (isAnswered) bgClass = "bg-[#0F766E] text-white border-transparent"; // answered
              if (isCurrent && !isAnswered) bgClass = "bg-emerald-100 text-emerald-700 border-emerald-300"; // current

              return (
                <button
                  key={q.id}
                  onClick={() => {
                     if (questionTime > 0) setAnswer(currentQ.id, selectedOption, questionTime);
                     useDiagnosticStore.setState({ currentQuestionIndex: idx });
                  }}
                  className={`h-10 w-10 rounded font-medium flex items-center justify-center text-sm transition-colors ${bgClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0F766E]"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-300 border border-emerald-400"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></div>
              <span>Not Visited</span>
            </div>
          </div>
        </div>

        {/* Main Quiz Area */}
        <div className="flex-1 bg-white flex flex-col">
          <div className="flex-1 p-8 overflow-y-auto">
            
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold tracking-wider uppercase mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
              <span>{currentQ.topic_name || currentQ.topic_slug?.replace(/-/g, ' ') || 'General Knowledge'}</span>
            </div>

            <h2 className="text-2xl text-slate-800 font-medium leading-relaxed mb-8">
              <span className="font-bold mr-2">Question {currentQuestionIndex + 1}:</span>
              {currentQ.question_text}
            </h2>

            <div className="space-y-4 max-w-3xl">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedOption === opt.id;
                const letter = String.fromCharCode(65 + i);

                return (
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-center transition-all duration-200 ${
                      isSelected 
                        ? 'border-emerald-400 bg-emerald-50/50' 
                        : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 text-sm font-medium transition-colors ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}>
                      {letter}
                    </div>
                    <span className={`flex-1 text-lg ${isSelected ? 'text-emerald-900 font-medium' : 'text-slate-700'}`}>
                      {opt.text}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-4" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium px-4 py-2 transition-colors">
                <Flag className="w-4 h-4" />
                Mark for Review
              </button>
              <button 
                onClick={() => setAnswer(currentQ.id, null, 0)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium px-4 py-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Response
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 mr-4">
                © 2026 VAULT Mastery. Focused Exam Environment.
              </span>
              
              <button 
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </div>
              </button>
              
              <button 
                onClick={handleNext}
                className="px-6 py-2.5 rounded-lg bg-[#2A6150] hover:bg-[#1E4B3E] text-white font-medium shadow-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  {currentQuestionIndex === questions.length - 1 ? 'Submit Test' : 'Confirm & Next Question'}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DiagnosticQuiz;
