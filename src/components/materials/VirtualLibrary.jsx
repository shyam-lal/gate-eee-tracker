import { useState, useEffect, useMemo, useCallback } from 'react';
import { exams as examsApi } from '../../services/api';
import { ArrowLeft, Search, BookOpen, X, ExternalLink, FileText, Video, Calculator, Bookmark } from 'lucide-react';
import BookshelfUnit from './BookshelfUnit';
import ReadingTable from './ReadingTable';
import './VirtualLibrary.css';

const STORAGE_KEY = 'library_bookmarks';

const contentTypeLabels = {
    notes: 'Notes',
    pdf: 'PDF',
    drive_link: 'Drive Link',
    video_link: 'Video',
    formula_sheet: 'Formula Sheet',
};

const BOOK_COLORS = {
    notes:         { bg: '#d4a853' },
    pdf:           { bg: '#e05a6a' },
    drive_link:    { bg: '#4ab8a8' },
    video_link:    { bg: '#9b6bdf' },
    formula_sheet: { bg: '#5cb85c' },
};

const VirtualLibrary = ({ examId, examName, onBack }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return new Set(stored ? JSON.parse(stored) : []);
        } catch { return new Set(); }
    });
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');

    // Load materials
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await examsApi.getMaterials(examId);
                setMaterials(data);
            } catch (err) {
                console.error('Failed to load materials:', err);
            }
            setLoading(false);
        };
        if (examId) load();
    }, [examId]);

    // Persist bookmarks
    const persistBookmarks = useCallback((newBookmarks) => {
        setBookmarks(newBookmarks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...newBookmarks]));
    }, []);

    const toggleBookmark = useCallback((matId) => {
        setBookmarks(prev => {
            const next = new Set(prev);
            if (next.has(matId)) next.delete(matId);
            else next.add(matId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
            return next;
        });
    }, []);

    const removeBookmark = useCallback((matId) => {
        setBookmarks(prev => {
            const next = new Set(prev);
            next.delete(matId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
            return next;
        });
    }, []);

    // Group materials by subject
    const grouped = useMemo(() => {
        const map = {};
        for (const mat of materials) {
            const key = mat.subject_name || 'General';
            if (!map[key]) map[key] = [];
            map[key].push(mat);
        }
        return map;
    }, [materials]);

    // Bookmarked materials
    const bookmarkedMaterials = useMemo(() => {
        return materials.filter(m => bookmarks.has(m.id));
    }, [materials, bookmarks]);

    // Search results
    const searchResults = useMemo(() => {
        let filtered = materials;
        if (filterType) {
            filtered = filtered.filter(m => m.content_type === filterType);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(m =>
                m.title.toLowerCase().includes(q) ||
                (m.subject_name && m.subject_name.toLowerCase().includes(q)) ||
                (m.topic_name && m.topic_name.toLowerCase().includes(q))
            );
        }
        return filtered;
    }, [materials, search, filterType]);

    // Content types available
    const contentTypes = useMemo(() => {
        return [...new Set(materials.map(m => m.content_type))];
    }, [materials]);

    // Handle opening a material
    const handleOpenMaterial = useCallback((mat) => {
        if (mat.file_url) {
            window.open(mat.file_url, '_blank', 'noopener,noreferrer');
        } else {
            setSelectedMaterial(mat);
        }
    }, []);

    return (
        <div className="library-scene">
            {/* Header */}
            <div className="library-header">
                <div className="library-header__left">
                    <button className="library-header__back" onClick={onBack}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="library-header__title">
                            📚 Library
                        </div>
                        <div className="library-header__subtitle">
                            {examName || 'Study Materials'}
                        </div>
                    </div>
                </div>
                <div className="library-header__actions">
                    <button
                        className={`library-header__btn ${showSearch ? 'library-header__btn--active' : ''}`}
                        onClick={() => { setShowSearch(true); setSearch(''); setFilterType(''); }}
                    >
                        <Search size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="library-content">
                {loading ? (
                    <div className="library-loading">
                        <div className="library-loading__spinner" />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Loading the library...</span>
                    </div>
                ) : materials.length === 0 ? (
                    <div className="library-empty">
                        <div className="library-empty__icon">📚</div>
                        <div className="library-empty__title">The shelves are empty</div>
                        <div className="library-empty__desc">
                            No study materials have been added for this exam yet
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Bookshelves by subject */}
                        {Object.entries(grouped).map(([subjectName, mats]) => (
                            <BookshelfUnit
                                key={subjectName}
                                subjectName={subjectName}
                                materials={mats}
                                onBookClick={handleOpenMaterial}
                                onToggleBookmark={toggleBookmark}
                                bookmarks={bookmarks}
                            />
                        ))}

                        {/* Reading Table */}
                        <ReadingTable
                            bookmarkedMaterials={bookmarkedMaterials}
                            onBookClick={handleOpenMaterial}
                            onRemoveBookmark={removeBookmark}
                        />
                    </>
                )}
            </div>

            {/* Search Overlay */}
            {showSearch && (
                <div className="library-search-overlay">
                    <div className="library-search__header">
                        <div className="library-search__input-wrap">
                            <Search size={16} style={{ color: '#6b5040', flexShrink: 0 }} />
                            <input
                                className="library-search__input"
                                placeholder="Search books..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                            {search && (
                                <button
                                    style={{ background: 'none', border: 'none', color: '#6b5040', cursor: 'pointer' }}
                                    onClick={() => setSearch('')}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button className="library-search__close" onClick={() => setShowSearch(false)}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Type filter chips */}
                    <div className="library-search__filters">
                        <button
                            className={`library-search__chip ${!filterType ? 'library-search__chip--active' : ''}`}
                            onClick={() => setFilterType('')}
                        >
                            All
                        </button>
                        {contentTypes.map(t => (
                            <button
                                key={t}
                                className={`library-search__chip ${filterType === t ? 'library-search__chip--active' : ''}`}
                                onClick={() => setFilterType(filterType === t ? '' : t)}
                            >
                                {contentTypeLabels[t] || t}
                            </button>
                        ))}
                    </div>

                    {/* Results */}
                    <div className="library-search__results">
                        {searchResults.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#5a4a3a', fontSize: 13 }}>
                                No books found
                            </div>
                        ) : (
                            searchResults.map(mat => {
                                const color = BOOK_COLORS[mat.content_type] || BOOK_COLORS.notes;
                                return (
                                    <div
                                        key={mat.id}
                                        className="search-result-item"
                                        onClick={() => { handleOpenMaterial(mat); setShowSearch(false); }}
                                    >
                                        <div
                                            className="search-result-item__swatch"
                                            style={{ background: color.bg }}
                                        />
                                        <div className="search-result-item__info">
                                            <div className="search-result-item__title">{mat.title}</div>
                                            <div className="search-result-item__meta">
                                                {mat.subject_name || 'General'}
                                                {mat.topic_name && ` • ${mat.topic_name}`}
                                            </div>
                                        </div>
                                        <span
                                            className="search-result-item__type"
                                            style={{ color: color.bg, borderColor: color.bg }}
                                        >
                                            {contentTypeLabels[mat.content_type] || mat.content_type}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Material Detail Modal */}
            {selectedMaterial && (
                <div className="material-modal-overlay" onClick={() => setSelectedMaterial(null)}>
                    <div className="material-modal" onClick={e => e.stopPropagation()}>
                        <div className="material-modal__header">
                            <div style={{ flex: 1 }}>
                                <div className="material-modal__title">{selectedMaterial.title}</div>
                                <div className="material-modal__meta">
                                    <span className="material-modal__tag">
                                        {contentTypeLabels[selectedMaterial.content_type] || selectedMaterial.content_type}
                                    </span>
                                    {selectedMaterial.subject_name && (
                                        <span className="material-modal__tag">
                                            {selectedMaterial.subject_name}
                                        </span>
                                    )}
                                    {selectedMaterial.topic_name && (
                                        <span className="material-modal__tag">
                                            {selectedMaterial.topic_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                className="material-modal__close"
                                onClick={() => setSelectedMaterial(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="material-modal__body">
                            {selectedMaterial.content ? (
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                                    {selectedMaterial.content}
                                </pre>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 40, color: '#5a4a3a' }}>
                                    No content available for this material.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VirtualLibrary;
