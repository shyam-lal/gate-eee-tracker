import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, GripHorizontal } from 'lucide-react';

/**
 * ScientificCalc — GATE-exact draggable scientific calculator.
 * Light gray body, green "Help" button in title bar, matching the exam screenshot.
 */
const ScientificCalc = ({ onClose }) => {
    const [display, setDisplay] = useState('0');
    const [newNumber, setNewNumber] = useState(true);
    const [position, setPosition] = useState({ x: 250, y: 120 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // ─── Drag ───────────────────────────────────────────────────
    const handleMouseDown = useCallback((e) => {
        setDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }, [position]);

    useEffect(() => {
        if (!dragging) return;
        const move = (e) => setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
        const up = () => setDragging(false);
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    }, [dragging]);

    // ─── Calculator Logic ───────────────────────────────────────
    const appendDigit = (d) => {
        if (newNumber) { setDisplay(d); setNewNumber(false); }
        else { setDisplay(prev => prev === '0' ? d : prev + d); }
    };
    const appendDecimal = () => {
        if (newNumber) { setDisplay('0.'); setNewNumber(false); }
        else if (!display.includes('.')) { setDisplay(prev => prev + '.'); }
    };
    const appendOp = (op) => { setDisplay(prev => prev + op); setNewNumber(false); };
    const clear = () => { setDisplay('0'); setNewNumber(true); };
    const backspace = () => {
        if (display.length <= 1) { setDisplay('0'); setNewNumber(true); }
        else { setDisplay(prev => prev.slice(0, -1)); }
    };
    const evaluate = () => {
        try {
            const result = Function('"use strict"; return (' + display
                .replace(/×/g, '*').replace(/÷/g, '/')
                .replace(/π/g, Math.PI.toString())
                .replace(/e(?!x)/g, Math.E.toString())
            + ')')();
            setDisplay(String(parseFloat(result.toPrecision(12))));
            setNewNumber(true);
        } catch { setDisplay('Error'); setNewNumber(true); }
    };
    const applyFn = (fn) => {
        try {
            const val = parseFloat(display);
            const fns = {
                sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10,
                ln: Math.log, sqrt: Math.sqrt, 'x²': v => v*v, 'x³': v => v*v*v,
                '1/x': v => 1/v, '|x|': Math.abs, exp: Math.exp, '10^x': v => Math.pow(10,v), '±': v => -v
            };
            const result = (fns[fn] || (v => v))(val);
            setDisplay(String(parseFloat(result.toPrecision(12))));
            setNewNumber(true);
        } catch { setDisplay('Error'); setNewNumber(true); }
    };

    const font = { fontFamily: "'Segoe UI', Tahoma, sans-serif" };

    const Btn = ({ label, onClick, bg = '#f0f0f0', color = '#333', bold = false }) => (
        <button onClick={onClick}
            className="px-0.5 py-2 rounded text-xs transition-all active:brightness-90"
            style={{ ...font, background: bg, color, fontWeight: bold ? 700 : 500, border: '1px solid #bbb', minWidth: 0 }}>
            {label}
        </button>
    );

    return (
        <div className="fixed z-[300] select-none" style={{ left: position.x, top: position.y }}>
            <div className="rounded-lg overflow-hidden" style={{ ...font, background: '#dcdcdc', border: '2px solid #999', width: 320, boxShadow: '4px 4px 12px rgba(0,0,0,0.3)' }}>
                {/* Title bar */}
                <div className="flex items-center justify-between px-2 py-1.5 cursor-move"
                     style={{ background: 'linear-gradient(180deg, #6699CC 0%, #336699 100%)', borderBottom: '1px solid #555' }}
                     onMouseDown={handleMouseDown}>
                    <span className="text-[11px] font-bold text-white">Scientific Calculator</span>
                    <div className="flex items-center gap-1">
                        <button className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{ background: '#27AE60', color: '#fff', border: '1px solid #1E8449' }}>
                            Help
                        </button>
                        <button className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{ background: '#ddd', border: '1px solid #999', color: '#333' }}>—</button>
                        <button onClick={onClose} className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{ background: '#E74C3C', color: '#fff', border: '1px solid #C0392B' }}>✕</button>
                    </div>
                </div>

                {/* Display */}
                <div className="px-2 pt-2 pb-1">
                    <div className="px-2 py-1.5 text-right font-mono text-lg overflow-x-auto whitespace-nowrap"
                         style={{ background: '#fff', border: '2px inset #bbb', color: '#222' }}>
                        {display}
                    </div>
                    {/* Secondary display */}
                    <div className="px-2 py-1 text-right font-mono text-xs"
                         style={{ background: '#fff', border: '1px solid #ccc', borderTop: 'none', color: '#888' }}>
                        &nbsp;
                    </div>
                </div>

                {/* Buttons */}
                <div className="px-2 pb-2 grid grid-cols-5 gap-0.5">
                    <Btn label="Mod" onClick={() => appendOp('%')} />
                    <Btn label="Deg" onClick={() => {}} />
                    <Btn label="/" onClick={() => appendOp('÷')} />
                    <Btn label="MR" onClick={() => {}} />
                    <Btn label="MS" onClick={() => {}} />

                    <Btn label="sin" onClick={() => applyFn('sin')} />
                    <Btn label="cos" onClick={() => applyFn('cos')} />
                    <Btn label="tan" onClick={() => applyFn('tan')} />
                    <Btn label="Exp" onClick={() => applyFn('exp')} />
                    <Btn label="1" onClick={() => appendDigit('1')} bg="#fff" bold />

                    <Btn label="sinh" onClick={() => applyFn('sin')} />
                    <Btn label="cosh" onClick={() => applyFn('cos')} />
                    <Btn label="tanh" onClick={() => applyFn('tan')} />
                    <Btn label="log" onClick={() => applyFn('log')} />
                    <Btn label="(" onClick={() => appendOp('(')} />

                    <Btn label="x²" onClick={() => applyFn('x²')} />
                    <Btn label="x³" onClick={() => applyFn('x³')} />
                    <Btn label="xⁿ" onClick={() => appendOp('**')} />
                    <Btn label="10ˣ" onClick={() => applyFn('10^x')} />
                    <Btn label=")" onClick={() => appendOp(')')} />

                    <Btn label="π" onClick={() => { setDisplay(String(Math.PI)); setNewNumber(true); }} />
                    <Btn label="e" onClick={() => { setDisplay(String(Math.E)); setNewNumber(true); }} />
                    <Btn label="n!" onClick={() => {
                        const v = parseInt(display);
                        let f = 1; for(let i = 2; i <= v; i++) f *= i;
                        setDisplay(String(f)); setNewNumber(true);
                    }} />
                    <Btn label="ln" onClick={() => applyFn('ln')} />
                    <Btn label="log" onClick={() => applyFn('log')} />

                    <Btn label="√" onClick={() => applyFn('sqrt')} />
                    <Btn label="∛" onClick={() => { setDisplay(String(Math.cbrt(parseFloat(display)))); setNewNumber(true); }} />
                    <Btn label="yˣ" onClick={() => appendOp('**')} />
                    <Btn label="7" onClick={() => appendDigit('7')} bg="#fff" bold />
                    <Btn label="8" onClick={() => appendDigit('8')} bg="#fff" bold />

                    <Btn label="9" onClick={() => appendDigit('9')} bg="#fff" bold />
                    <Btn label="÷" onClick={() => appendOp('÷')} bg="#f5c542" color="#333" bold />
                    <Btn label="%" onClick={() => appendOp('%')} />
                    <Btn label="4" onClick={() => appendDigit('4')} bg="#fff" bold />
                    <Btn label="5" onClick={() => appendDigit('5')} bg="#fff" bold />

                    <Btn label="6" onClick={() => appendDigit('6')} bg="#fff" bold />
                    <Btn label="×" onClick={() => appendOp('×')} bg="#f5c542" color="#333" bold />
                    <Btn label="1/x" onClick={() => applyFn('1/x')} />
                    <Btn label="1" onClick={() => appendDigit('1')} bg="#fff" bold />
                    <Btn label="2" onClick={() => appendDigit('2')} bg="#fff" bold />

                    <Btn label="3" onClick={() => appendDigit('3')} bg="#fff" bold />
                    <Btn label="−" onClick={() => appendOp('-')} bg="#f5c542" color="#333" bold />
                    <Btn label="±" onClick={() => applyFn('±')} />
                    <Btn label="0" onClick={() => appendDigit('0')} bg="#fff" bold />
                    <Btn label="." onClick={appendDecimal} bg="#fff" bold />

                    <Btn label="C" onClick={clear} bg="#E74C3C" color="#fff" bold />
                    <Btn label="+" onClick={() => appendOp('+')} bg="#f5c542" color="#333" bold />
                    <Btn label="⌫" onClick={backspace} />
                    <Btn label="=" onClick={evaluate} bg="#2E86C1" color="#fff" bold />
                    <Btn label="%" onClick={() => appendOp('%')} />
                </div>

                {/* Readout */}
                <div className="px-2 pb-2 text-center">
                    <span className="text-[9px]" style={{ color: '#888' }}>Readout text box is focused</span>
                </div>
            </div>
        </div>
    );
};

export default ScientificCalc;
