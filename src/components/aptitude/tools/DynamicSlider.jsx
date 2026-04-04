import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * DynamicSlider — A premium SVG-based slider for interactive Spark tools.
 *
 * Props:
 *   min, max       — value range
 *   step           — snap increment (0 = continuous)
 *   value          — controlled value
 *   onChange        — (newValue) => void
 *   label          — label text above slider
 *   unit           — unit suffix (e.g., "%", "ml")
 *   color          — accent color (hex)
 *   markers        — [{value, label}] optional tick marks
 *   width          — SVG width (default 320)
 */
export default function DynamicSlider({
    min = 0, max = 100, step = 1,
    value, onChange,
    label = '', unit = '',
    color = '#6366f1',
    markers = [],
    width = 320,
}) {
    const trackRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const height = 56;
    const padX = 20;
    const trackW = width - padX * 2;
    const trackY = 32;
    const trackH = 6;
    const thumbR = 12;

    const pct = ((value - min) / (max - min)) * 100;
    const thumbX = padX + (pct / 100) * trackW;

    const clampAndSnap = useCallback((raw) => {
        let v = Math.max(min, Math.min(max, raw));
        if (step > 0) v = Math.round(v / step) * step;
        // Round to avoid floating point artifacts
        v = Math.round(v * 100) / 100;
        return v;
    }, [min, max, step]);

    const getValueFromX = useCallback((clientX) => {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return value;
        const relX = clientX - rect.left - padX;
        const ratio = Math.max(0, Math.min(1, relX / trackW));
        return clampAndSnap(min + ratio * (max - min));
    }, [min, max, trackW, padX, clampAndSnap, value]);

    const handlePointerDown = (e) => {
        e.preventDefault();
        setDragging(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        onChange(getValueFromX(clientX));
    };

    useEffect(() => {
        if (!dragging) return;
        const handleMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            onChange(getValueFromX(clientX));
        };
        const handleUp = () => setDragging(false);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [dragging, getValueFromX, onChange]);

    return (
        <div className="dynamic-slider-wrap" style={{ width }}>
            {/* Label + Value */}
            <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest">{label}</span>
                <span className="text-sm font-black" style={{ color }}>
                    {value}{unit}
                </span>
            </div>

            <svg
                ref={trackRef}
                width={width}
                height={height}
                className="dynamic-slider-svg"
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                style={{ cursor: dragging ? 'grabbing' : 'pointer', touchAction: 'none' }}
            >
                {/* Track background */}
                <rect x={padX} y={trackY - trackH / 2} width={trackW} height={trackH} rx={trackH / 2}
                    fill="rgba(51,65,85,0.5)" />

                {/* Track fill */}
                <rect x={padX} y={trackY - trackH / 2} width={Math.max(0, (pct / 100) * trackW)} height={trackH} rx={trackH / 2}
                    fill={color} opacity={0.7} />

                {/* Markers */}
                {markers.map((m, i) => {
                    const mx = padX + ((m.value - min) / (max - min)) * trackW;
                    return (
                        <g key={i}>
                            <line x1={mx} y1={trackY - 8} x2={mx} y2={trackY + 8}
                                stroke="rgba(148,163,184,0.3)" strokeWidth={1} />
                            <text x={mx} y={trackY + 22} textAnchor="middle"
                                fill="rgba(148,163,184,0.5)" fontSize={8} fontWeight={700}>
                                {m.label}
                            </text>
                        </g>
                    );
                })}

                {/* Glow behind thumb when dragging */}
                {dragging && (
                    <circle cx={thumbX} cy={trackY} r={thumbR + 8}
                        fill={color} opacity={0.15}>
                        <animate attributeName="r" values={`${thumbR + 6};${thumbR + 12};${thumbR + 6}`}
                            dur="1.5s" repeatCount="indefinite" />
                    </circle>
                )}

                {/* Thumb */}
                <circle cx={thumbX} cy={trackY} r={thumbR}
                    fill="#0f172a" stroke={color} strokeWidth={3}
                    style={{ filter: dragging ? `drop-shadow(0 0 8px ${color}80)` : 'none', transition: dragging ? 'none' : 'cx 0.1s ease' }}
                />
                {/* Inner dot */}
                <circle cx={thumbX} cy={trackY} r={4} fill={color}
                    style={{ transition: dragging ? 'none' : 'cx 0.1s ease' }} />
            </svg>
        </div>
    );
}
