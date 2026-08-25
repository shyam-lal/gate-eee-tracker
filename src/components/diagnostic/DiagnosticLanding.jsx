import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDiagnosticStore } from '../../store/useDiagnosticStore';

const SUBJECTS = [
  { id: 'computer-science', name: 'CS & IT', icon: '💻', desc: 'Algorithms, OS, Databases, and Discrete Math.' },
  { id: 'mechanical-engineering', name: 'Mechanical', icon: '⚙️', desc: 'Thermodynamics, Mechanics, and Fluid Dynamics.' },
  { id: 'electrical-engineering', name: 'Electrical', icon: '⚡', desc: 'Circuit Theory, Control Systems, and Machines.' },
  { id: 'civil-engineering', name: 'Civil', icon: '📐', desc: 'Structural Engineering, Geotech, and Surveying.' },
  { id: 'electronics-communication', name: 'Electronics', icon: '📡', desc: 'Analog Circuits, Digital Circuits, and Signals.' },
  { id: 'instrumentation', name: 'Instrumentation', icon: '🎛️', desc: 'Measurements, Sensors, and Optical.' },
  { id: 'aerospace-engineering', name: 'Aerospace', icon: '🚀', desc: 'Aerodynamics, Flight Mechanics, and Propulsion.' },
  { id: 'biotechnology', name: 'Biotech', icon: '🧬', desc: 'Genetics, Cellular Biology, and Bioprocess.' },
  { id: 'chemical-engineering', name: 'Chemical', icon: '🧪', desc: 'Process Calculations, Fluid Mechanics, and Heat Transfer.' },
  { id: 'architecture-and-planning', name: 'Architecture', icon: '🏛️', desc: 'City Planning, Building Materials, and Design.' }
];

const DiagnosticLanding = ({ setView }) => {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  
  const initDiagnostic = useDiagnosticStore(state => state.initDiagnostic);

  const handleStartTest = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch randomized questions from our backend
      const response = await fetch(`/api/diagnostics/questions/${selectedSubject}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch diagnostic questions for this branch.');
      }
      
      const questions = await response.json();
      
      if (questions.length === 0) {
        throw new Error('No questions found for this branch in the database.');
      }

      const subjectName = SUBJECTS.find(s => s.id === selectedSubject)?.name;
      initDiagnostic(selectedSubject, subjectName, questions);
      
      // Navigate to the quiz view
      setView('diagnostic_quiz');
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 font-sans flex flex-col items-center">
      
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <ShieldCheck className="w-6 h-6" />
          <span>VAULT Academic Command</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="text-slate-900 border-b-2 border-slate-900 pb-1">Diagnostic</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Curriculum</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Resources</a>
        </nav>
        <button 
          onClick={() => setView('auth')}
          className="bg-emerald-200/50 hover:bg-emerald-200 text-emerald-900 px-5 py-2 rounded-md font-medium text-sm transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 flex flex-col items-center justify-center pt-16 pb-24 text-center">
        
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
          Phase 01: Baseline Assessment
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-slate-800 tracking-tight leading-tight mb-4 max-w-3xl">
          Evaluate Your GATE Readiness in 3 Minutes
        </h1>
        
        <p className="text-lg text-slate-500 mb-12 max-w-2xl">
          Take a 5-question quick-fire test across core subjects to map your baseline accuracy and weak spots instantly.
        </p>

        {/* Branch Selector */}
        <div className="relative w-full max-w-[1000px] mb-12 flex items-center group">
          <button 
            onClick={() => scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
            className="absolute left-0 z-10 -ml-5 w-12 h-12 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6 -ml-0.5" />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-4 w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 px-2"
          >
            {SUBJECTS.map((subject) => (
              <motion.button
                key={subject.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSubject(subject.id)}
                className={`flex-none w-[280px] md:w-[232px] snap-center text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                  selectedSubject === subject.id 
                    ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10' 
                    : 'border-transparent bg-white shadow-sm hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl ${
                  selectedSubject === subject.id ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  {subject.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">{subject.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{subject.desc}</p>
                
                {selectedSubject === subject.id && (
                  <div className="mt-4 flex justify-end">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <button 
            onClick={() => scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
            className="absolute right-0 z-10 -mr-5 w-12 h-12 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hidden md:flex"
          >
            <ChevronRight className="w-6 h-6 ml-0.5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg max-w-md w-full">
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartTest}
          disabled={loading || !selectedSubject}
          className="bg-[#A7F3D0] hover:bg-[#6EE7B7] text-emerald-950 text-lg font-semibold px-8 py-4 rounded-xl flex items-center gap-3 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {loading ? 'Preparing Test...' : 'Start Diagnostic Test'}
          {!loading && <ArrowRight className="w-5 h-5" />}
        </motion.button>

        <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          <span>No credit card required. Personal analysis report included.</span>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full border-t border-slate-200 py-8 px-6 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <span className="font-bold text-slate-700">VAULT</span> Academic Command<br />
          © 2026 Academia Diagnostic. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Contact Support</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Department Overview</a>
        </div>
      </footer>
    </div>
  );
};

export default DiagnosticLanding;
