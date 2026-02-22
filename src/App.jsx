import { useState, useEffect } from 'react';
import { syllabus as syllabusApi, auth as authApi } from './services/api';
import Auth from './components/Auth';
import {
  Calendar as CalendarIcon, Trash2, Plus, X,
  ChevronDown, ChevronRight, Clock, Edit3,
  CalendarRange, AlertTriangle,
  Play, Pause, RotateCcw, Brain,
  Maximize2, Minus, CheckCircle, Flame, BarChart3, Map,
  MoreVertical, Timer, PartyPopper, PenTool, Save, LogIn
} from 'lucide-react';

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  // --- APP STATE ---
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetDate, setTargetDate] = useState(() => localStorage.getItem('gateTargetDate') || "");
  const [expanded, setExpanded] = useState({});

  // --- UI STATES ---
  const [loggingTopic, setLoggingTopic] = useState(null);
  const [celebration, setCelebration] = useState(null);

  // --- EDITOR MODAL STATE ---
  // If editingId is 'new', we are creating. If it's a number, we are editing that subject.
  const [editingId, setEditingId] = useState(null);
  const [editorData, setEditorData] = useState({
    name: "",
    topics: [{ name: "", estimate: "12h", timeSpent: 0, id: null }]
  });

  // --- FOCUS MODE STATE ---
  const [focusMode, setFocusMode] = useState('hidden');
  const [dailyFocusMinutes, setDailyFocusMinutes] = useState(() => {
    try {
      const today = new Date().toDateString();
      const saved = JSON.parse(localStorage.getItem('gateDailyFocus') || '{}');
      return saved.date === today ? saved.minutes : 0;
    } catch { return 0; }
  });

  // --- HELPERS ---
  const formatTime = (minutes) => {
    if (!minutes || isNaN(minutes)) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let res = "";
    if (h > 0) res += `${h}h `;
    if (m > 0 || h === 0) res += `${m}m`;
    return res.trim();
  };

  const parseFormalTime = (input) => {
    if (!input) return 0;
    if (typeof input === 'number') return input;
    const clean = input.toString().toLowerCase().trim();
    if (/^\d+$/.test(clean)) return parseInt(clean, 10);

    let totalMinutes = 0;
    const hoursMatch = clean.match(/(\d+)\s*h/i);
    const minsMatch = clean.match(/(\d+)\s*m/i);
    const secsMatch = clean.match(/(\d+)\s*s/i);

    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
    if (minsMatch) totalMinutes += parseInt(minsMatch[1], 10);
    if (secsMatch && parseInt(secsMatch[1], 10) > 30) totalMinutes += 1;

    return totalMinutes || parseInt(clean, 10) || 0;
  };

  // --- DATA FETCHING ---
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await syllabusApi.get();
      const formatted = data.map(sub => ({
        ...sub,
        manualTime: sub.manual_time_minutes || 0,
        topics: sub.topics.map(t => ({
          id: t.id,
          name: t.name,
          time: t.estimated_minutes,
          timeSpent: t.logged_minutes,
          isCompleted: t.is_completed
        }))
      }));
      setSyllabus(formatted);
    } catch (err) {
      console.error("Failed to load syllabus", err);
      if (err.message?.includes('401')) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const triggerCelebration = (type) => {
    setCelebration(type);
    setTimeout(() => setCelebration(null), 3000);
  };

  // --- ACTIONS ---
  const handleLogTopicTime = async (topicId, minutesToAdd) => {
    if (!minutesToAdd) return;
    try {
      await syllabusApi.logTime({ topicId, minutes: minutesToAdd });
      await loadData();
      setDailyFocusMinutes(d => d + minutesToAdd);
      triggerCelebration('topic');

      // Update local editor state if modal is open
      if (editingId) {
        setEditorData(prev => ({
          ...prev,
          topics: prev.topics.map(t => t.id === topicId ? { ...t, timeSpent: (t.timeSpent || 0) + minutesToAdd } : t)
        }));
      }
    } catch (err) { alert("Failed to log time: " + err.message); }
  };

  const openEditor = (subject = null) => {
    if (subject) {
      setEditingId(subject.id);
      setEditorData({
        name: subject.name,
        topics: subject.topics.map(t => ({
          id: t.id,
          name: t.name,
          estimate: formatTime(t.time),
          timeSpent: t.timeSpent || 0
        }))
      });
    } else {
      setEditingId('new');
      setEditorData({
        name: "",
        topics: [{ name: "", estimate: "12h", timeSpent: 0, id: null }]
      });
    }
  };

  const saveSubject = async (e) => {
    if (e) e.preventDefault();
    if (!editorData.name.trim()) return;
    setLoading(true);
    try {
      if (editingId === 'new') {
        const sub = await syllabusApi.createSubject(editorData.name);
        for (const t of editorData.topics) {
          if (t.name.trim()) {
            await syllabusApi.createTopic(sub.id, t.name, parseFormalTime(t.estimate));
          }
        }
      } else {
        // Update subject name
        await syllabusApi.updateSubject(editingId, editorData.name);
        // Handle topics: existing topics are updated via handleManualTopicUpdate or deleted.
        // New topics (id === null) are created here.
        for (const t of editorData.topics) {
          if (t.name.trim() && !t.id) {
            await syllabusApi.createTopic(editingId, t.name, parseFormalTime(t.estimate));
          }
        }
      }
      await loadData();
      setEditingId(null);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handleManualTopicUpdate = async (topicId, field, value) => {
    if (!topicId) return;
    try {
      const updates = {};
      if (field === 'name') updates.name = value;
      if (field === 'estimate') updates.estimated_minutes = parseFormalTime(value);
      await syllabusApi.updateTopic(topicId, updates);
      // Don't reload full data for smooth typing, or reload after blur
    } catch (e) { console.error(e); }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}"? This syllabus data will be lost.`)) return;
    setLoading(true);
    try {
      await syllabusApi.deleteSubject(subjectId);
      await loadData();
      if (editingId === subjectId) setEditingId(null);
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId, topicName) => {
    if (!confirm(`Delete subtask "${topicName}"?`)) return;
    try {
      await syllabusApi.deleteTopic(topicId);

      // Update local state if in editor
      if (editingId) {
        setEditorData(prev => ({
          ...prev,
          topics: prev.topics.filter(t => t.id !== topicId)
        }));
      }
      loadData();
    } catch (e) { alert("Delete failed"); }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- RENDER HELPERS ---
  const renderCalendar = () => {
    const curr = new Date();
    return (
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-3xl flex flex-col gap-3 h-full shadow-inner">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CalendarIcon size={14} /> {curr.toLocaleString('default', { month: 'long' })} {curr.getFullYear()}</h3>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-center text-slate-600/60">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="h-6 flex items-center justify-center">{d}</div>)}
          {Array.from({ length: new Date(curr.getFullYear(), curr.getMonth(), 1).getDay() }).map((_, i) => <div key={i} className="h-6 sm:h-7" />)}
          {Array.from({ length: new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate() }).map((_, i) => {
            const d = i + 1; const isToday = d === curr.getDate();
            return <div key={d} className={`h-6 w-full sm:h-7 flex items-center justify-center rounded-lg ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black' : 'text-slate-400 font-medium'}`}>{d}</div>
          })}
        </div>
      </div>
    );
  };

  // --- CALCULATIONS ---
  const totalEstimatedMins = syllabus.reduce((acc, sub) => acc + sub.topics.reduce((tAcc, t) => tAcc + (t.time || 0), 0), 0);
  const totalStudyTime = syllabus.reduce((acc, sub) => acc + sub.topics.reduce((tAcc, t) => tAcc + (t.timeSpent || 0), 0) + (sub.manualTime || 0), 0);
  const progressPercentage = totalEstimatedMins === 0 ? 0 : Math.min(100, Math.round((totalStudyTime / totalEstimatedMins) * 100));

  if (!user) return <Auth onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-4 md:p-8 pb-32 selection:bg-indigo-500/30">

      {celebration === 'topic' && (
        <div className="fixed inset-0 pointer-events-none z-[250] flex items-center justify-center animate-in zoom-in-50 duration-300">
          <div className="bg-slate-900/90 backdrop-blur border border-indigo-500/50 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <PartyPopper size={64} className="text-yellow-400 animate-bounce" />
            <h2 className="text-2xl font-black text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-tighter">Time Synced!</h2>
          </div>
        </div>
      )}

      {/* GLOBAL HUB EDITOR (Create / Edit Subject) */}
      {editingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0b1121] border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  {editingId === 'new' ? <Plus size={20} /> : <Edit3 size={20} />}
                </div>
                <h3 className="text-white font-black uppercase tracking-tighter text-lg sm:text-xl">
                  {editingId === 'new' ? "New Subject Subject Pack" : "Syllabus Hub Editor"}
                </h3>
              </div>
              <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={saveSubject} className="p-6 md:p-8 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
              {/* Subject Title */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Subject Name</label>
                  {editingId !== 'new' && (
                    <button type="button" onClick={() => handleDeleteSubject(editingId, editorData.name)} className="text-[10px] text-rose-500/50 hover:text-rose-500 font-bold uppercase tracking-widest transition-colors flex items-center gap-1"><Trash2 size={12} /> Delete Subject</button>
                  )}
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Electrical Machines"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-5 text-lg md:text-xl font-bold text-white placeholder-slate-700 focus:border-indigo-500 outline-none transition-all shadow-inner"
                  value={editorData.name}
                  onChange={e => setEditorData({ ...editorData, name: e.target.value })}
                  required
                />
              </div>

              {/* Subtasks / Topics Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Syllabus Breakdown</label>
                  <button
                    type="button"
                    onClick={() => setEditorData({ ...editorData, topics: [...editorData.topics, { name: "", estimate: "12h", timeSpent: 0, id: null }] })}
                    className="text-[10px] bg-indigo-500/10 text-indigo-400 font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
                  ><Plus size={14} /> Add Topic</button>
                </div>

                <div className="space-y-3">
                  {editorData.topics.map((topic, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/30 animate-in slide-in-from-left-2 transition-all">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Name Input */}
                        <input
                          type="text"
                          placeholder="Topic name"
                          className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                          value={topic.name}
                          onChange={e => {
                            const updated = [...editorData.topics];
                            updated[idx].name = e.target.value;
                            setEditorData({ ...editorData, topics: updated });
                          }}
                          onBlur={e => handleManualTopicUpdate(topic.id, 'name', e.target.value)}
                        />
                        <div className="flex gap-2">
                          {/* Estimate Input */}
                          <div className="w-24">
                            <input
                              type="text"
                              placeholder="12h"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-center text-indigo-400 font-mono font-bold focus:border-indigo-500 outline-none"
                              value={topic.estimate}
                              onChange={e => {
                                const updated = [...editorData.topics];
                                updated[idx].estimate = e.target.value;
                                setEditorData({ ...editorData, topics: updated });
                              }}
                              onBlur={e => handleManualTopicUpdate(topic.id, 'estimate', e.target.value)}
                            />
                          </div>
                          {/* Delete Topic */}
                          <button
                            type="button"
                            disabled={editorData.topics.length === 1}
                            onClick={() => {
                              if (topic.id) handleDeleteTopic(topic.id, topic.name);
                              else {
                                const updated = editorData.topics.filter((_, i) => i !== idx);
                                setEditorData({ ...editorData, topics: updated });
                              }
                            }}
                            className="p-3 text-slate-600 hover:text-rose-500 disabled:opacity-0 transition-colors"
                          ><Trash2 size={18} /></button>
                        </div>
                      </div>

                      {/* Log Time Row (Only for existing topics) */}
                      {topic.id && (
                        <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Progress</span>
                              <span className="text-[10px] font-mono text-indigo-400 font-bold">{formatTime(topic.timeSpent)} Logged</span>
                            </div>
                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (topic.timeSpent / parseFormalTime(topic.estimate)) * 100)}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              id={`log-hub-${topic.id}`}
                              placeholder="+ Time"
                              className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-center text-white focus:border-indigo-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = document.getElementById(`log-hub-${topic.id}`).value;
                                handleLogTopicTime(topic.id, parseFormalTime(val));
                                document.getElementById(`log-hub-${topic.id}`).value = '';
                              }}
                              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
                            ><LogIn size={14} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm / Final Save */}
              <div className="pt-4 sticky bottom-0 bg-[#0b1121] pb-2">
                <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 md:py-5 rounded-2xl font-black text-base md:text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Save size={20} />}
                  {editingId === 'new' ? "Create Subject Pack" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 border-b border-slate-900 pb-8">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">GATE <span className="text-indigo-500">2027</span> VAULT</h1>
            <p className="text-slate-500 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase italic">Engineer: {user.username} • SYNCED</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={logout} className="text-slate-600 hover:text-white text-[10px] font-black uppercase transition-colors tracking-widest border border-slate-800 px-4 py-3 sm:py-2 rounded-xl">Logout</button>
            <button onClick={() => openEditor()} className="bg-white text-black px-8 py-4 rounded-xl sm:rounded-2xl flex items-center justify-center sm:justify-start gap-3 font-black transition-all hover:bg-indigo-500 hover:text-white shadow-xl shadow-white/5 uppercase tracking-tighter"><Plus size={20} /> NEW SUBJECT</button>
          </div>
        </header>

        {/* SUMMARY TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="w-full">{renderCalendar()}</div>
          <div className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-3xl flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity"><Flame size={120} /></div>
            <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500"><Flame size={32} fill="currentColor" /></div>
            <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Efficiency</p><h2 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tighter">PREMIUM</h2></div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-3xl flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity"><BarChart3 size={120} /></div>
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400"><BarChart3 size={32} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Study Hours</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tighter">{formatTime(totalStudyTime)}</h2>
              <div className="flex items-center gap-2 mt-3">
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${progressPercentage}%` }} /></div>
                <span className="text-[10px] text-slate-600 font-black min-w-max">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SYLLABUS GRID */}
        {loading && !syllabus.length && <div className="text-center py-20 text-slate-600 font-black uppercase tracking-widest animate-pulse text-xs">Synchronizing Syllabus...</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {syllabus.map((sub) => {
            const subTotalTime = sub.topics.reduce((acc, t) => acc + (t.time || 0), 0);
            const subSpentTime = sub.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
            const subProgress = subTotalTime === 0 ? 0 : Math.round((subSpentTime / subTotalTime) * 100);
            const isOpen = expanded[sub.id];

            return (
              <div key={sub.id} className={`bg-slate-900 border ${subProgress >= 100 ? 'border-emerald-500/30' : 'border-slate-800/50'} rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 transition-all hover:bg-[#0c1225] hover:border-indigo-500/40 relative group shadow-sm flex flex-col`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="cursor-pointer select-none flex-1 pr-2" onClick={() => toggleExpand(sub.id)}>
                    <h3 className="font-black uppercase text-sm sm:text-base leading-tight tracking-tighter group-hover:text-indigo-400 transition-colors">{sub.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditor(sub)} className="p-1.5 text-slate-700 hover:text-white transition-colors"><Edit3 size={16} /></button>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>{formatTime(subSpentTime)} / {formatTime(subTotalTime)}</span>
                  <span className={subProgress >= 100 ? 'text-emerald-400' : 'text-indigo-400'}>{subProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden mb-6 cursor-pointer" onClick={() => toggleExpand(sub.id)}>
                  <div className={`h-full ${subProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'} transition-all duration-1000`} style={{ width: `${subProgress}%` }} />
                </div>

                <div className={`expand-container ${isOpen ? 'open' : ''}`}>
                  <div className="expand-content">
                    <div className="space-y-2 pt-2">
                      {sub.topics.map((t, tIdx) => {
                        const tp = t.time > 0 ? (t.timeSpent / t.time) * 100 : 0;
                        return (
                          <div key={tIdx} className="group/topic bg-slate-950/40 border border-slate-800/30 rounded-xl p-3 sm:p-4 cursor-pointer hover:border-indigo-500/20 active:scale-[0.98] transition-all" onClick={() => setLoggingTopic({ subId: sub.id, topicName: t.name, currentSpent: t.timeSpent, topicId: t.id })}>
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <span className={`text-[11px] sm:text-xs font-bold leading-tight flex-1 ${tp >= 100 ? 'text-emerald-400 opacity-60' : 'text-slate-300'}`}>{t.name}</span>
                              <div className="flex items-center gap-1.5 min-w-max">
                                <span className="text-[9px] sm:text-[10px] font-mono text-slate-600 font-black">{formatTime(t.timeSpent)}</span>
                                <Plus size={10} className="text-slate-700 group-hover/topic:text-indigo-500" />
                              </div>
                            </div>
                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div className={`h-full ${tp >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'} transition-all duration-500`} style={{ width: `${Math.min(100, tp)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                      <button onClick={() => openEditor(sub)} className="w-full py-3 sm:py-4 border-2 border-dashed border-slate-800/50 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-2 font-black">+ Update Syllabus</button>
                    </div>
                  </div>
                </div>

                {!isOpen && sub.topics.length > 0 && <div className="text-center py-2 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer text-slate-700 hover:text-indigo-500" onClick={() => toggleExpand(sub.id)}><ChevronDown size={14} className="mx-auto" /></div>}
              </div>
            );
          })}

          <button onClick={() => openEditor()} className="border-2 border-dashed border-slate-800/50 rounded-2xl sm:rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-700 hover:text-indigo-500 hover:border-indigo-500/30 transition-all group h-full min-h-[220px]">
            <div className="p-4 bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform"><Plus size={32} /></div>
            <span className="font-black uppercase tracking-widest text-[9px] sm:text-[10px]">Add New Subject</span>
          </button>
        </div>
      </div>

      {/* QUICK LOG MODAL (Legacy/Short version) */}
      {loggingTopic && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setLoggingTopic(null)}>
          <div className="bg-[#0b1121] border border-slate-700 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight flex items-center gap-2"><Clock size={20} className="text-indigo-400" /> Log Time</h3>
            <div className="mb-6 space-y-1 text-center sm:text-left">
              <p className="text-indigo-400 font-black text-lg leading-tight uppercase tracking-tighter">{loggingTopic.topicName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Currently: {formatTime(loggingTopic.currentSpent)}</p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  id="quick-log-input"
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 text-white text-lg font-mono focus:border-indigo-500 outline-none transition-all shadow-inner"
                  placeholder="e.g. 1h 30m"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const val = document.getElementById('quick-log-input').value;
                    handleLogTopicTime(loggingTopic.topicId, parseFormalTime(val));
                    setLoggingTopic(null);
                  }}
                  className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/10"
                >Log Work</button>
              </div>
              <p className="text-[9px] text-slate-600 font-medium italic text-center text-balance">Format: '1h 20m' or '90' minutes.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;