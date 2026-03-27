import React from 'react';
import { Rocket, Shield, Target, Zap, ChevronRight, BarChart3, Clock, Map } from 'lucide-react';

const Landing = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-base text-white selection:bg-primary-500/30 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-[100] bg-base/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-black italic text-white shadow-lg shadow-primary-600/20">V</div>
                        <span className="font-black tracking-tighter text-xl uppercase">Gate <span className="text-primary-500">Vault</span></span>
                    </div>
                    <button
                        onClick={onStart}
                        className="bg-white text-black px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-xl shadow-white/5"
                    >
                        Open Vault
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -ml-64 -mb-64 animate-pulse duration-700"></div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <Zap size={14} className="text-primary-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-300">New: Course progress tracking live</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Precision Engineering <br />
                        <span className="bg-gradient-to-r from-primary-400 via-white to-secondary-400 bg-clip-text text-transparent">For Your GATE Prep</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-surface-400 text-lg md:text-xl font-medium mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        The ultimate toolset for GATE aspirants. Track your syllabus, monitor progress with dead-accurate time analytics, and conquer every module.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <button
                            onClick={onStart}
                            className="bg-primary-600 text-white px-10 py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-primary-500 transition-all shadow-2xl shadow-primary-600/30 group"
                        >
                            Start Tracking <ChevronRight size={20} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="bg-surface-900 border border-surface-800 text-white px-10 py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-surface-800 transition-all">
                            View Tools
                        </button>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-20 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-surface-900/40 border border-surface-800 p-8 rounded-[2.5rem] hover:border-primary-500/30 transition-all group">
                        <div className="w-14 h-14 bg-primary-600/10 rounded-2xl flex items-center justify-center text-primary-400 mb-6 group-hover:scale-110 transition-transform">
                            <BarChart3 size={28} />
                        </div>
                        <h3 className="text-xl font-black uppercase mb-4 tracking-tighter">Deep Analytics</h3>
                        <p className="text-surface-500 font-medium">Real-time completion gauges, weight distribution, and daily study targets based on your unique deadline.</p>
                    </div>

                    <div className="bg-surface-900/40 border border-surface-800 p-8 rounded-[2.5rem] hover:border-primary-500/30 transition-all group">
                        <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                            <Clock size={28} />
                        </div>
                        <h3 className="text-xl font-black uppercase mb-4 tracking-tighter">Dual Modes</h3>
                        <p className="text-surface-500 font-medium">Choose between course progress tracking or the module-based system for a more granular approach.</p>
                    </div>

                    <div className="bg-surface-900/40 border border-surface-800 p-8 rounded-[2.5rem] hover:border-primary-500/30 transition-all group">
                        <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                            <Map size={28} />
                        </div>
                        <h3 className="text-xl font-black uppercase mb-4 tracking-tighter">Syllabus Hub</h3>
                        <p className="text-surface-500 font-medium">Centralized control for your entire curriculum. Organize subjects, subtasks, and logs in one premium interface.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 text-center border-t border-white/5 bg-surface-950/50">
                <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                    <Shield size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">SECURE ACCESS • CLOUD SYNC</span>
                </div>
                <p className="text-surface-600 text-xs font-bold uppercase tracking-widest">© 2026 GATE VAULT ENGINEERING SYSTEMS</p>
                <p className="text-surface-600 text-xs font-bold uppercase tracking-widest">- Arunima & Shyam</p>
            </footer>
        </div>
    );
};

export default Landing;
