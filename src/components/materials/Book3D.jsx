import { useState, useRef, useCallback } from 'react';
import { FileText, Video, Calculator, Bookmark, ExternalLink } from 'lucide-react';

// Color mapping for book types
const BOOK_COLORS = {
    notes:         { bg: '#d4a853', dark: '#b08a3a', top: '#e0bc6a' },
    pdf:           { bg: '#e05a6a', dark: '#b84555', top: '#ea7a86' },
    drive_link:    { bg: '#4ab8a8', dark: '#3a9488', top: '#6acabc' },
    video_link:    { bg: '#9b6bdf', dark: '#7a50b5', top: '#b08ae8' },
    formula_sheet: { bg: '#5cb85c', dark: '#48944a', top: '#78cc78' },
};

const BOOK_ICONS = {
    notes: FileText,
    pdf: FileText,
    drive_link: ExternalLink,
    video_link: Video,
    formula_sheet: Calculator,
};

const TYPE_LABELS = {
    notes: 'Notes',
    pdf: 'PDF',
    drive_link: 'Drive',
    video_link: 'Video',
    formula_sheet: 'Formula',
};

// Generate consistent height from title hash
const hashHeight = (title) => {
    let h = 0;
    for (let i = 0; i < title.length; i++) {
        h = ((h << 5) - h + title.charCodeAt(i)) | 0;
    }
    return 80 + (Math.abs(h) % 60); // 80–140px
};

// Generate slight width variation
const hashWidth = (title) => {
    let h = 0;
    for (let i = 0; i < title.length; i++) {
        h = ((h << 3) + title.charCodeAt(i)) | 0;
    }
    return 24 + (Math.abs(h) % 14); // 24–38px
};

const Book3D = ({ material, isBookmarked, onSelect, onToggleBookmark }) => {
    const [showContext, setShowContext] = useState(false);
    const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
    const bookRef = useRef(null);

    const colors = BOOK_COLORS[material.content_type] || BOOK_COLORS.notes;
    const height = hashHeight(material.title);
    const width = hashWidth(material.title);
    const Icon = BOOK_ICONS[material.content_type] || FileText;
    const typeLabel = TYPE_LABELS[material.content_type] || 'Note';

    const handleClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(material);
    }, [material, onSelect]);

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextPos({ x: e.clientX, y: e.clientY });
        setShowContext(true);
    }, []);

    const handleBookmark = useCallback((e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        onToggleBookmark(material.id);
        setShowContext(false);
    }, [material.id, onToggleBookmark]);

    return (
        <>
            <div
                ref={bookRef}
                className="book-3d"
                style={{ width: width + 8, height }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                title=""
            >
                {/* Tooltip */}
                <div className="book-3d__tooltip">
                    {material.title}
                    <div style={{ fontSize: 9, color: '#8a7560', marginTop: 2 }}>
                        {typeLabel} • {material.subject_name || 'General'}
                    </div>
                </div>

                {/* Bookmark ribbon */}
                {isBookmarked && <div className="book-3d__bookmark" />}

                <div className="book-3d__wrapper" style={{ width, height }}>
                    {/* Top face */}
                    <div
                        className="book-3d__top"
                        style={{ background: colors.top }}
                    />

                    {/* Spine (main visible face) */}
                    <div
                        className="book-3d__spine"
                        style={{
                            width,
                            height,
                            background: colors.bg,
                        }}
                    >
                        <span className="book-3d__spine-title">
                            {material.title}
                        </span>
                        <div className="book-3d__badge">
                            <Icon size={9} color="rgba(0,0,0,0.5)" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Right face (pages) */}
                    <div className="book-3d__pages" />
                </div>
            </div>

            {/* Context menu for bookmark */}
            {showContext && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 149 }}
                        onClick={() => setShowContext(false)}
                    />
                    <div
                        className="book-context-menu"
                        style={{
                            left: contextPos.x,
                            top: contextPos.y,
                        }}
                    >
                        <button
                            className="book-context-menu__item"
                            onClick={handleBookmark}
                        >
                            <Bookmark size={14} />
                            {isBookmarked ? 'Remove from Table' : 'Save to Reading Table'}
                        </button>
                        <button
                            className="book-context-menu__item"
                            onClick={handleClick}
                        >
                            <ExternalLink size={14} />
                            Open Material
                        </button>
                    </div>
                </>
            )}
        </>
    );
};

export default Book3D;
