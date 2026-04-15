import { motion, useScroll, useSpring, useMotionValue, useTransform } from "motion/react";
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    LayoutDashboard,
    BookOpen,
    BrainCircuit,
    ClipboardCheck,
    GraduationCap,
    History,
    LineChart,
    Leaf,
    Trees,
    PawPrint,
    Menu,
    X
} from "lucide-react";
import React, { useState, useEffect } from "react";
import "./Landing_new.css";
import foxBackground from "../assets/fox-background.png";
import parallaxBg from "../assets/parallax-bg.png";
import parallaxFox from "../assets/parallax-fox.png";

const FadeInWhenVisible = ({ children, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98], delay }}
        >
            {children}
        </motion.div>
    );
};

const ToolCard = ({ tool, index }) => {
    return (
        <motion.div
            initial={{
                opacity: 0,
                scale: 0.8,
                x: index % 3 === 0 ? -150 : index % 3 === 2 ? 150 : 0,
                y: 200,
                rotate: index % 2 === 0 ? -15 : 15
            }}
            whileInView={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                rotate: 0
            }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.8,
                delay: index * 0.1,
                type: "spring",
                stiffness: 70,
                damping: 15
            }}
            className="glass-card p-8 rounded-[2.5rem] group hover:bg-white/60 transition-all duration-500 border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-2 h-full relative overflow-hidden"
        >
            <div className={`w-14 h-14 ${tool.color} ${tool.color === 'bg-primary-fixed' || tool.color === 'bg-secondary-container' ? 'text-primary' : 'text-white'} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                <tool.icon size={28} />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-3 group-hover:translate-x-1 transition-transform duration-300">{tool.title}</h3>
            <p className="text-primary/70 leading-relaxed group-hover:text-primary transition-colors duration-300">{tool.desc}</p>

            <motion.div
                className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </motion.div>
    );
};

export default function Landing_new({ onStart }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Parallax logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth movement for parallax
    const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    const foxX = useTransform(smoothX, [-500, 500], [-30, 30]);
    const foxY = useTransform(smoothY, [-500, 500], [-30, 30]);
    const bgX = useTransform(smoothX, [-500, 500], [-10, 10]);
    const bgY = useTransform(smoothY, [-500, 500], [-10, 10]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed bg-surface-bright text-primary font-sans antialiased">
            {/* Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
                style={{ scaleX }}
            />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex justify-between items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        className="text-2xl font-bold text-primary tracking-tighter flex items-center gap-2 cursor-pointer"
                    >
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <BrainCircuit className="text-white w-5 h-5" />
                        </div>
                        OwnPace
                    </motion.div>

                    <div className="hidden md:flex gap-10 items-center text-sm font-semibold">
                        {["Features", "Methodology", "Library", "Pricing"].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-primary/70 hover:text-primary transition-colors relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                            </a>
                        ))}
                        <motion.button
                            onClick={onStart}
                            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(23, 54, 39, 0.2)" }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all"
                        >
                            Open Vault
                        </motion.button>
                    </div>

                    <button className="md:hidden text-primary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-primary/10 px-6 py-8 flex flex-col gap-6 overflow-hidden"
                    >
                        {["Features", "Methodology", "Library", "Pricing"].map((item) => (
                            <a key={item} href="#" className="text-lg font-bold text-primary">{item}</a>
                        ))}
                        <button
                            onClick={onStart}
                            className="bg-primary text-white px-6 py-4 rounded-2xl font-bold text-lg"
                        >
                            Open Vault
                        </button>
                    </motion.div>
                )}
            </nav>

            {/* Background Motifs */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 2, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="fox-motif top-20 left-0"
            >
                <Trees size={600} className="text-primary" />
            </motion.div>
            <motion.div
                animate={{
                    y: [0, 30, 0],
                    rotate: [0, -3, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="fox-motif bottom-1/4 -right-20"
            >
                <Leaf size={800} className="text-primary" />
            </motion.div>
            <motion.div
                animate={{
                    x: [0, 15, 0],
                    y: [0, 15, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="fox-motif top-1/2 left-1/4"
            >
                <PawPrint size={300} className="text-primary" />
            </motion.div>

            <main className="relative z-10 pt-20 text-primary">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 md:px-8 pt-20 md:pt-32 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="space-y-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-wide uppercase"
                        >
                            <Leaf size={14} />
                            Embrace Calm Productivity
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-extrabold text-primary tracking-tighter leading-[1.05]">
                            Study at Your <br />Own Pace, <span className="text-secondary opacity-70 italic font-medium">Master Every Detail.</span>
                        </h1>
                        <p className="text-xl text-primary/70 leading-relaxed max-w-xl">
                            We believe learning shouldn't be a frantic race. Our 'Calm-Tech' approach helps you find focus and retain knowledge without the burnout of traditional study platforms.
                        </p>
                        <div className="flex flex-wrap items-center gap-6 pt-4">
                            <motion.button
                                onClick={onStart}
                                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(23, 54, 39, 0.15)" }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-primary text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300"
                            >
                                Enter the Sanctuary
                            </motion.button>
                            <button className="text-primary font-bold flex items-center gap-2 group text-lg">
                                See our philosophy
                                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="relative h-[700px] w-full flex items-center justify-center cursor-default scale-110"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Parallax Background */}
                        <motion.div 
                            style={{ x: bgX, y: bgY }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <img
                                className="w-full h-full object-contain pointer-events-none"
                                src={parallaxBg}
                                alt="Parallax Background"
                            />
                        </motion.div>

                        {/* Parallax Fox Layer */}
                        <motion.div 
                            style={{ x: foxX, y: foxY }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            <img
                                className="w-full h-full object-contain"
                                src={parallaxFox}
                                alt="Parallax Fox"
                            />
                        </motion.div>

                        {/* Ambient Glow */}
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.3, 0.4, 0.3]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -inset-10 bg-gradient-to-tr from-primary-fixed/20 to-secondary-container/20 blur-3xl rounded-full -z-10"
                        />
                    </motion.div>
                </section>

                <FadeInWhenVisible>
                    <section className="max-w-7xl mx-auto px-6 md:px-8 mb-24">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="glass-card rounded-[3rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border-primary/10 transition-all duration-500"
                        >
                            <div className="flex items-center gap-8">
                                <motion.div
                                    whileHover={{ rotate: 10, scale: 1.1 }}
                                    className="w-20 h-20 md:w-24 md:h-24 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20"
                                >
                                    <Calendar size={48} strokeWidth={1.5} />
                                </motion.div>
                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter flex items-center gap-2">
                                        <motion.span
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3, duration: 0.8 }}
                                        >14</motion.span>-Day Streak
                                    </h2>
                                    <p className="text-secondary font-semibold uppercase tracking-[0.2em] text-sm mt-1">Current Study Rhythm</p>
                                </div>
                            </div>
                            <div className="h-16 w-px bg-primary/10 hidden md:block" />
                            <div className="text-center md:text-left">
                                <p className="text-primary/70 max-w-xs text-lg font-medium">Consistency is the heartbeat of mastery. You're building a sustainable habit.</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-secondary/10 hover:shadow-secondary/20 transition-all"
                            >
                                View Progress Map
                            </motion.button>
                        </motion.div>
                    </section>
                </FadeInWhenVisible>

                {/* Fox Guide */}
                <section className="py-32 bg-white/50">
                    <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2 relative">
                            <FadeInWhenVisible>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="relative z-10 p-10 bg-primary-container text-white rounded-[3rem] rounded-bl-none shadow-2xl"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                        >
                                            <PawPrint className="text-primary-fixed w-8 h-8" />
                                        </motion.div>
                                        <span className="text-sm font-bold uppercase tracking-widest text-primary-fixed">The Fox Guide</span>
                                    </div>
                                    <blockquote className="text-3xl md:text-4xl font-bold leading-tight italic">
                                        "True mastery isn't a race. It's the quiet accumulation of moments spent in focus. Take a deep breath—you're doing great today."
                                    </blockquote>
                                    <div className="mt-8 flex gap-3">
                                        <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold backdrop-blur-sm">Stress Management</span>
                                        <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold backdrop-blur-sm">Encouragement</span>
                                    </div>
                                </motion.div>
                                <div className="absolute bottom-[-20px] left-0 w-10 h-10 bg-primary-container rotate-45 -z-10" />
                            </FadeInWhenVisible>
                        </div>
                        <div className="lg:w-1/2 space-y-6">
                            <FadeInWhenVisible delay={0.2}>
                                <h2 className="text-5xl font-extrabold text-primary tracking-tight">Your Gentle Companion</h2>
                                <p className="text-xl text-primary/70 leading-relaxed">
                                    Meet the Fox. Not a demanding coach, but a calm presence. Our AI-driven guide recognizes when you're pushing too hard and suggests mindful breaks, or celebrates your small wins with quiet joy.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                    <motion.div
                                        whileHover={{ y: -5, backgroundColor: "rgba(202, 230, 217, 0.4)" }}
                                        className="p-6 rounded-3xl bg-secondary-container/30 border border-secondary-container/50 transition-colors duration-300"
                                    >
                                        <h4 className="font-bold text-primary mb-2">Adaptive Tone</h4>
                                        <p className="text-sm opacity-80">Encouraging whispers that adjust to your current focus level.</p>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ y: -5, backgroundColor: "rgba(199, 235, 213, 0.4)" }}
                                        className="p-6 rounded-3xl bg-primary-fixed/30 border border-primary-fixed/50 transition-colors duration-300"
                                    >
                                        <h4 className="font-bold text-primary mb-2">Focus Guard</h4>
                                        <p className="text-sm opacity-80">A soft reminder to return to your path when the world gets noisy.</p>
                                    </motion.div>
                                </div>
                            </FadeInWhenVisible>
                        </div>
                    </div>
                </section>

                <section className="py-32 relative">
                    <div className="max-w-7xl mx-auto px-6 md:px-8">
                        <FadeInWhenVisible>
                            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                                <h2 className="text-5xl font-extrabold text-primary tracking-tighter">Everything You Need, Reimagined.</h2>
                                <p className="text-lg text-secondary font-medium">A suite of intelligent tools designed with editorial precision and high-fidelity calm.</p>
                            </div>
                        </FadeInWhenVisible>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { icon: LineChart, title: "AI Analysis", desc: "Cognitive mapping that visualizes your knowledge connections without complex spreadsheets.", color: "bg-primary" },
                                { icon: ClipboardCheck, title: "Mock Tests", desc: "Low-pressure simulations designed to build muscle memory and confidence before the real thing.", color: "bg-secondary" },
                                { icon: GraduationCap, title: "AI Test", desc: "Adaptive algorithms that gently probe your boundaries to find exactly where you need to focus next.", color: "bg-primary-fixed" },
                                { icon: BookOpen, title: "Flashcards AI", desc: "Automatically generated cards using spaced repetition to ensure long-term mastery.", color: "bg-secondary-container" },
                                { icon: History, title: "Syllabus Tracker", desc: "A beautiful hierarchical visualization of your journey, showing how far you've come.", color: "bg-primary-fixed" },
                                { icon: LayoutDashboard, title: "Estimates & Diary", desc: "Reflect on your growth and predict readiness with high-precision, AI-backed insights.", color: "bg-primary-container" },
                            ].map((tool, i) => (
                                <ToolCard key={i} tool={tool} index={i} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Dashboard Preview */}
                <section className="bg-primary/5 py-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <FadeInWhenVisible>
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.1, 0.2, 0.1]
                                    }}
                                    transition={{ duration: 10, repeat: Infinity }}
                                    className="absolute -top-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"
                                />
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="relative rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl"
                                >
                                    <img
                                        className="w-full object-cover"
                                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000"
                                        alt="OwnPace Dashboard"
                                        referrerPolicy="no-referrer"
                                    />
                                </motion.div>
                            </FadeInWhenVisible>
                        </div>
                        <div className="order-1 lg:order-2 space-y-8">
                            <FadeInWhenVisible delay={0.2}>
                                <div className="inline-block text-secondary font-black tracking-widest text-xs uppercase">The Sanctuary Interface</div>
                                <h2 className="text-5xl font-extrabold text-primary leading-tight">A Dashboard for Clarity, Not Clutter.</h2>
                                <p className="text-xl text-primary/70 leading-relaxed">
                                    We've eliminated the red dots, the frantic progress bars, and the urgent notifications. Instead, you'll find soft green tones, editorial layouts, and a Focus Mode that blocks out the world.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Distraction-Free Environment",
                                        "Soft Data Visualization",
                                        "Adaptive Dark/Light Modes"
                                    ].map((item, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + (i * 0.1) }}
                                            className="flex items-center gap-4 text-primary font-bold"
                                        >
                                            <CheckCircle2 className="text-secondary" />
                                            {item}
                                        </motion.li>
                                    ))}
                                </ul>
                            </FadeInWhenVisible>
                        </div>
                    </div>
                </section>

                <section className="py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
                        {[
                            { num: "01", title: "Reduce Stress", desc: "Intelligent scheduling that automatically prioritizes rest as a core part of the learning cycle." },
                            { num: "02", title: "Improve Focus", desc: "Editorial layouts designed to keep your eyes on the content, reducing cognitive load and eye strain." },
                            { num: "03", title: "Control Your Pace", desc: "Personalized pathways that adapt to your speed. We never push you faster than you can master." },
                        ].map((p, i) => (
                            <FadeInWhenVisible key={i} delay={i * 0.2}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="space-y-6 group cursor-default"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        whileInView={{ opacity: 0.2, scale: 1 }}
                                        className="text-primary-fixed text-8xl font-black mb-2 group-hover:opacity-40 transition-opacity"
                                    >{p.num}</motion.div>
                                    <h3 className="text-3xl font-bold text-primary group-hover:text-secondary transition-colors">{p.title}</h3>
                                    <p className="text-lg text-primary/70 leading-relaxed px-4">{p.desc}</p>
                                </motion.div>
                            </FadeInWhenVisible>
                        ))}
                    </div>
                </section>

                <FadeInWhenVisible>
                    <section className="max-w-7xl mx-auto px-6 md:px-8 mb-32">
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="bg-primary rounded-[4rem] p-12 md:p-32 text-center text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(23,54,39,0.3)]"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
                            >
                                <img
                                    className="w-full h-full object-cover"
                                    src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000"
                                    alt="Forest canopy"
                                    referrerPolicy="no-referrer"
                                />
                            </motion.div>
                            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight">Your Journey to <br />Mastery Starts in Quiet.</h2>
                                <p className="text-xl text-primary-fixed/80 max-w-2xl mx-auto leading-relaxed">
                                    Experience the difference of calm-tech education. No credit card required to begin your journey toward effortless mastery.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                    <motion.button
                                        onClick={onStart}
                                        whileHover={{ scale: 1.05, backgroundColor: "#d7f5e1" }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-primary-fixed text-on-primary-fixed px-12 py-6 rounded-[2rem] font-bold text-xl transition-all duration-300 shadow-xl"
                                    >
                                        Get Started Now
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-white/10 backdrop-blur-xl text-white px-12 py-6 rounded-[2rem] font-bold text-xl border border-white/20 transition-all"
                                    >
                                        Schedule a Demo
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </section>
                </FadeInWhenVisible>
            </main>

            {/* Footer */}
            <footer className="bg-primary/5 py-20 border-t border-primary/5">
                <div className="max-w-7xl mx-auto px-6 md:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                        <div className="space-y-4 text-center md:text-left">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-2xl font-bold text-primary tracking-tighter flex items-center gap-2 justify-center md:justify-start cursor-pointer"
                            >
                                <BrainCircuit className="text-primary w-6 h-6" />
                                OwnPace
                            </motion.div>
                            <p className="text-primary/60 max-w-xs text-sm">Empowering students through calm technology and mindful productivity.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-10 text-xs font-bold uppercase tracking-widest text-primary/70">
                            {["Support", "Archive", "Privacy", "Terms"].map((link) => (
                                <a key={link} href="#" className="hover:text-primary transition-colors relative group">
                                    {link}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                                </a>
                            ))}
                        </div>
                        <div className="text-primary/60 text-sm text-center md:text-right">
                            © 2024 OwnPace. <br />All moments reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
