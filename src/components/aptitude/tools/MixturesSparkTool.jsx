import { useState, useCallback, useEffect, useRef } from 'react';
import DynamicSlider from './DynamicSlider';
import { Beaker, Zap } from 'lucide-react';

/**
 * MixturesSparkTool — Node 11: Mixtures & Alligation
 *
 * Two flasks with concentrations A% and B%. User drags a ratio slider.
 * Result flask shows final concentration. Alligation cross updates live.
 * Must explore 3+ distinct positions to unlock mastery.
 */

const FLASK_A_CONC = 20; // Liquid A concentration %
const FLASK_B_CONC = 50; // Liquid B concentration %
const TOTAL_VOLUME = 100; // ml total mix

export default function MixturesSparkTool({ node, unitMeta, onConceptMastered }) {
    const [ratioA, setRatioA] = useState(50); // % of Liquid A in mix (0-100)
    const [explored, setExplored] = useState(new Set());
    const [mastered, setMastered] = useState(false);
    const [showCross, setShowCross] = useState(false);
    const prevBucket = useRef(null);

    const volA = (ratioA / 100) * TOTAL_VOLUME;
    const volB = TOTAL_VOLUME - volA;
    const resultConc = ((volA * FLASK_A_CONC) + (volB * FLASK_B_CONC)) / TOTAL_VOLUME;

    // Alligation values
    const diff_top = Math.abs(FLASK_B_CONC - resultConc);   // part A
    const diff_bot = Math.abs(resultConc - FLASK_A_CONC);   // part B

    const handleSliderChange = useCallback((val) => {
        setRatioA(val);
        setShowCross(true);
        // Track exploration: bucket into 5 zones (0-20, 20-40, 40-60, 60-80, 80-100)
        const bucket = Math.floor(val / 25);
        if (bucket !== prevBucket.current) {
            prevBucket.current = bucket;
            setExplored(prev => {
                const next = new Set(prev);
                next.add(bucket);
                return next;
            });
        }
    }, []);

    useEffect(() => {
        if (explored.size >= 3 && !mastered) {
            setMastered(true);
            onConceptMastered?.(true);
        }
    }, [explored, mastered, onConceptMastered]);

    // SVG Flask component
    const Flask = ({ label, concentration, volume, color, fillColor }) => {
        const fillH = Math.max(4, (volume / TOTAL_VOLUME) * 70);
        return (
            <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-surface-500">{label}</span>
                <svg width={80} height={120} viewBox="0 0 80 120">
                    {/* Flask body */}
                    <path d="M 25 10 L 25 40 L 12 95 Q 10 105 20 108 L 60 108 Q 70 105 68 95 L 55 40 L 55 10 Z"
                        fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
                    {/* Flask neck */}
                    <rect x={28} y={4} width={24} height={10} rx={2} fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
                    {/* Liquid fill */}
                    <clipPath id={`flask-clip-${label}`}>
                        <path d="M 26 40 L 13 95 Q 11 105 21 107 L 59 107 Q 69 105 67 95 L 54 40 Z" />
                    </clipPath>
                    <rect x={10} y={107 - fillH} width={60} height={fillH}
                        fill={fillColor} opacity={0.6}
                        clipPath={`url(#flask-clip-${label})`}>
                        {/* Subtle wave animation */}
                        <animate attributeName="y" values={`${107 - fillH};${105 - fillH};${107 - fillH}`}
                            dur="3s" repeatCount="indefinite" />
                    </rect>
                    {/* Liquid surface shine */}
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

    // Alligation Cross SVG
    const AlligationCross = () => {
        const w = 260, h = 160;
        const cx = w / 2, cy = h / 2;
        return (
            <div className={`alligation-cross-wrap ${showCross ? 'alligation-visible' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                    <Zap size={12} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80">Alligation Cross</span>
                </div>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="alligation-svg">
                    {/* Left values */}
                    <text x={20} y={30} fill={unitMeta.color} fontSize={14} fontWeight={800}>
                        A = {FLASK_A_CONC}%
                    </text>
                    <text x={20} y={h - 15} fill="#f59e0b" fontSize={14} fontWeight={800}>
                        B = {FLASK_B_CONC}%
                    </text>

                    {/* Center — result */}
                    <circle cx={cx} cy={cy} r={24} fill="rgba(99,102,241,0.1)" stroke={unitMeta.color} strokeWidth={2} />
                    <text x={cx} y={cy + 5} textAnchor="middle" fill="#e2e8f0" fontSize={14} fontWeight={900}>
                        {resultConc.toFixed(1)}%
                    </text>

                    {/* Right — parts */}
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

                    {/* Cross lines */}
                    <line x1={70} y1={25} x2={cx - 26} y2={cy - 5}
                        stroke={unitMeta.color} strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />
                    <line x1={70} y1={h - 20} x2={cx - 26} y2={cy + 5}
                        stroke="#f59e0b" strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />

                    <line x1={cx + 26} y1={cy - 5} x2={w - 90} y2={25}
                        stroke={unitMeta.color} strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />
                    <line x1={cx + 26} y1={cy + 5} x2={w - 90} y2={h - 20}
                        stroke="#f59e0b" strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />

                    {/* Formula label */}
                    <text x={cx} y={h - 2} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize={9} fontWeight={700}>
                        Ratio A:B = {diff_top.toFixed(1)} : {diff_bot.toFixed(1)}
                    </text>
                </svg>
            </div>
        );
    };

    return (
        <div className="mixtures-spark-tool">
            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
                <Beaker size={16} style={{ color: unitMeta.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: unitMeta.color }}>
                    Relativity Engine — Mixtures Lab
                </span>
            </div>
            <p className="text-xs text-surface-500 mb-5">
                Drag the slider to change the ratio. Watch the alligation cross update in real time.
            </p>

            {/* Flasks Row */}
            <div className="flex items-end justify-center gap-4 mb-6">
                <Flask label="Liquid A" concentration={FLASK_A_CONC} volume={volA}
                    color={unitMeta.color} fillColor={unitMeta.color} />

                <div className="flex flex-col items-center gap-1 pb-8">
                    <span className="text-2xl font-black text-surface-600">+</span>
                </div>

                <Flask label="Liquid B" concentration={FLASK_B_CONC} volume={volB}
                    color="#f59e0b" fillColor="#f59e0b" />

                <div className="flex flex-col items-center gap-1 pb-8">
                    <span className="text-2xl font-black text-surface-600">=</span>
                </div>

                {/* Result Flask */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-surface-500">Result</span>
                    <svg width={80} height={120} viewBox="0 0 80 120">
                        <path d="M 25 10 L 25 40 L 12 95 Q 10 105 20 108 L 60 108 Q 70 105 68 95 L 55 40 L 55 10 Z"
                            fill="none" stroke="#10b981" strokeWidth={2} opacity={0.5} />
                        <rect x={28} y={4} width={24} height={10} rx={2} fill="none" stroke="#10b981" strokeWidth={2} opacity={0.4} />
                        <clipPath id="flask-clip-result">
                            <path d="M 26 40 L 13 95 Q 11 105 21 107 L 59 107 Q 69 105 67 95 L 54 40 Z" />
                        </clipPath>
                        {/* Gradient fill showing mix */}
                        <defs>
                            <linearGradient id="mix-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={unitMeta.color} stopOpacity={0.5} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.5} />
                            </linearGradient>
                        </defs>
                        <rect x={10} y={37} width={60} height={70}
                            fill="url(#mix-gradient)" opacity={0.6}
                            clipPath="url(#flask-clip-result)">
                            <animate attributeName="y" values="37;35;37" dur="3s" repeatCount="indefinite" />
                        </rect>
                    </svg>
                    <div className="text-center">
                        <p className="text-lg font-black text-emerald-400">{resultConc.toFixed(1)}%</p>
                        <p className="text-[10px] text-surface-600 font-bold">{TOTAL_VOLUME} ml</p>
                    </div>
                </div>
            </div>

            {/* Ratio Slider */}
            <div className="flex justify-center mb-6">
                <DynamicSlider
                    min={0} max={100} step={1}
                    value={ratioA}
                    onChange={handleSliderChange}
                    label="Ratio of Liquid A"
                    unit="%"
                    color={unitMeta.color}
                    width={320}
                    markers={[
                        { value: 0, label: '0%' },
                        { value: 25, label: '25%' },
                        { value: 50, label: '50%' },
                        { value: 75, label: '75%' },
                        { value: 100, label: '100%' },
                    ]}
                />
            </div>

            {/* Alligation Cross */}
            <AlligationCross />

            {/* Exploration progress */}
            <div className="mt-4 flex items-center justify-center gap-2">
                {[0, 1, 2, 3, 4].map(b => (
                    <div key={b}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${explored.has(b) ? 'scale-125' : 'opacity-30'}`}
                        style={{ background: explored.has(b) ? unitMeta.color : 'rgba(148,163,184,0.3)' }}
                    />
                ))}
                <span className="text-[9px] font-bold text-surface-600 ml-2">
                    {mastered ? '✓ Concept explored' : `Explore ${Math.max(0, 3 - explored.size)} more positions`}
                </span>
            </div>
        </div>
    );
}
