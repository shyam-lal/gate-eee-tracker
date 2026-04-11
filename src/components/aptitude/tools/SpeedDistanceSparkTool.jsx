import { useState, useRef, useEffect } from 'react';
import DynamicSlider from './DynamicSlider';
import { Route, Play, RotateCcw, Lightbulb, CheckCircle, AlertCircle, Eye } from 'lucide-react';

const TRACK_LENGTH = 1000;
const STEPS = [
    {
        id: 0,
        title: 'Phase 1: Match the Speed',
        instruction: 'Set Direction to "Same Direction", and Speed B to 50 m/s. Now, set Speed A to 50 m/s and toggle "Relative Mode". Click Start. Notice how Car B appears perfectly stationary!',
        check: (s) => s.direction === 'same' && s.speedA === 50 && s.speedB === 50 && s.isRelativeMode === true && s.status === 'running',
        error: 'Ensure Direction is "Same", both speeds are 50, Relative Mode is ON, and hit Start.',
        allowedStart: () => true
    },
    {
        id: 1,
        title: 'Phase 2: The Head-on Collision',
        instruction: 'Switch out of Relative Mode. Set Direction to "Towards", Speed A to 40, Speed B to 20. Look at the equation: 40 - (-20) = 60. Click Start to collide!',
        check: (s) => s.direction === 'towards' && s.speedA === 40 && s.speedB === 20 && s.status === 'finished',
        error: 'Set Towards, Speed A = 40, Speed B = 20, hit Start and wait for them to meet.',
        allowedStart: (a, b, dir) => a === 40 && b === 20 && dir === 'towards'
    }
];

