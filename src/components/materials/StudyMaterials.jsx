import { useState, useEffect, useMemo } from 'react';
import { exams as examsApi } from '../../services/api';
import {
    ArrowLeft, Search, FileText, BookOpen, Video, Calculator,
    ChevronDown, ChevronRight, Filter, X, ExternalLink, Bookmark,
    Layers, GraduationCap
} from 'lucide-react';

const contentTypeConfig = {
    notes: { icon: FileText, color: 'indigo', label: 'Notes' },
    pdf: { icon: FileText, color: 'rose', label: 'PDF' },
    drive_link: { icon: Bookmark, color: 'blue', label: 'Drive Link' },
    video_link: { icon: Video, color: 'purple', label: 'Video' },
    formula_sheet: { icon: Calculator, color: 'amber', label: 'Formula Sheet' },
};

const StudyMaterials = ({ examId, examName, syllabus, onBack }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterType, setFilterType] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadMaterials();
    }, [examId, filterSubject, filterType]);

    const loadMaterials = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (filterSubject) filters.subject_id = filterSubject;
            if (filterType) filters.content_type = filterType;
            const data = await examsApi.getMaterials(examId, filters);
            setMaterials(data);
        } catch (err) {
            console.error('Failed to load materials:', err);
        }
        setLoading(false);
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return materials;
        const q = search.toLowerCase();
        return materials.filter(m =>
            m.title.toLowerCase().includes(q) ||
            (m.subject_name && m.subject_name.toLowerCase().includes(q)) ||
            (m.content && m.content.toLowerCase().includes(q))
        );
    }, [materials, search]);

    // Group materials by subject
    const grouped = useMemo(() => {
        const map = {};
        for (const mat of filtered) {
            const key = mat.subject_name || 'General';
            if (!map[key]) map[key] = [];
            map[key].push(mat);
        }
        return map;
    }, [filtered]);

    const contentTypes = [...new Set(materials.map(m => m.content_type))];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="border-b border-slate-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <BookOpen size={18} className="text-indigo-400" />
                                <h1 className="text-xl font-black uppercase tracking-tighter text-white">Study Materials</h1>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{examName || 'All Materials'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <Layers size={14} />
                        {materials.length} items
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 relative z-10">
                {/* Search & Filters */}
                <div className="mb-6 space-y-3">
                    <div className="flex gap-3">
                        <div className="flex-1 flex items-center bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3 gap-3 focus-within:border-indigo-500/50 transition-colors">
                            <Search size={16} className="text-slate-500 shrink-0" />
                            <input
                                placeholder="Search materials..."
                                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="text-slate-600 hover:text-white">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 border rounded-2xl transition-all ${
                                showFilters || filterSubject || filterType
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-white'
                            }`}
                        >
                            <Filter size={16} />
                        </button>
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
                            <select
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:border-indigo-500 outline-none"
                                value={filterSubject}
                                onChange={e => setFilterSubject(e.target.value)}
                            >
                                <option value="">All Subjects</option>
                                {(syllabus || []).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <select
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:border-indigo-500 outline-none"
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                            >
                                <option value="">All Types</option>
                                {contentTypes.map(t => (
                                    <option key={t} value={t}>
                                        {contentTypeConfig[t]?.label || t}
                                    </option>
                                ))}
                            </select>
                            {(filterSubject || filterType) && (
                                <button
                                    onClick={() => { setFilterSubject(''); setFilterType(''); }}
                                    className="px-3 py-2 text-rose-400 text-xs font-bold uppercase tracking-widest hover:text-rose-300"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Materials by Subject Group */}
                {loading ? (
                    <div className="text-center py-20 text-slate-600">Loading materials...</div>
                ) : Object.keys(grouped).length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen size={48} className="mx-auto mb-4 text-slate-700 opacity-30" />
                        <h3 className="text-lg font-bold text-slate-500 mb-1">No Materials Found</h3>
                        <p className="text-sm text-slate-600">
                            {search ? 'Try a different search term' : 'No study materials have been uploaded for this exam yet'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(grouped).map(([subjectName, items]) => (
                            <div key={subjectName}>
                                <div className="flex items-center gap-3 mb-4 px-1">
                                    <div className="w-6 h-6 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                        <GraduationCap size={12} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{subjectName}</h3>
                                    <span className="text-[10px] text-slate-600 font-bold">{items.length}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map(mat => {
                                        const config = contentTypeConfig[mat.content_type] || contentTypeConfig.notes;
                                        const Icon = config.icon;

                                        return (
                                            <a
                                                key={mat.id}
                                                href={mat.file_url || '#'}
                                                target={mat.file_url ? "_blank" : "_self"}
                                                rel="noopener noreferrer"
                                                className="group relative bg-[#0b1120] border border-slate-800 rounded-3xl p-6 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 flex flex-col cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 block h-full"
                                                onClick={(e) => {
                                                    if (!mat.file_url) {
                                                        e.preventDefault();
                                                        setSelectedMaterial(mat);
                                                    }
                                                }}
                                            >
                                                {/* Decorative background glow on hover */}
                                                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-${config.color}-500/10 rounded-full blur-[40px] group-hover:bg-${config.color}-500/20 transition-all duration-500`}
                                                     style={{ backgroundColor: `var(--${config.color}, rgba(99,102,241,0.05))` }} />

                                                <div className="relative z-10 flex flex-col h-full">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className={`w-12 h-12 rounded-2xl bg-${config.color}-500/10 text-${config.color}-400 flex items-center justify-center shadow-inner ring-1 ring-white/5`}
                                                             style={{
                                                                 backgroundColor: `var(--${config.color}, rgba(99,102,241,0.1))`,
                                                                 color: `var(--${config.color}, rgb(129,140,248))`
                                                             }}>
                                                            <Icon size={24} />
                                                        </div>
                                                        <span className="text-[10px] bg-slate-800/80 backdrop-blur-sm text-slate-300 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-700/50">
                                                            {config.label}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-lg font-black text-white mb-2 leading-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
                                                        {mat.title}
                                                    </h4>
                                                    
                                                    {mat.topic_name && (
                                                        <p className="text-xs text-slate-500 font-bold mb-4 line-clamp-1">
                                                            {mat.topic_name}
                                                        </p>
                                                    )}

                                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/50">
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                            {mat.file_size_bytes ? (
                                                                <span>{(mat.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                                                            ) : mat.content ? (
                                                                <span>Text Note</span>
                                                            ) : null}
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:scale-110">
                                                            {mat.file_url ? <ExternalLink size={14} /> : <FileText size={14} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Material Modal (for non-file/Text content) */}
            {selectedMaterial && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
                    <div className="bg-[#0b1121] border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 flex justify-between items-start">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-indigo-500/20">
                                        {contentTypeConfig[selectedMaterial.content_type]?.label || selectedMaterial.content_type}
                                    </span>
                                    {selectedMaterial.topic_name && (
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            {selectedMaterial.topic_name}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-white leading-tight">{selectedMaterial.title}</h3>
                            </div>
                            <button onClick={() => setSelectedMaterial(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {selectedMaterial.content ? (
                                <div className="prose prose-invert prose-slate max-w-none">
                                    <pre className="whitespace-pre-wrap text-[15px] text-slate-300 leading-relaxed font-sans bg-transparent p-0 m-0">
                                        {selectedMaterial.content}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-slate-500 font-bold">No content available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyMaterials;
