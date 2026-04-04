import { useState, useCallback, useRef } from 'react';
import DynamicSlider from './DynamicSlider';
import { Beaker, Zap, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

const FLASK_A_CONC = 20;
const FLASK_B_CONC = 50;
const TOTAL_VOLUME = 100;

const STEPS = [
    {
        id: 0,
        title: 'Step 1: The Pure Extremes',
        instruction: 'Let\'s start at an extreme. Drag the slider to 0% Liquid A. Notice the Result Flask becomes exactly Liquid B (50%).',
        check: (ratioA) => ratioA === 0,
        error: 'Drag the slider all the way to the left (0%).'
    },
    {
        id: 1,
        title: 'Step 2: The Equal Mix',
        instruction: 'Now, drag the slider exactly to 50%. Observe the Alligation Cross: the parts A and parts B are equal (15.0 : 15.0).',
        check: (ratioA) => ratioA === 50,
        error: 'Set the slider to the middle (50%).'
    },
    {
        id: 2,
        title: 'Step 3: Target Concentration',
        instruction: 'We need a final mixture of exactly 44%. Adjust the slider until the result shows 44%. Watch how the cross instantly calculates the correct 1:4 ratio!',
        check: (ratioA, result) => Math.round(result) === 44, // 20% A gives 44%
        error: 'Drag the slider near 20% until the Result reads 44%.'
    }
];

export default function MixturesSparkTool({ node, unitMeta, onConceptMastered }) {
    const [ratioA, setRatioA] = useState(50);
    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const feedbackTimeout = useRef(null);

    const volA = (ratioA / 100) * TOTAL_VOLUME;
    const volB = TOTAL_VOLUME - volA;
    const resultConc = ((volA * FLASK_A_CONC) + (volB * FLASK_B_CONC)) / TOTAL_VOLUME;

    const diff_top = Math.abs(FLASK_B_CONC - resultConc);
    const diff_bot = Math.abs(resultConc - FLASK_A_CONC);

    const showFeedbackMessage = (type, message) => {
        clearTimeout(feedbackTimeout.current);
        setFeedback({ type, message });
        feedbackTimeout.current = setTimeout(() => setFeedback(null), 3000);
    };

    const handleSliderChange = useCallback((val) => {
        setRatioA(val);

        if (completed) return;

        const vol_a = (val / 100) * TOTAL_VOLUME;
        const vol_b = TOTAL_VOLUME - vol_a;
        const result = ((vol_a * FLASK_A_CONC) + (vol_b * FLASK_B_CONC)) / TOTAL_VOLUME;

        const step = STEPS[currentStep];
        if (step.check(val, result)) {
            if (currentStep < STEPS.length - 1) {
                showFeedbackMessage('success', 'Perfect! Moving to next step.');
                setTimeout(() => {
                    setCurrentStep(prev => prev + 1);
                }, 1000);
            } else {
                showFeedbackMessage('success', 'Mastered!');
                setTimeout(() => {
                    setCompleted(true);
                    setShowOverlay(true);
                    onConceptMastered?.(true);
                }, 1000);
            }
        }
    }, [currentStep, completed, onConceptMastered]);

    const Flask = ({ label, concentration, volume, color, fillColor }) => {
        const fillH = Math.max(4, (volume / TOTAL_VOLUME) * 70);
        return (
            <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-surface-500">{label}</span>
                <svg width={80} height={120} viewBox="0 0 80 120">
                    <path d="M 25 10 L 25 40 L 12 95 Q 10 105 20 108 L 60 108 Q 70 105 68 95 L 55 40 L 55 10 Z"
                        fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
                    <rect x={28} y={4} width={24} height={10} rx={2} fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
                    <clipPath id={`flask-clip-${label}`}>
                        <path d="M 26 40 L 13 95 Q 11 105 21 107 L 59 107 Q 69 105 67 95 L 54 40 Z" />
                    </clipPath>
                    <rect x={10} y={107 - fillH} width={60} height={fillH}
                        fill={fillColor} opacity={0.6}
                        clipPath={`url(#flask-clip-${label})`}>
                        <animate attributeName="y" values={`${107 - fillH};${105 - fillH};${107 - fillH}`}
                            dur="3s" repeatCount="indefinite" />
                    </rect>
                    <rect x={16} y={107 - fillH} width={48} height={2}
                        fill={fillColor} opacity={0.3} rx={1}
                        clipPath={`url(#flask-clip-${label})`}>
                        <animate attributeName="y" values={`${107 - fillH};${105 - fillH};${107 - fillH}`}
                            dur="3s" repeatCount="indefinite" />
                    </rect>
                </svg>
                <div className="text-center">
                    <p className="text-lg font-black" style={{ color }}>{concentration}%</p>
                    <p className="text-[10px] text-surface-600 font-bold">{Math.round(volume)} ml</p>
                </div>
            </div>
        );
    };

    const AlligationCross = () => {
        const w = 260, h = 160;
        const cx = w / 2, cy = h / 2;
        return (
            <div className="alligation-cross-wrap alligation-visible">
                <div className="flex items-center gap-2 mb-3">
                    <Zap size={12} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80">Alligation Cross</span>
                </div>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="alligation-svg">
                    <text x={20} y={30} fill={unitMeta.color} fontSize={14} fontWeight={800}>
                        A = {FLASK_A_CONC}%
                    </text>
                    <text x={20} y={h - 15} fill="#f59e0b" fontSize={14} fontWeight={800}>
                        B = {FLASK_B_CONC}%
                    </text>

                    <circle cx={cx} cy={cy} r={24} fill="rgba(99,102,241,0.1)" stroke={unitMeta.color} strokeWidth={2} />
                    <text x={cx} y={cy + 5} textAnchor="middle" fill="#e2e8f0" fontSize={14} fontWeight={900}>
                        {resultConc.toFixed(1)}%
                    </text>

                    <text x={w - 65} y={30} fill={unitMeta.color} fontSize={13} fontWeight={800} textAnchor="end">
                        {diff_top.toFixed(1)}
                    </text>
                    <text x={w - 20} y={30} fill="rgba(148,163,184,0.6)" fontSize={10} fontWeight={700}>
                        parts A
                    </text>
                    <text x={w - 65} y={h - 15} fill="#f59e0b" fontSize={13} fontWeight={800} textAnchor="end">
                        {diff_bot.toFixed(1)}
                    </text>
                    <text x={w - 20} y={h - 15} fill="rgba(148,163,184,0.6)" fontSize={10} fontWeight={700}>
                        parts B
                    </text>

                    <line x1={70} y1={25} x2={cx - 26} y2={cy - 5}
                        stroke={unitMeta.color} strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />
                    <line x1={70} y1={h - 20} x2={cx - 26} y2={cy + 5}
                        stroke="#f59e0b" strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />

                    <line x1={cx + 26} y1={cy - 5} x2={w - 90} y2={25}
                        stroke={unitMeta.color} strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />
                    <line x1={cx + 26} y1={cy + 5} x2={w - 90} y2={h - 20}
                        stroke="#f59e0b" strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />

                    <text x={cx} y={h - 2} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize={9} fontWeight={700}>
                        Ratio A:B = {diff_top.toFixed(1)} : {diff_bot.toFixed(1)}
                    </text>
                </svg>
            </div>
        );
    };

    return (
        <div className="mixtures-spark-tool">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Beaker size={16} style={{ color: unitMeta.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: unitMeta.color }}>
                        Interactive Assistant — Mixtures
                    </span>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-surface-500">
                    Step {Math.min(currentStep + 1, STEPS.length)} / {STEPS.length}
                </div>
            </div>

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
                {completed && (
                    <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center gap-2 justify-center">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <span className="text-sm font-black text-emerald-400">All Steps Completed!</span>
                    </div>
                )}
            </div>

            {feedback && (
                <div className={`sl-feedback ${feedback.type === 'error' ? 'sl-feedback--error' : 'sl-feedback--success'}`}
                    style={feedback.type === 'success' ? { borderColor: `${unitMeta.color}50`, background: `${unitMeta.color}10` } : {}}>
                    {feedback.type === 'success' ? <CheckCircle size={14} style={{ color: unitMeta.color }} /> : <AlertCircle size={14} className="text-rose-400" />}
                    <span>{feedback.message}</span>
                </div>
            )}

            <div className="flex items-end justify-center gap-4 mb-6">
                <Flask label="Liquid A" concentration={FLASK_A_CONC} volume={volA} color={unitMeta.color} fillColor={unitMeta.color} />
                <div className="flex flex-col items-center gap-1 pb-8"><span className="text-2xl font-black text-surface-600">+</span></div>
                <Flask label="Liquid B" concentration={FLASK_B_CONC} volume={volB} color="#f59e0b" fillColor="#f59e0b" />
                <div className="flex flex-col items-center gap-1 pb-8"><span className="text-2xl font-black text-surface-600">=</span></div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-surface-500">Result</span>
                    <svg width={80} height={120} viewBox="0 0 80 120">
                        <path d="M 25 10 L 25 40 L 12 95 Q 10 105 20 108 L 60 108 Q 70 105 68 95 L 55 40 L 55 10 Z"
                            fill="none" stroke="#10b981" strokeWidth={2} opacity={0.5} />
                        <rect x={28} y={4} width={24} height={10} rx={2} fill="none" stroke="#10b981" strokeWidth={2} opacity={0.4} />
                        <clipPath id="flask-clip-result"><path d="M 26 40 L 13 95 Q 11 105 21 107 L 59 107 Q 69 105 67 95 L 54 40 Z" /></clipPath>
                        <defs>
                            <linearGradient id="mix-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={unitMeta.color} stopOpacity={0.5} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.5} />
                            </linearGradient>
                        </defs>
                        <rect x={10} y={37} width={60} height={70} fill="url(#mix-gradient)" opacity={0.6} clipPath="url(#flask-clip-result)">
                            <animate attributeName="y" values="37;35;37" dur="3s" repeatCount="indefinite" />
                        </rect>
                    </svg>
                    <div className="text-center">
                        <p className="text-lg font-black text-emerald-400">{resultConc.toFixed(1)}%</p>
                        <p className="text-[10px] text-surface-600 font-bold">{TOTAL_VOLUME} ml</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center mb-6">
                <DynamicSlider min={0} max={100} step={1} value={ratioA} onChange={handleSliderChange} label="Ratio of Liquid A" unit="%" color={unitMeta.color} width={320}
                    markers={[{ value: 0, label: '0%' }, { value: 25, label: '25%' }, { value: 50, label: '50%' }, { value: 75, label: '75%' }, { value: 100, label: '100%' }]} />
            </div>

            <AlligationCross />

            {showOverlay && (
                <div className="sl-overlay">
                    <div className="sl-overlay__card">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: `${unitMeta.color}20` }}>
                            <Lightbulb size={28} style={{ color: unitMeta.color }} />
                        </div>
                        <h3 className="text-xl font-black text-heading mb-2">Mixtures Summary</h3>
                        <h4 className="text-sm font-black mb-3" style={{ color: unitMeta.color }}>The Alligation Rule</h4>
                        <div className="text-sm text-surface-400 leading-relaxed space-y-2">
                            <p>To find the mixing ratio of two liquids A and B to get a Target mix:</p>
                            <p><strong className="text-heading">Step 1:</strong> Find the cross differences: |B - Target| gives you Parts of A. |A - Target| gives you Parts of B.</p>
                            <p><strong className="text-heading">Step 2:</strong> The required ratio of A:B is simply directly proportional to these cross differences.</p>
                        </div>
                        <button onClick={() => setShowOverlay(false)}
                            className="mt-5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all hover:opacity-90"
                            style={{ background: unitMeta.color }}>
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
