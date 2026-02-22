import { useState, useEffect } from 'react';
import { syllabus as syllabusApi, auth as authApi } from './services/api';
import Auth from './components/Auth';
import {
  Calendar as CalendarIcon, Trash2, Plus, X,
  ChevronDown, ChevronRight, Clock, Edit3,
  CalendarRange, AlertTriangle,
  Play, Pause, RotateCcw, Brain,
  Maximize2, Minus, CheckCircle, Flame, BarChart3, Map,
  MoreVertical, Timer, PartyPopper, PenTool
} from 'lucide-react';

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  // --- APP STATE ---
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState({});
  const [targetDate, setTargetDate] = useState(() => localStorage.getItem('gateTargetDate') || "");
  const [expanded, setExpanded] = useState({});

  // --- UI STATES ---
  const [subjectDetailsId, setSubjectDetailsId] = useState(null);
  const [loggingTopic, setLoggingTopic] = useState(null);
  const [celebration, setCelebration] = useState(null);

  // --- MODAL STATES ---
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(null);
  const [newSubjectData, setNewSubjectData] = useState({
    name: "",
    topics: [{ name: "", estimate: "12h" }]
  });
  const [newTopicData, setNewTopicData] = useState({ name: "", estimate: "12h" });

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
    const secsMatch = clean.match(/(\d+)\s*s/i); // Users might add seconds, we'll round up if substantial

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

      const newCompleted = {};
      formatted.forEach(sub => {
        sub.topics.forEach(t => {
          if (t.timeSpent >= t.time && t.time > 0) newCompleted[`${sub.id}-${t.name}`] = true;
        });
      });
      setCompleted(newCompleted);
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
  const handleLogTopicTime = async (subId, topicName, minutesToAdd) => {
    if (!minutesToAdd) return;
    const sub = syllabus.find(s => s.id === subId);
    const topic = sub?.topics.find(t => t.name === topicName);
    if (!topic) return;

    try {
      await syllabusApi.logTime({ topicId: topic.id, minutes: minutesToAdd });
      await loadData();
      setDailyFocusMinutes(d => d + minutesToAdd);
      setLoggingTopic(null);
      triggerCelebration('topic');
    } catch (err) { alert("Failed to log time: " + err.message); }
  };

  const handleCreateSubject = async (e) => {
    if (e) e.preventDefault();
    if (!newSubjectData.name.trim()) return;
    setLoading(true);
    try {
      const sub = await syllabusApi.createSubject(newSubjectData.name);
      for (const t of newSubjectData.topics) {
        if (t.name.trim()) {
          await syllabusApi.createTopic(sub.id, t.name, parseFormalTime(t.estimate));
        }
      }
      await loadData();
      setShowCreateSubject(false);
      setNewSubjectData({ name: "", topics: [{ name: "", estimate: "12h" }] });
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handleAddTopic = async (e) => {
    if (e) e.preventDefault();
    if (!newTopicData.name.trim() || !showCreateTopic) return;
    setLoading(true);
    try {
      await syllabusApi.createTopic(showCreateTopic, newTopicData.name, parseFormalTime(newTopicData.estimate));
      await loadData();
      setShowCreateTopic(null);
      setNewTopicData({ name: "", estimate: "12h" });
    } catch (e) { alert("Create failed: " + e.message); }
    finally { setLoading(false); }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}" and all its topics? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await syllabusApi.deleteSubject(subjectId);
      await loadData();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (subjectId, topicName) => {
    const sub = syllabus.find(s => s.id === subjectId);
    const topic = sub?.topics.find(t => t.name === topicName);
    if (!topic || !confirm(`Delete "${topicName}"?`)) return;
    try {
      await syllabusApi.deleteTopic(topic.id);
      loadData();
    } catch (e) { alert("Delete failed"); }
  };

  const handleRenameTopic = async (subjectId, oldName) => {
    const sub = syllabus.find(s => s.id === subjectId);
    const topic = sub?.topics.find(t => t.name === oldName);
    if (!topic) return;
    const newName = prompt("Rename:", oldName);
    if (newName) {
      try { await syllabusApi.updateTopic(topic.id, { name: newName }); loadData(); } catch (e) { alert("Rename failed"); }
    }
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
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center animate-in zoom-in-50 duration-300">
          <div className="bg-slate-900/90 backdrop-blur border border-indigo-500/50 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <PartyPopper size={64} className="text-yellow-400 animate-bounce" />
            <h2 className="text-2xl font-black text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-tighter">Progress Logged!</h2>
          </div>
        </div>
      )}

      {/* LOG TIME MODAL */}
      {loggingTopic && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setLoggingTopic(null)}>
          <div className="bg-[#0b1121] border border-slate-700 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight flex items-center gap-2"><Clock size={20} className="text-indigo-400" /> Work Log</h3>
            <div className="mb-6 space-y-1 text-center sm:text-left">
              <p className="text-indigo-400 font-black text-lg leading-tight uppercase tracking-tighter">{loggingTopic.topicName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Logged: {formatTime(loggingTopic.currentSpent)}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block pb-1">Time Spent</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    id="log-time-input"
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 text-white text-lg font-mono focus:border-indigo-500 outline-none transition-all shadow-inner"
                    placeholder="e.g. 1h 30m"
                    autoFocus
                  />
                  <button
                    onClick={() => handleLogTopicTime(loggingTopic.subId, loggingTopic.topicName, parseFormalTime(document.getElementById('log-time-input').value))}
                    className="bg-indigo-600 text-white px-6 py-4 sm:py-0 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/10"
                  >Log</button>
                </div>
              </div>
              <p className="text-[9px] text-slate-600 font-medium italic text-center">Format: '1h 20m' or '90' minutes.</p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUBJECT MODAL (Advanced Ticket) */}
      {showCreateSubject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0b1121] border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="hidden sm:block p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><PenTool size={20} /></div>
                <h3 className="text-white font-black uppercase tracking-tighter text-lg sm:text-xl">Create Roadmap Ticket</h3>
              </div>
              <button onClick={() => setShowCreateSubject(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-6 md:p-8 space-y-6 md:space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Subject Title</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Control Systems"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-5 text-lg md:text-xl font-bold placeholder-slate-700 focus:border-indigo-500 outline-none transition-all shadow-inner"
                  value={newSubjectData.name}
                  onChange={e => setNewSubjectData({ ...newSubjectData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Topic Breakdown</label>
                  <button
                    type="button"
                    onClick={() => setNewSubjectData({ ...newSubjectData, topics: [...newSubjectData.topics, { name: "", estimate: "12h" }] })}
                    className="text-[10px] bg-indigo-500/10 text-indigo-400 font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
                  ><Plus size={14} /> Add</button>
                </div>

                <div className="space-y-3">
                  {newSubjectData.topics.map((topic, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 animate-in slide-in-from-left-2 transition-all p-3 bg-slate-900/40 rounded-2xl sm:bg-transparent sm:p-0 sm:border-0 border border-slate-800/30">
                      <input
                        type="text"
                        placeholder="Subtask name"
                        className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none"
                        value={topic.name}
                        onChange={e => {
                          const updated = [...newSubjectData.topics];
                          updated[idx].name = e.target.value;
                          setNewSubjectData({ ...newSubjectData, topics: updated });
                        }}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1 sm:w-24">
                          <input
                            type="text"
                            placeholder="12h"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-center text-indigo-400 font-mono font-bold focus:border-indigo-500 outline-none"
                            value={topic.estimate}
                            onChange={e => {
                              const updated = [...newSubjectData.topics];
                              updated[idx].estimate = e.target.value;
                              setNewSubjectData({ ...newSubjectData, topics: updated });
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={newSubjectData.topics.length === 1}
                          onClick={() => {
                            const updated = newSubjectData.topics.filter((_, i) => i !== idx);
                            setNewSubjectData({ ...newSubjectData, topics: updated });
                          }}
                          className="p-3 text-slate-600 hover:text-rose-500 disabled:opacity-0 transition-colors"
                        ><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-[#0b1121] pb-2">
                <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 md:py-5 rounded-2xl font-black text-base md:text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                  {loading ? "Processing..." : "Confirm Tickets"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SINGLE TOPIC MODAL */}
      {showCreateTopic && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0b1121] border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center font-black uppercase tracking-tighter">
              <h3 className="text-white flex items-center gap-2"><CheckCircle size={18} className="text-indigo-400" /> New Subtask</h3>
              <button onClick={() => setShowCreateTopic(null)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTopic} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none shadow-inner"
                  value={newTopicData.name}
                  onChange={e => setNewTopicData({ ...newTopicData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest uppercase">Target Time</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-indigo-400 font-mono font-bold focus:border-indigo-500 outline-none"
                    value={newTopicData.estimate}
                    onChange={e => setNewTopicData({ ...newTopicData, estimate: e.target.value })}
                  />
                </div>
                <div className="flex items-end pb-1 text-[10px] text-slate-600 font-bold italic tracking-tight">Format: 1h 20m</div>
              </div>
              <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all">Add to Roadmap</button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 border-b border-slate-900 pb-8">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">GATE <span className="text-indigo-500">2027</span> HUB</h1>
            <p className="text-slate-500 font-bold tracking-widest text-[9px] sm:text-[10px] uppercase">Engineer: {user.username} • SYNCED</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={logout} className="text-slate-600 hover:text-white text-[10px] font-black uppercase transition-colors tracking-widest border border-slate-800 px-4 py-3 sm:py-2 rounded-xl">Logout</button>
            <button onClick={() => setShowCreateSubject(true)} className="bg-white text-black px-8 py-4 rounded-xl sm:rounded-2xl flex items-center justify-center sm:justify-start gap-3 font-black transition-all hover:bg-indigo-500 hover:text-white shadow-xl shadow-white/5 uppercase tracking-tighter"><Plus size={20} /> NEW TICKET</button>
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
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Sprints</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tighter">{formatTime(totalStudyTime)}</h2>
              <div className="flex items-center gap-2 mt-3">
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${progressPercentage}%` }} /></div>
                <span className="text-[10px] text-slate-600 font-black min-w-max">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SYLLABUS GRID */}
        {loading && <div className="text-center py-20 text-slate-600 font-black uppercase tracking-widest animate-pulse text-xs">Synchronizing Roadmap...</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {syllabus.map((sub) => {
            const subTotalTime = sub.topics.reduce((acc, t) => acc + (t.time || 0), 0);
            const subSpentTime = sub.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
            const subProgress = subTotalTime === 0 ? 0 : Math.round((subSpentTime / subTotalTime) * 100);
            const isOpen = expanded[sub.id];

            return (
              <div key={sub.id} className={`bg-slate-900 border ${subProgress >= 100 ? 'border-indigo-500/30' : 'border-slate-800/50'} rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 transition-all hover:bg-[#0c1225] hover:border-indigo-500/40 relative group shadow-sm flex flex-col`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="cursor-pointer select-none flex-1 pr-2" onClick={() => toggleExpand(sub.id)}>
                    <h3 className="font-black uppercase text-sm sm:text-base leading-tight tracking-tighter group-hover:text-indigo-400 transition-colors">{sub.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSubjectDetailsId(sub.id)} className="p-1.5 text-slate-700 hover:text-white transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => handleDeleteSubject(sub.id, sub.name)} className="p-1.5 text-slate-700 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>{formatTime(subSpentTime)} / {formatTime(subTotalTime)}</span>
                  <span className="text-indigo-400">{subProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden mb-6 cursor-pointer" onClick={() => toggleExpand(sub.id)}>
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000" style={{ width: `${subProgress}%` }} />
                </div>

                <div className={`expand-container ${isOpen ? 'open' : ''}`}>
                  <div className="expand-content">
                    <div className="space-y-2 pt-2">
                      {sub.topics.map((t, tIdx) => {
                        const tp = t.time > 0 ? (t.timeSpent / t.time) * 100 : 0;
                        return (
                          <div key={tIdx} className="group/topic bg-slate-950/40 border border-slate-800/30 rounded-xl p-3 sm:p-4 cursor-pointer hover:border-indigo-500/20 active:scale-[0.98] transition-all" onClick={() => setLoggingTopic({ subId: sub.id, topicName: t.name, currentSpent: t.timeSpent })}>
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <span className={`text-[11px] sm:text-xs font-bold leading-tight flex-1 ${tp >= 100 ? 'text-indigo-400 line-through opacity-50' : 'text-slate-300'}`}>{t.name}</span>
                              <div className="flex items-center gap-1.5 min-w-max">
                                <span className="text-[9px] sm:text-[10px] font-mono text-slate-600 font-black">{formatTime(t.timeSpent)}</span>
                                <Plus size={10} className="text-slate-700 group-hover/topic:text-indigo-500" />
                              </div>
                            </div>
                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${Math.min(100, tp)}%` }} /></div>
                          </div>
                        )
                      })}
                      <button onClick={() => setShowCreateTopic(sub.id)} className="w-full py-3 sm:py-4 border-2 border-dashed border-slate-800/50 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-2 font-black">+ Add Subtask</button>
                    </div>
                  </div>
                </div>

                {!isOpen && sub.topics.length > 0 && <div className="text-center py-2 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer text-slate-700 hover:text-indigo-500" onClick={() => toggleExpand(sub.id)}><ChevronDown size={14} className="mx-auto" /></div>}
              </div>
            );
          })}

          <button onClick={() => setShowCreateSubject(true)} className="border-2 border-dashed border-slate-800/50 rounded-2xl sm:rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-700 hover:text-indigo-500 hover:border-indigo-500/30 transition-all group h-full min-h-[220px]">
            <div className="p-4 bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform"><Plus size={32} /></div>
            <span className="font-black uppercase tracking-widest text-[9px] sm:text-[10px]">Create Roadmap Ticket</span>
          </button>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {subjectDetailsId && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-300" onClick={() => setSubjectDetailsId(null)}>
          <div className="w-full max-w-2xl bg-[#0b1121] h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-slate-800 p-6 sm:p-8 md:p-12" onClick={e => e.stopPropagation()}>
            {(() => {
              const sub = syllabus.find(s => s.id === subjectDetailsId);
              if (!sub) return null;
              return (
                <div className="space-y-8 md:space-y-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight pr-4">{sub.name}</h2>
                    <button onClick={() => setSubjectDetailsId(null)} className="p-2.5 bg-slate-900 rounded-full text-slate-500 hover:text-white transition-all shrink-0"><X size={20} /></button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Active Roadmap Items</label>
                    {sub.topics.map((t, idx) => (
                      <div key={idx} className="group flex items-center justify-between p-4 sm:p-5 md:p-6 bg-slate-900/50 border border-slate-800/50 rounded-2xl sm:rounded-[1.5rem] hover:border-indigo-500/30 transition-all">
                        <div className="space-y-1 flex-1 pr-4">
                          <p className="text-base sm:text-lg font-bold text-slate-200 leading-tight">{t.name}</p>
                          <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 font-black uppercase tracking-widest">{formatTime(t.timeSpent)} / {formatTime(t.time)}</p>
                        </div>
                        <div className="flex gap-1 md:gap-2">
                          <button onClick={() => handleRenameTopic(sub.id, t.name)} className="p-2 text-slate-500 hover:bg-slate-800 rounded-xl transition-all"><Edit3 size={15} /></button>
                          <button onClick={() => handleDeleteTopic(sub.id, t.name)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;