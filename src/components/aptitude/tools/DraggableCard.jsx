import { useState, useRef } from 'react';

/**
 * DraggableCard — A drag-and-drop card for Structure Lab tools.
 *
 * Props:
 *   id             — unique card identifier (e.g., 'A')
 *   label          — display text
 *   state          — 'tray' | 'draft' | 'confirmed' | 'shaking'
 *   color          — accent color
 *   disabled       — if true, card can't be dragged
 *   onDragStart    — (id) => void
 *   icon           — optional icon element
 */
export default function DraggableCard({
    id, label, state = 'tray', color = '#10b981',
    disabled = false, onDragStart, icon,
}) {
    const [isDragging, setIsDragging] = useState(false);
    const cardRef = useRef(null);

    const handleDragStart = (e) => {
        if (disabled || state === 'confirmed') return;
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        onDragStart?.(id);
    };

    const handleDragEnd = () => setIsDragging(false);

    const isConfirmed = state === 'confirmed';
    const isShaking = state === 'shaking';
    const isInTray = state === 'tray';

    return (
        <div
            ref={cardRef}
            draggable={!disabled && !isConfirmed}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`draggable-card ${isConfirmed ? 'draggable-card--confirmed' : ''} ${isShaking ? 'draggable-card--shaking' : ''} ${isDragging ? 'draggable-card--dragging' : ''} ${isInTray ? 'draggable-card--tray' : ''}`}
            style={{
                borderColor: isConfirmed ? color : isShaking ? '#ef4444' : 'rgba(51,65,85,0.6)',
                borderStyle: isConfirmed ? 'solid' : 'dashed',
                background: isConfirmed ? `${color}12` : 'rgba(15,23,42,0.8)',
                cursor: disabled || isConfirmed ? 'default' : 'grab',
                opacity: isDragging ? 0.4 : 1,
            }}
        >
            {icon && <span className="draggable-card__icon">{icon}</span>}
            <span className="draggable-card__label" style={{ color: isConfirmed ? color : '#e2e8f0' }}>
                {label}
            </span>
            {isConfirmed && (
                <span className="draggable-card__check" style={{ color }}>✓</span>
            )}
        </div>
    );
}
