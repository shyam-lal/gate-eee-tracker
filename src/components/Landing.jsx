import React from 'react';
import { Rocket, Shield, Target, Zap, ChevronRight, BarChart3, Clock, Map, Sparkles, Layers, Trophy } from 'lucide-react';

const Landing = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-transparent text-heading selection:bg-primary-500/30 overflow-x-hidden relative">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-[100] glass-card border-b border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center font-black italic text-white shadow-lg shadow-primary-600/30">V</div>
                        <span className="font-black tracking-tighter text-xl uppercase">Gate <span className="text-primary-400">Vault</span></span>
                    </div>
                    <button
                        onClick={onStart}
                        className="bg-white/90 backdrop-blur text-black px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest hover:bg-primary-400 hover:text-white transition-all shadow-xl shadow-white/5 hover:shadow-primary-500/20"
                    >
                        Open Vault
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-36 pb-24 px-6 overflow-hidden">
                {/* Animated gradient orbs */}
                <div className="absolute top-10 right-[-10%] w-[600px] h-[600px] bg-primary-500/[0.07] rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary-500/[0.06] rounded-full blur-[130px] animate-pulse" style={{animationDuration: '4s'}}></div>
                <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-primary-400/[0.04] rounded-full blur-[100px] animate-pulse" style={{animationDuration: '6s'}}></div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 glass-card px-5 py-2.5 rounded-full mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <Sparkles size={14} className="text-primary-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-300">New: Course progress tracking live</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Precision Engineering <br />
                        <span className="shimmer-text">For Your GATE Prep</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-surface-400 text-lg md:text-xl font-medium mb-14 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 leading-relaxed">
                        The ultimate toolset for GATE aspirants. Track your syllabus, monitor progress with dead-accurate time analytics, and conquer every module.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <button
                            onClick={onStart}
                            className="relative bg-gradient-to-r from-primary-600 to-primary-500 text-white px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:from-primary-500 hover:to-primary-400 transition-all shadow-2xl shadow-primary-600/30 group overflow-hidden"
                        >
                            <span className="relative z-10">Start Tracking <ChevronRight size={20} className="inline ml-2 group-hover:translate-x-1 transition-transform" /></span>
                        </button>
                        <button className="glass-card text-heading px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-white/[0.08] transition-all glow-border">
                            View Tools
                        </button>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-24 px-6 border-t border-white/[0.04]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 mb-3">Built for Engineers</p>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Every Tool You Need</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-8 rounded-[2rem] glow-border group transition-all hover:bg-white/[0.04]">
                            <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-400 mb-6 group-hover:scale-110 group-hover:bg-primary-500/20 transition-all">
                                <BarChart3 size={28} />
                            </div>
                            <h3 className="text-xl font-black uppercase mb-3 tracking-tighter">Deep Analytics</h3>
                            <p className="text-surface-500 font-medium leading-relaxed">Real-time completion gauges, weight distribution, and daily study targets based on your unique deadline.</p>
                        </div>

                        <div className="glass-card p-8 rounded-[2rem] glow-border group transition-all hover:bg-white/[0.04]">
                            <div className="w-14 h-14 bg-secondary-500/10 rounded-2xl flex items-center justify-center text-secondary-400 mb-6 group-hover:scale-110 group-hover:bg-secondary-500/20 transition-all">
                                <Clock size={28} />
                            </div>
                            <h3 className="text-xl font-black uppercase mb-3 tracking-tighter">Dual Modes</h3>
                            <p className="text-surface-500 font-medium leading-relaxed">Choose between course progress tracking or the module-based system for a more granular approach.</p>
                        </div>

                        <div className="glass-card p-8 rounded-[2rem] glow-border group transition-all hover:bg-white/[0.04]">
                            <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 group-hover:bg-emerald-600/20 transition-all">
                                <Map size={28} />
                            </div>
                            <h3 className="text-xl font-black uppercase mb-3 tracking-tighter">Syllabus Hub</h3>
                            <p className="text-surface-500 font-medium leading-relaxed">Centralized control for your entire curriculum. Organize subjects, subtasks, and logs in one premium interface.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Strip */}
            <section className="py-16 px-6 border-t border-white/[0.04]">
                <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
                    <div>
                        <p className="text-3xl md:text-4xl font-black text-heading tracking-tighter">6+</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 mt-1">Power Tools</p>
                    </div>
                    <div>
                        <p className="text-3xl md:text-4xl font-black text-primary-400 tracking-tighter">∞</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 mt-1">Subjects & Topics</p>
                    </div>
                    <div>
                        <p className="text-3xl md:text-4xl font-black text-heading tracking-tighter">24/7</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 mt-1">Cloud Synced</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 text-center border-t border-white/[0.04] glass-card">
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
