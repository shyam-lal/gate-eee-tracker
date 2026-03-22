import { useState, useEffect } from 'react';
import { exams as examsApi } from '../../services/api';
import {
    ArrowLeft, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronRight,
    BookOpen, GraduationCap, FileText, Layers, Settings, Palette,
    Upload, Eye, EyeOff, AlertTriangle, FileUp, CheckCircle, Loader2
} from 'lucide-react';

const AdminPanel = ({ user, onBack }) => {
    const [tab, setTab] = useState('exams'); // 'exams', 'materials'
    const [categories, setCategories] = useState([]);
    const [examsList, setExamsList] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [syllabus, setSyllabus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedSubjects, setExpandedSubjects] = useState({});

    // ─── Form States ───────────────────────────────
    const [showExamForm, setShowExamForm] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [examForm, setExamForm] = useState({
        name: '', slug: '', full_name: '', description: '',
        category_id: '', primary_color: '#6366f1', accent_color: '#818cf8',
        available_tools: ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics']
    });

    const [showSubjectForm, setShowSubjectForm] = useState(false);
    const [subjectForm, setSubjectForm] = useState({ name: '', weightage: '', sort_order: 0 });

    const [showTopicForm, setShowTopicForm] = useState(null); // subject ID or null
    const [topicForm, setTopicForm] = useState({ name: '', estimated_hours: 12, difficulty: 'medium' });

    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [materialForm, setMaterialForm] = useState({
        title: '', content_type: 'notes', content: '', subject_id: '', topic_id: ''
    });
    const [materials, setMaterials] = useState([]);

    // ─── Import JSON State ─────────────────────────
    const [showImportModal, setShowImportModal] = useState(false);
    const [importType, setImportType] = useState('syllabus'); // 'syllabus' or 'questions'
    const [importJson, setImportJson] = useState('');
    const [importClear, setImportClear] = useState(false);
    const [importPreview, setImportPreview] = useState(null);
    const [importError, setImportError] = useState('');
    const [importLoading, setImportLoading] = useState(false);

    // ─── Data Loading ──────────────────────────────
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cats, exs] = await Promise.all([
                examsApi.getCategories(),
                examsApi.getAll()
            ]);
            setCategories(cats);
            setExamsList(exs);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        }
        setLoading(false);
    };

    const loadSyllabus = async (examId) => {
        try {
            const data = await examsApi.getSyllabus(examId);
            setSyllabus(data);
        } catch (err) {
            console.error('Failed to load syllabus:', err);
        }
    };

    const loadMaterials = async (examId) => {
        try {
            const data = await examsApi.getMaterials(examId);
            setMaterials(data);
        } catch (err) {
            console.error('Failed to load materials:', err);
        }
    };

    const selectExam = async (exam) => {
        setSelectedExam(exam);
        await Promise.all([loadSyllabus(exam.id), loadMaterials(exam.id)]);
    };

    // ─── Exam CRUD ─────────────────────────────────
    const openExamForm = (exam = null) => {
        if (exam) {
            setEditingExam(exam);
            setExamForm({
                name: exam.name, slug: exam.slug,
                full_name: exam.full_name || '', description: exam.description || '',
                category_id: exam.category_id || '',
                primary_color: exam.primary_color || '#6366f1',
                accent_color: exam.accent_color || '#818cf8',
                available_tools: exam.available_tools || []
            });
        } else {
            setEditingExam(null);
            setExamForm({
                name: '', slug: '', full_name: '', description: '',
                category_id: categories[0]?.id || '',
                primary_color: '#6366f1', accent_color: '#818cf8',
                available_tools: ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics']
            });
        }
        setShowExamForm(true);
    };

    const saveExam = async () => {
        try {
            const data = { ...examForm };
            if (!data.slug) data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (editingExam) {
                await examsApi.admin.updateExam(editingExam.id, data);
            } else {
                await examsApi.admin.createExam(data);
            }
            setShowExamForm(false);
            await loadData();
        } catch (err) {
            alert(err.message);
        }
    };

    const deleteExam = async (examId) => {
        if (!confirm('Are you sure? This will delete the exam and ALL its data.')) return;
        try {
            await examsApi.admin.deleteExam(examId);
            if (selectedExam?.id === examId) { setSelectedExam(null); setSyllabus([]); }
            await loadData();
        } catch (err) { alert(err.message); }
    };

    // ─── Subject CRUD ──────────────────────────────
    const saveSubject = async () => {
        if (!selectedExam || !subjectForm.name.trim()) return;
        try {
            await examsApi.admin.createSubject(selectedExam.id, subjectForm);
            setShowSubjectForm(false);
            setSubjectForm({ name: '', weightage: '', sort_order: 0 });
            await loadSyllabus(selectedExam.id);
        } catch (err) { alert(err.message); }
    };

    const deleteSubject = async (subjectId) => {
        if (!confirm('Delete this subject and all its topics?')) return;
        try {
            await examsApi.admin.deleteSubject(subjectId);
            await loadSyllabus(selectedExam.id);
        } catch (err) { alert(err.message); }
    };

    // ─── Topic CRUD ────────────────────────────────
    const saveTopic = async (subjectId) => {
        if (!topicForm.name.trim()) return;
        try {
            await examsApi.admin.createTopic(subjectId, topicForm);
            setShowTopicForm(null);
            setTopicForm({ name: '', estimated_hours: 12, difficulty: 'medium' });
            await loadSyllabus(selectedExam.id);
        } catch (err) { alert(err.message); }
    };

    const deleteTopic = async (topicId) => {
        if (!confirm('Delete this topic?')) return;
        try {
            await examsApi.admin.deleteTopic(topicId);
            await loadSyllabus(selectedExam.id);
        } catch (err) { alert(err.message); }
    };

    // ─── Material CRUD ─────────────────────────────
    const saveMaterial = async () => {
        if (!selectedExam || !materialForm.title.trim()) return;
        
        try {
            setLoading(true);
            
            // If it's a file upload (PDF), we need to use FormData
            if (materialForm.content_type === 'pdf' && materialForm.file) {
                const formData = new FormData();
                formData.append('exam_id', selectedExam.id);
                formData.append('title', materialForm.title);
                formData.append('content_type', materialForm.content_type);
                if (materialForm.subject_id) formData.append('subject_id', materialForm.subject_id);
                if (materialForm.topic_id) formData.append('topic_id', materialForm.topic_id);
                formData.append('file', materialForm.file);
                
                await examsApi.admin.uploadMaterial(formData);
            } else {
                // Standard text/link material creation
                await examsApi.admin.createMaterial({
                    ...materialForm,
                    exam_id: selectedExam.id,
                    subject_id: materialForm.subject_id || null,
                    topic_id: materialForm.topic_id || null
                });
            }
            
            setShowMaterialForm(false);
            setMaterialForm({ title: '', content_type: 'notes', content: '', subject_id: '', topic_id: '', file: null });
            await loadMaterials(selectedExam.id);
        } catch (err) { 
            alert('Upload failed: ' + err.message); 
        } finally {
            setLoading(false);
        }
    };

    const deleteMaterial = async (materialId) => {
        if (!confirm('Delete this material?')) return;
        try {
            await examsApi.admin.deleteMaterial(materialId);
            await loadMaterials(selectedExam.id);
        } catch (err) { alert(err.message); }
    };

    // ─── JSON Import ──────────────────────────────
    const handleImportJsonChange = (value) => {
        setImportJson(value);
        setImportError('');
        setImportPreview(null);
        if (!value.trim()) return;
        try {
            const parsed = JSON.parse(value);
            
            if (importType === 'syllabus') {
                const subjects = parsed.subjects || parsed;
                if (!Array.isArray(subjects)) throw new Error('JSON must be an array or have a "subjects" array');
                const totalTopics = subjects.reduce((sum, s) => sum + (s.topics?.length || 0), 0);
                setImportPreview({ type: 'syllabus', subjectCount: subjects.length, topicCount: totalTopics, payload: subjects });
            } else if (importType === 'questions') {
                const questions = parsed.questions || parsed;
                if (!Array.isArray(questions)) throw new Error('JSON must be an array or have a "questions" array');
                setImportPreview({ type: 'questions', questionCount: questions.length, payload: questions });
            }
        } catch (err) {
            setImportError(err.message);
        }
    };

    const handleImport = async () => {
        if (!importPreview || !selectedExam) return;
        setImportLoading(true);
        try {
            if (importType === 'syllabus') {
                const result = await examsApi.admin.importSyllabus(selectedExam.id, importPreview.payload, importClear);
                alert(`Syllabus import complete! ${result.subjectsCreated} subjects, ${result.topicsCreated} topics created.${result.errors?.length ? `\n\nWarnings:\n${result.errors.join('\n')}` : ''}`);
                await loadSyllabus(selectedExam.id);
            } else {
                const result = await examsApi.admin.importQuestions(selectedExam.id, importPreview.payload, importClear);
                alert(`Question import complete! ${result.created} questions added.${result.errors?.length ? `\n\nFailed rows:\n${result.errors.join('\n')}` : ''}`);
            }
            
            setShowImportModal(false);
            setImportJson('');
            setImportPreview(null);
            setImportClear(false);
        } catch (err) {
            alert('Import failed: ' + err.message);
        }
        setImportLoading(false);
    };

    // ─── UI Helpers ────────────────────────────────
    const toolOptions = ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics'];

    const toggleTool = (tool) => {
        const current = examForm.available_tools || [];
        setExamForm({
            ...examForm,
            available_tools: current.includes(tool)
                ? current.filter(t => t !== tool)
                : [...current, tool]
        });
    };

    // ═══════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
            {/* Header */}
            <div className="border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <Settings size={18} className="text-indigo-400" />
                                <h1 className="text-xl font-black uppercase tracking-tighter text-white">Admin Panel</h1>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manage Exams, Syllabi & Materials</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">{user?.role || 'admin'}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* ─── Sidebar: Exam List ──────────────── */}
                    <div className="lg:w-80 shrink-0 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Exams</h2>
                            <button
                                onClick={() => openExamForm()}
                                className="text-xs bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1"
                            >
                                <Plus size={14} /> New
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-slate-500">Loading...</div>
                        ) : (
                            <div className="space-y-2">
                                {examsList.map(exam => (
                                    <div
                                        key={exam.id}
                                        onClick={() => selectExam(exam)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all group ${
                                            selectedExam?.id === exam.id
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: exam.primary_color }} />
                                                <div>
                                                    <h3 className="font-bold text-white text-sm">{exam.name}</h3>
                                                    <p className="text-[10px] text-slate-500 font-medium">{exam.category_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openExamForm(exam); }}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteExam(exam.id); }}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ─── Main Content ─────────────────────── */}
                    <div className="flex-1 min-w-0">
                        {selectedExam ? (
                            <>
                                {/* Exam Header */}
                                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedExam.primary_color + '20' }}>
                                            <GraduationCap size={20} style={{ color: selectedExam.primary_color }} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">{selectedExam.name}</h2>
                                            <p className="text-xs text-slate-500">{selectedExam.full_name}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400">{selectedExam.description}</p>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 mb-6">
                                    {['syllabus', 'materials'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTab(t)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                                tab === t
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                            }`}
                                        >
                                            {t === 'syllabus' ? <BookOpen size={14} className="inline mr-2" /> : <FileText size={14} className="inline mr-2" />}
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                {/* Syllabus Tab */}
                                {tab === 'syllabus' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                                Subjects ({syllabus.length})
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setImportType('syllabus'); setShowImportModal(true); setImportJson(''); setImportPreview(null); setImportError(''); }}
                                                    className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
                                                >
                                                    <FileUp size={14} /> Import Syllabus JSON
                                                </button>
                                                <button
                                                    onClick={() => setShowSubjectForm(true)}
                                                    className="text-xs bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1"
                                                >
                                                    <Plus size={14} /> Add Subject
                                                </button>
                                            </div>
                                        </div>

                                        {/* Add Subject Form */}
                                        {showSubjectForm && (
                                            <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 space-y-3 animate-in slide-in-from-top-2">
                                                <input
                                                    autoFocus
                                                    placeholder="Subject name (e.g. Engineering Mathematics)"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                    value={subjectForm.name}
                                                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                                />
                                                <div className="flex gap-3">
                                                    <input
                                                        placeholder="Weightage %"
                                                        type="number"
                                                        className="w-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                        value={subjectForm.weightage}
                                                        onChange={e => setSubjectForm({ ...subjectForm, weightage: e.target.value })}
                                                    />
                                                    <input
                                                        placeholder="Sort order"
                                                        type="number"
                                                        className="w-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                        value={subjectForm.sort_order}
                                                        onChange={e => setSubjectForm({ ...subjectForm, sort_order: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowSubjectForm(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancel</button>
                                                    <button onClick={saveSubject} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Subject</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Subject List */}
                                        {syllabus.map(subject => (
                                            <div key={subject.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                                                <div
                                                    onClick={() => setExpandedSubjects(p => ({ ...p, [subject.id]: !p[subject.id] }))}
                                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {expandedSubjects[subject.id] ? <ChevronDown size={16} className="text-indigo-400" /> : <ChevronRight size={16} className="text-slate-500" />}
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">{subject.name}</h4>
                                                            <p className="text-[10px] text-slate-500">
                                                                {subject.topics?.length || 0} topics
                                                                {subject.weightage ? ` • ${subject.weightage}% weight` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setShowTopicForm(showTopicForm === subject.id ? null : subject.id); }}
                                                            className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                                                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {expandedSubjects[subject.id] && (
                                                    <div className="border-t border-slate-800">
                                                        {/* Add Topic Form */}
                                                        {showTopicForm === subject.id && (
                                                            <div className="p-4 bg-slate-950/50 border-b border-slate-800 space-y-3 animate-in slide-in-from-top-2">
                                                                <input
                                                                    autoFocus
                                                                    placeholder="Topic name"
                                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                                    value={topicForm.name}
                                                                    onChange={e => setTopicForm({ ...topicForm, name: e.target.value })}
                                                                />
                                                                <div className="flex gap-3">
                                                                    <input
                                                                        placeholder="Est. hours"
                                                                        type="number"
                                                                        className="w-28 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                                        value={topicForm.estimated_hours}
                                                                        onChange={e => setTopicForm({ ...topicForm, estimated_hours: parseFloat(e.target.value) || 12 })}
                                                                    />
                                                                    <select
                                                                        className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                                        value={topicForm.difficulty}
                                                                        onChange={e => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                                                                    >
                                                                        <option value="easy">Easy</option>
                                                                        <option value="medium">Medium</option>
                                                                        <option value="hard">Hard</option>
                                                                    </select>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => setShowTopicForm(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancel</button>
                                                                    <button onClick={() => saveTopic(subject.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Add Topic</button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Topic List */}
                                                        <div className="divide-y divide-slate-800/50">
                                                            {(subject.topics || []).map(topic => (
                                                                <div key={topic.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                                                        <div>
                                                                            <p className="text-sm text-slate-300">{topic.name}</p>
                                                                            <p className="text-[10px] text-slate-600">{topic.estimated_hours}h • {topic.difficulty}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => deleteTopic(topic.id)}
                                                                        className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-slate-800 opacity-0 hover:opacity-100 transition-all"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {(!subject.topics || subject.topics.length === 0) && (
                                                                <div className="px-4 py-6 text-center text-slate-600 text-xs">No topics yet</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {syllabus.length === 0 && (
                                            <div className="text-center py-12 text-slate-600">
                                                <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                                                <p className="text-sm font-bold">No subjects yet</p>
                                                <p className="text-xs">Add subjects and topics to define this exam's syllabus</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Materials Tab */}
                                {tab === 'materials' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                                Study Materials ({materials.length})
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setImportType('questions'); setShowImportModal(true); setImportJson(''); setImportPreview(null); setImportError(''); }}
                                                    className="text-xs bg-amber-500/10 text-amber-400 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1"
                                                >
                                                    <FileUp size={14} /> Import Question Bank
                                                </button>
                                                <button
                                                    onClick={() => setShowMaterialForm(true)}
                                                    className="text-xs bg-indigo-500/10 text-indigo-400 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1"
                                                >
                                                    <Plus size={14} /> Add Material
                                                </button>
                                            </div>
                                        </div>

                                        {/* Add Material Form */}
                                        {showMaterialForm && (
                                            <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 space-y-3 animate-in slide-in-from-top-2">
                                                <input
                                                    autoFocus
                                                    placeholder="Material title"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                    value={materialForm.title}
                                                    onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })}
                                                />
                                                <div className="flex gap-3">
                                                    <select
                                                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                        value={materialForm.content_type}
                                                        onChange={e => setMaterialForm({ ...materialForm, content_type: e.target.value })}
                                                    >
                                                        <option value="notes">Notes</option>
                                                        <option value="pdf">PDF Upload (R2/Drive)</option>
                                                        <option value="drive_link">Google Drive Link</option>
                                                        <option value="video_link">Video Link</option>
                                                        <option value="formula_sheet">Formula Sheet</option>
                                                    </select>
                                                    <select
                                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                        value={materialForm.subject_id}
                                                        onChange={e => setMaterialForm({ ...materialForm, subject_id: e.target.value, topic_id: '' })}
                                                    >
                                                        <option value="">All Subjects</option>
                                                        {syllabus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                                
                                                {materialForm.content_type === 'pdf' ? (
                                                    <div className="border-2 border-dashed border-slate-700/50 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center transition-colors">
                                                        <Upload className="text-slate-500 mb-2" size={24} />
                                                        <label className="cursor-pointer text-sm font-bold text-indigo-400 hover:text-indigo-300">
                                                            {materialForm.file ? materialForm.file.name : "Select PDF File"}
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                accept="application/pdf,image/*"
                                                                onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files[0] })}
                                                            />
                                                        </label>
                                                        <p className="text-[10px] text-slate-500 mt-1">Up to 50MB</p>
                                                    </div>
                                                ) : materialForm.content_type === 'drive_link' || materialForm.content_type === 'video_link' ? (
                                                    <input
                                                        placeholder="Paste the URL here"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                                        value={materialForm.file_url || ''}
                                                        onChange={e => setMaterialForm({ ...materialForm, file_url: e.target.value })}
                                                    />
                                                ) : (
                                                    <textarea
                                                        placeholder="Content (markdown supported for notes)"
                                                        rows={4}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none resize-y"
                                                        value={materialForm.content}
                                                        onChange={e => setMaterialForm({ ...materialForm, content: e.target.value })}
                                                    />
                                                )}

                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowMaterialForm(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">Cancel</button>
                                                    <button 
                                                        onClick={saveMaterial} 
                                                        disabled={loading}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                                                    >
                                                        {loading ? 'Uploading...' : 'Save Material'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Materials List */}
                                        {materials.map(mat => (
                                            <div key={mat.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${
                                                        mat.content_type === 'pdf' ? 'bg-rose-500/10 text-rose-400' :
                                                        mat.content_type === 'video_link' ? 'bg-purple-500/10 text-purple-400' :
                                                        mat.content_type === 'formula_sheet' ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-indigo-500/10 text-indigo-400'
                                                    }`}>
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white">{mat.title}</h4>
                                                        <p className="text-[10px] text-slate-500">
                                                            {mat.content_type.replace('_', ' ')}
                                                            {mat.subject_name ? ` • ${mat.subject_name}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteMaterial(mat.id)}
                                                    className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {materials.length === 0 && (
                                            <div className="text-center py-12 text-slate-600">
                                                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                                                <p className="text-sm font-bold">No materials yet</p>
                                                <p className="text-xs">Upload study materials for students to access</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 text-slate-600">
                                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-bold mb-1">Select an Exam</p>
                                <p className="text-sm">Choose an exam from the sidebar to manage its syllabus and materials</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Exam Form Modal ──────────────────── */}
            {showExamForm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowExamForm(false)}>
                    <div className="bg-[#0b1121] border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-white font-black uppercase tracking-tighter text-lg">
                                {editingExam ? 'Edit Exam' : 'New Exam'}
                            </h3>
                            <button onClick={() => setShowExamForm(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Name</label>
                                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                    value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} placeholder="e.g. GATE ME" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
                                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                    value={examForm.full_name} onChange={e => setExamForm({ ...examForm, full_name: e.target.value })} placeholder="Full descriptive name" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Category</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                    value={examForm.category_id} onChange={e => setExamForm({ ...examForm, category_id: parseInt(e.target.value) })}>
                                    <option value="">Select category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Description</label>
                                <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none resize-y" rows={2}
                                    value={examForm.description} onChange={e => setExamForm({ ...examForm, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Primary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={examForm.primary_color} onChange={e => setExamForm({ ...examForm, primary_color: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                                        <input className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                                            value={examForm.primary_color} onChange={e => setExamForm({ ...examForm, primary_color: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Accent Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={examForm.accent_color} onChange={e => setExamForm({ ...examForm, accent_color: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                                        <input className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                                            value={examForm.accent_color} onChange={e => setExamForm({ ...examForm, accent_color: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Available Tools</label>
                                <div className="flex flex-wrap gap-2">
                                    {toolOptions.map(tool => (
                                        <button
                                            key={tool}
                                            onClick={() => toggleTool(tool)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                                                (examForm.available_tools || []).includes(tool)
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-slate-800 text-slate-500 hover:text-white'
                                            }`}
                                        >
                                            {tool}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowExamForm(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm">Cancel</button>
                                <button onClick={saveExam} className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors">
                                    {editingExam ? 'Update Exam' : 'Create Exam'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Import JSON Modal ─────────────────── */}
            {showImportModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowImportModal(false)}>
                    <div className="bg-[#0b1121] border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-black uppercase tracking-tighter text-lg">
                                    Import {importType === 'syllabus' ? 'Syllabus' : 'Questions'} from JSON
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Paste JSON generated from ChatGPT / Gemini</p>
                            </div>
                            <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
                            {/* Instructions */}
                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 text-xs text-slate-400 space-y-1">
                                <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-2">Expected Format:</p>
                                <pre className="text-[11px] text-slate-500 font-mono overflow-x-auto">
{importType === 'syllabus' ? `{
  "subjects": [
    {
      "name": "Electric Circuits",
      "weightage": 10,
      "topics": [
        { "name": "KCL and KVL", "estimated_hours": 8, "difficulty": "easy" }
      ]
    }
  ]
}` : `{
  "questions": [
    {
      "question_text": "The DC gain of G(s) = 10/(s²+3s+2) is ___",
      "question_type": "nat",
      "options": null,
      "correct": {"value": 5, "tolerance": 0.1},
      "explanation": "G(0) = 10/2 = 5",
      "year": 2024,
      "marks": 2,
      "negative": 0,
      "difficulty": "medium",
      "tags": ["control-systems"]
    }
  ]
}`}
                                </pre>
                            </div>

                            {/* JSON Input */}
                            <textarea
                                autoFocus
                                rows={10}
                                placeholder='Paste your JSON here...'
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white font-mono focus:border-indigo-500 outline-none resize-y"
                                value={importJson}
                                onChange={e => handleImportJsonChange(e.target.value)}
                            />

                            {/* Error */}
                            {importError && (
                                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 font-bold flex items-center gap-2">
                                    <AlertTriangle size={14} /> {importError}
                                </div>
                            )}

                            {/* Preview */}
                            {importPreview && (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                                        <CheckCircle size={14} /> Valid JSON
                                    </div>
                                    <p className="text-sm text-white font-bold">
                                        {importPreview.type === 'syllabus' 
                                            ? `${importPreview.subjectCount} subjects, ${importPreview.topicCount} topics`
                                            : `${importPreview.questionCount} questions found`
                                        }
                                    </p>
                                    
                                    {importPreview.type === 'syllabus' && (
                                        <div className="flex flex-wrap gap-2">
                                            {importPreview.payload.map((s, i) => (
                                                <span key={i} className="bg-slate-800 text-slate-300 px-2 py-1 rounded-lg text-[10px] font-bold">
                                                    {s.name} ({s.topics?.length || 0})
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Options */}
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                <input
                                    type="checkbox"
                                    checked={importClear}
                                    onChange={e => setImportClear(e.target.checked)}
                                    className="w-4 h-4 rounded accent-rose-500"
                                />
                                <div>
                                    <span className="text-sm text-white font-bold">
                                        {importType === 'syllabus' ? 'Replace existing syllabus' : 'Replace existing questions'}
                                    </span>
                                    <p className="text-[10px] text-slate-500">
                                        {importType === 'syllabus' 
                                            ? 'Deletes all current subjects and topics before importing'
                                            : 'Deletes all existing questions for this exam before importing'}
                                    </p>
                                </div>
                            </label>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowImportModal(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm">Cancel</button>
                                <button
                                    onClick={handleImport}
                                    disabled={!importPreview || importLoading}
                                    className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {importLoading ? <><Loader2 size={16} className="animate-spin" /> Importing...</> : <><FileUp size={16} /> Import {importType === 'syllabus' ? 'Syllabus' : 'Questions'}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