export default function SpeedDistanceSparkTool({ node, unitMeta, onConceptMastered }) {
    const [speedA, setSpeedA] = useState(50);
    const [speedB, setSpeedB] = useState(50);
    const [direction, setDirection] = useState('same'); // 'towards' or 'same'
    const [isRelativeMode, setIsRelativeMode] = useState(false);
    
    const [status, setStatus] = useState('idle'); // idle, running, finished
    
    // Positions in meters
    const [posA, setPosA] = useState(100); 
    const [posB, setPosB] = useState(400); 
    const [time, setTime] = useState(0);

    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    
    const [feedback, setFeedback] = useState(null);
    const feedbackTimeout = useRef(null);
    const requestRef = useRef();
    const lastTimeRef = useRef();
    const stateRef = useRef({ posA: 100, posB: 400, time: 0 });

    const showFeedbackMessage = (type, message) => {
        clearTimeout(feedbackTimeout.current);
        setFeedback({ type, message });
        feedbackTimeout.current = setTimeout(() => setFeedback(null), 4000);
    };

    useEffect(() => {
        if (status === 'idle') {
            stateRef.current.posA = 100;
            stateRef.current.posB = direction === 'towards' ? 900 : 400;
            stateRef.current.time = 0;
            setPosA(stateRef.current.posA);
            setPosB(stateRef.current.posB);
            setTime(0);
        }
    }, [direction, status, isRelativeMode]); // added isRelativeMode to reset if someone toggles it while idle

    const handleStart = () => {
        if (status !== 'idle') return;
        
        const currentStepData = STEPS[currentStep];
        if (currentStepData && !currentStepData.allowedStart(speedA, speedB, direction)) {
            showFeedbackMessage('error', currentStepData.error || 'Incorrect settings for this step.');
            return;
        }

        setStatus('running');
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(animateRef);
    };

    const handleReset = () => {
        cancelAnimationFrame(requestRef.current);
        setStatus('idle');
    };

    const evaluateStepCheck = (state) => {
        const step = STEPS[currentStep];
        if (step.check(state)) {
            if (currentStep < STEPS.length - 1) {
                showFeedbackMessage('success', "Perfect! You nailed the visualization.");
                setCurrentStep(prev => prev + 1);
                handleReset();
            } else {
                showFeedbackMessage('success', "Mastered the concept!");
                setCompleted(true);
                setShowOverlay(true);
                onConceptMastered?.(true);
                handleReset();
            }
        }
    };

    const animateRef = (timestamp) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        
        const SIM_SPEED = 5; 
        const dt = ((timestamp - lastTimeRef.current) / 1000) * SIM_SPEED; 
        lastTimeRef.current = timestamp;

        let { posA: cA, posB: cB, time: cT } = stateRef.current;
        
        cA += speedA * dt;
        let vB = direction === 'towards' ? -speedB : speedB;
        cB += vB * dt;
        cT += dt;

        let met = false;
        if (direction === 'towards' && cA >= cB) met = true;
        
        // In same direction, if A is faster and catches B
        if (direction === 'same' && speedA > speedB && cA >= cB) met = true;

        if (met || cA > 1100 || cB > 1100 || cB < -100) {
            cancelAnimationFrame(requestRef.current);
            setStatus('finished');
            
            if (met) {
                cA = cB; // snap to exact meet point graphically
            }

            stateRef.current = { posA: cA, posB: cB, time: cT };
            setPosA(cA);
            setPosB(cB);
            setTime(cT);
            
            evaluateStepCheck({ direction, speedA, speedB, isRelativeMode, status: 'finished', met });
            return;
        }

        stateRef.current = { posA: cA, posB: cB, time: cT };
        setPosA(cA);
        setPosB(cB);
        setTime(cT);

        // Continuous evaluation for conditions that don't need finishing (like Step 1)
        evaluateStepCheck({ direction, speedA, speedB, isRelativeMode, status: 'running', met: false });

        requestRef.current = requestAnimationFrame(animateRef);
    };

    // Math Equation Label Logic
    const vA = speedA;
    const vB_actual = direction === 'towards' ? -speedB : speedB;
    const relSpeedMag = Math.abs(vA - vB_actual);

    // Layout Logic
    const bgPosPx = isRelativeMode ? -posA * 2 : 0;
    const screenA = isRelativeMode ? 100 : posA;
    const screenB = isRelativeMode ? (posB - posA + 100) : posB;

    return (
        <div className="speed-dist-spark-tool relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Route size={16} style={{ color: unitMeta.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: unitMeta.color }}>
                        Relativity Engine — Perspective
                    </span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-surface-500">
                    Phase {Math.min(currentStep + 1, STEPS.length)} / {STEPS.length}
                </div>
            </div>

            {/* Guided Instructions */}
            <div className="mb-6 rounded-xl border border-surface-800 bg-surface-900/50 shadow-inner flex flex-col overflow-hidden">
                {STEPS.map((step, idx) => {
                    const isActive = idx === currentStep;
                    const isPast = idx < currentStep;
                    return (
                        <div key={step.id} className={`p-4 border-b border-surface-800/50 last:border-b-0 transition-opacity ${isActive ? 'bg-surface-800/20' : isPast ? 'opacity-50' : 'opacity-30 grayscale'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {isPast ? <CheckCircle size={14} style={{ color: unitMeta.color }} /> : <span className="w-2 h-2 rounded-full" style={{ background: isActive ? unitMeta.color : 'transparent', border: isActive ? 'none' : '1px solid #475569' }} />}
                                <h3 className={`text-sm font-black ${isActive ? 'text-heading' : 'text-surface-300'}`} style={isActive ? { color: unitMeta.color } : {}}>
                                    {step.title}
                                </h3>
                            </div>
                            <p className="text-xs text-surface-400 leading-relaxed font-medium pl-6">
                                {step.instruction}
                            </p>
                        </div>
                    );
                })}
            </div>

            {feedback && (
                <div className={`sl-feedback ${feedback.type === 'error' ? 'sl-feedback--error' : 'sl-feedback--success'} mb-4`}
                    style={feedback.type === 'success' ? { borderColor: `${unitMeta.color}50`, background: `${unitMeta.color}10` } : {}}>
                    {feedback.type === 'success' ? <CheckCircle size={14} style={{ color: unitMeta.color }} /> : <AlertCircle size={14} className="text-rose-400" />}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Equation / State Readout */}
            <div className="mb-6 bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col items-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${unitMeta.color}, transparent)` }} />
                
                <div className="text-[10px] font-black tracking-widest text-surface-500 uppercase mb-2">Real-time Relative Speed Equation</div>
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-base sm:text-lg font-black text-heading font-mono flex-wrap">
                    <span className="text-surface-400 hidden sm:inline">Relative Speed =</span>
                    <span className="text-emerald-400 flex flex-col items-center">
                        <span className="text-[8px] uppercase tracking-widest opacity-70">Speed A</span>
                        {vA}
                    </span>
                    <span className="text-surface-600">-</span>
                    <span className="text-amber-400 flex flex-col items-center">
                        <span className="text-[8px] uppercase tracking-widest opacity-70">Speed B</span>
                        ({vB_actual})
                    </span>
                    <span className="text-surface-500">=</span>
                    <span className="text-xl sm:text-2xl text-white drop-shadow-md relative py-1 px-4 rounded-xl flex items-center gap-1" style={{ background: `${unitMeta.color}30`, border: `1px solid ${unitMeta.color}50` }}>
                        {vA - vB_actual} <span className="text-[10px] text-surface-300">m/s</span>
                    </span>
                </div>
            </div>

            {/* Track Visualization */}
            <div className="relative w-full h-32 bg-surface-950 border border-surface-800 rounded-xl mb-6 overflow-hidden flex items-center shadow-inner">
                {/* Looping Striped Road Background */}
                <div className="absolute top-0 left-0 w-[200%] h-full opacity-10"
                    style={{
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, #ffffff 50px, #ffffff 100px)`,
                        transform: `translateX(${bgPosPx % 100}px)`,
                        transition: status === 'running' ? 'none' : 'transform 0.2s linear'
                    }}
                />

                {/* Perspective Badge */}
                <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-surface-900 border border-surface-800 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md transition-colors"
                     style={isRelativeMode ? { borderColor: `${unitMeta.color}50`, color: unitMeta.color } : { color: '#94a3b8' }}>
                    <Eye size={10} style={{ color: isRelativeMode ? unitMeta.color : '#94a3b8' }} /> 
                    {isRelativeMode ? 'Camera Fixed to Car A' : 'Global Static Camera'}
                </div>

                {/* Cars */}
                <div className="absolute w-8 h-8 rounded-lg bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center top-[30%] -translate-y-1/2 -mt-[1px] transition-transform z-20"
                     style={{ 
                         left: `${(screenA / TRACK_LENGTH) * 100}%`,
                         transition: status === 'running' ? 'none' : 'left 0.3s ease-out'
                     }}>
                    <span className="text-[10px] font-black text-white">A</span>
                    {/* Velocity Arrow */}
                    {status === 'running' && isRelativeMode === false && speedA > 0 && (
                        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-emerald-400 opacity-70">
                             <div className="absolute -right-1 -top-[3px] border-l-4 border-l-emerald-400 border-y-4 border-y-transparent"></div>
                        </div>
                    )}
                </div>

                <div className="absolute w-8 h-8 rounded-lg bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center top-[70%] -translate-y-1/2 mt-[1px] transition-transform z-20"
                     style={{ 
                         left: `${(screenB / TRACK_LENGTH) * 100}%`,
                         transition: status === 'running' ? 'none' : 'left 0.3s ease-out'
                     }}>
                    <span className="text-[10px] font-black text-white">B</span>
                    {/* Relative Velocity Arrow (when in relative mode) */}
                    {status === 'running' && isRelativeMode === true && (vB_actual - vA !== 0) && (
                        <div className={`absolute top-1/2 -translate-y-1/2 h-[2px] bg-white opacity-70 ${vB_actual - vA < 0 ? '-left-6' : '-right-6'}`} style={{ width: '16px' }}>
                             <div className={`absolute -top-[3px] ${vB_actual - vA < 0 ? '-left-1 border-r-4 border-r-white border-y-4 border-y-transparent' : '-right-1 border-l-4 border-l-white border-y-4 border-y-transparent'}`}></div>
                        </div>
                    )}
                    {status === 'running' && isRelativeMode === false && Math.abs(vB_actual) > 0 && (
                        <div className={`absolute top-1/2 -translate-y-1/2 h-[2px] bg-amber-400 opacity-70 ${vB_actual < 0 ? '-left-6' : '-right-6'}`} style={{ width: '16px' }}>
                             <div className={`absolute -top-[3px] ${vB_actual < 0 ? '-left-1 border-r-4 border-r-amber-400 border-y-4 border-y-transparent' : '-right-1 border-l-4 border-l-amber-400 border-y-4 border-y-transparent'}`}></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-900/50 p-5 rounded-2xl border border-surface-800">
                {/* Sliders */}
                <div className="space-y-4 flex flex-col w-full items-center md:items-start">
                    <DynamicSlider min={0} max={100} step={10} value={speedA} onChange={setSpeedA} label="Speed A" unit="m/s" color="#10b981" width={280} disabled={status !== 'idle'} />
                    <DynamicSlider min={0} max={100} step={10} value={speedB} onChange={setSpeedB} label="Speed B" unit="m/s" color="#f59e0b" width={280} disabled={status !== 'idle'} />
                </div>

                {/* Toggles & Start */}
                <div className="flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex bg-surface-800 p-1 rounded-lg">
                            <button className={`flex-1 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-md transition-all ${direction === 'towards' ? 'bg-surface-700 text-heading shadow-sm' : 'text-surface-500 hover:text-surface-300'}`} onClick={() => status === 'idle' && setDirection('towards')} disabled={status !== 'idle'}>
                                Towards
                            </button>
                            <button className={`flex-1 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-md transition-all ${direction === 'same' ? 'bg-surface-700 text-heading shadow-sm' : 'text-surface-500 hover:text-surface-300'}`} onClick={() => status === 'idle' && setDirection('same')} disabled={status !== 'idle'}>
                                Same Direction
                            </button>
                        </div>
                        <div className="flex bg-surface-800 p-1 rounded-lg">
                            <button className={`flex-1 flex gap-1 items-center justify-center py-1.5 text-[10px] uppercase tracking-widest font-black rounded-md transition-all ${!isRelativeMode ? 'bg-surface-700 text-heading shadow-sm' : 'text-surface-500 hover:text-surface-300'}`} onClick={() => setIsRelativeMode(false)}>
                                Normal Mode
                            </button>
                            <button className={`flex-1 flex gap-1 items-center justify-center py-1.5 text-[10px] uppercase tracking-widest font-black rounded-md transition-all ${isRelativeMode ? 'bg-[rgba(244,63,94,0.1)] text-rose-400 shadow-sm border border-rose-500/30' : 'text-surface-500 hover:text-surface-300'}`} onClick={() => setIsRelativeMode(true)}>
                                Relative Mode
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end items-end mt-4">
                        <div className="flex gap-2">
                            {status !== 'idle' ? (
                                <button onClick={handleReset} className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-800 text-heading hover:bg-surface-700 transition-colors">
                                    <RotateCcw size={18} />
                                </button>
                            ) : (
                                <button onClick={handleStart} className="px-6 h-12 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${unitMeta.color}, ${unitMeta.color}dd)` }}>
                                    <Play size={16} /> Start
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showOverlay && (
                <div className="sl-overlay">
                    <div className="sl-overlay__card">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${unitMeta.color}20` }}>
                            <Lightbulb size={28} style={{ color: unitMeta.color }} />
                        </div>
                        <h3 className="text-xl font-black text-heading mb-2">The Golden Rule of Relativity</h3>
                        <div className="text-sm text-surface-400 leading-relaxed space-y-4 text-center">
                            <p>You've successfully seen relative velocity with your own eyes.</p>
                            <p>Instead of memorizing whether to add or subtract, remember the <strong>Perspective Shift</strong>:</p>
                            <div className="bg-surface-900 border border-surface-800 p-4 rounded-xl text-left pl-6">
                                <ul className="list-disc space-y-2">
                                    <li>If you are moving <strong>towards</strong> someone, the environment makes them rush at you even faster.</li>
                                    <li>If you are <strong>chasing</strong> someone at the same speed, they look like they are standing perfectly still!</li>
                                </ul>
                            </div>
                        </div>
                        <button onClick={() => setShowOverlay(false)}
                            className="mt-6 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all hover:opacity-90"
                            style={{ background: unitMeta.color }}>
                            To The Forge
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
