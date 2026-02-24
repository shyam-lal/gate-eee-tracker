import { useState, useEffect } from 'react';
import { syllabus as syllabusApi, auth as authApi, user as userApi } from './services/api';
import Auth from './components/Auth';
import Landing from './components/Landing';
import Wizard from './components/Wizard';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Social from './components/Social';
import {
  Calendar as CalendarIcon, Trash2, Plus, X,
  ChevronDown, ChevronRight, Clock, Edit3,
  CalendarRange, AlertTriangle,
  Play, Pause, RotateCcw, Brain,
  Maximize2, Minus, CheckCircle, Flame, BarChart3, Map,
  MoreVertical, Timer, PartyPopper, PenTool, Save, LogIn, TrendingUp, Target, Hourglass, Zap, User as UserIcon, ArrowLeft
} from 'lucide-react';

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  // --- APP STATE ---
  const [view, setView] = useState('landing'); // 'landing', 'auth', 'wizard', 'app'
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetDate, setTargetDate] = useState(() => localStorage.getItem('gateTargetDate') || "");
  const [expanded, setExpanded] = useState({});
  const [trackingMode, setTrackingMode] = useState('time'); // 'time' or 'module'

  // --- UI STATES ---
  const [loggingTopic, setLoggingTopic] = useState(null);
  const [editingLog, setEditingLog] = useState(null); // { id, minutes, modules, topicName }
  const [celebration, setCelebration] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // --- EDITOR MODAL STATE ---
  const [editingId, setEditingId] = useState(null);
  const [editorData, setEditorData] = useState({
    name: "",
    topics: [{ name: "", estimate: "12h", modules: 1, timeSpent: 0, completedModules: 0, id: null }]
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

  useEffect(() => {
    if (user) {
      loadData();
      if (user.tracking_mode) {
        setTrackingMode(user.tracking_mode);
        setView('dashboard');
      } else {
        setView('wizard');
      }
    } else {
      setView('landing');
    }
  }, [user]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('landing');
  };

  const triggerCelebration = (type) => {
    setCelebration(type);
    setTimeout(() => setCelebration(null), 3000);
  };

  // --- ACTIONS ---
  const handleLogTopicActivity = async (topicId, val) => {
    if (!val) return;
    try {
      const data = { topicId };
      if (trackingMode === 'module') data.modules = parseInt(val, 10);
      else data.minutes = parseFormalTime(val);

      await syllabusApi.logActivity(data);
      await loadData();
      triggerCelebration('topic');
      if (editingId) {
        setEditorData(prev => ({
          ...prev,
          topics: prev.topics.map(t => {
            if (t.id !== topicId) return t;
            return trackingMode === 'module'
              ? { ...t, completedModules: (t.completedModules || 0) + data.modules }
              : { ...t, timeSpent: (t.timeSpent || 0) + data.minutes }
          })
        }));
      }
    } catch (err) { alert("Failed to log activity: " + err.message); }
  };

  const onWizardComplete = async (wizardData) => {
    try {
      const updatedUser = await userApi.updatePreferences(wizardData.exam, wizardData.mode);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setTrackingMode(wizardData.mode);
      setView('dashboard');
    } catch (err) { alert("Setup failed"); }
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
          modules: t.totalModules || 1,
          timeSpent: t.timeSpent || 0,
          completedModules: t.completedModules || 0
        }))
      });
    } else {
      setEditingId('new');
      setEditorData({
        name: "",
        topics: [{ name: "", estimate: "12h", modules: 1, timeSpent: 0, completedModules: 0, id: null }]
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
            await syllabusApi.createTopic(sub.id, t.name, parseFormalTime(t.estimate), t.modules);
          }
        }
      } else {
        await syllabusApi.updateSubject(editingId, editorData.name);
        for (const t of editorData.topics) {
          if (t.name.trim() && !t.id) {
            await syllabusApi.createTopic(editingId, t.name, parseFormalTime(t.estimate), t.modules);
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
      if (field === 'modules') updates.total_modules = parseInt(value, 10);
      await syllabusApi.updateTopic(topicId, updates);
    } catch (e) { console.error(e); }
  };

  const handleEditLogSave = async (logId, val) => {
    try {
      const minutes = trackingMode === 'module' ? 0 : parseFormalTime(val);
      const modules = trackingMode === 'module' ? parseInt(val, 10) : 0;
      await syllabusApi.editLog(logId, minutes, modules);
      await loadData();
      setEditingLog(null);
    } catch (e) { alert("Failed to edit log"); }
  };

  const handleResetProgress = async () => {
    try {
      await syllabusApi.resetProgress();
      await loadData();
      alert("Progress cleared successfully.");
    } catch (err) { alert("Failed to clear progress."); }
  };



  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}"?`)) return;
    setLoading(true);
    try {
      await syllabusApi.deleteSubject(subjectId);
      await loadData();
      if (editingId === subjectId) setEditingId(null);
    } catch (e) { alert("Delete failed"); }
    finally { setLoading(false); }
  };

  const handleDeleteTopic = async (topicId, topicName) => {
    if (!confirm(`Delete subtask "${topicName}"?`)) return;
    try {
      await syllabusApi.deleteTopic(topicId);
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

  const updateTargetDate = (date) => {
    setTargetDate(date);
    localStorage.setItem('gateTargetDate', date);
  };

  // --- CALCULATIONS ---
  const totalEstimatedMins = syllabus.reduce((acc, sub) => acc + sub.topics.reduce((tAcc, t) => tAcc + (t.time || 0), 0), 0);
  const totalStudyMins = syllabus.reduce((acc, sub) => acc + sub.topics.reduce((tAcc, t) => tAcc + (t.timeSpent || 0), 0) + (sub.manualTime || 0), 0);
  const progressPercentage = totalEstimatedMins === 0 ? 0 : Math.min(100, Math.round((totalStudyMins / totalEstimatedMins) * 100));
  const remainingMins = Math.max(0, totalEstimatedMins - totalStudyMins);

  const getDailyGoal = () => {
    if (!targetDate || remainingMins <= 0) return 0;
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return remainingMins;
    return Math.round(remainingMins / diffDays);
  };
  const dailyGoalMins = getDailyGoal();

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

  if (view === 'landing') return <Landing onStart={() => setView(user ? 'dashboard' : 'auth')} />;
  if (view === 'auth' && !user) return <Auth onLogin={(u) => { setUser(u); loadData(); }} />;
  if (view === 'wizard') return <Wizard onComplete={onWizardComplete} />;
  if (view === 'profile') return <Profile user={user} onBack={() => setView('dashboard')} onResetProgress={handleResetProgress} onLogout={logout} />;
  if (view === 'dashboard') return (
    <Dashboard
      user={user}
      syllabus={syllabus}
      onOpenVault={() => setView('app')}
      onOpenProfile={() => setView('profile')}
      onOpenSocial={() => setView('social_terminal')}
      progress={progressPercentage}
    />
  );
  if (view === 'social_terminal') return <Social currentUser={user} onBack={() => setView('dashboard')} />;




  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-4 md:p-8 pb-32 selection:bg-indigo-500/30">

      {(editingLog) && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setEditingLog(null)}>
          <div className="bg-[#0b1121] border border-slate-700 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight flex items-center gap-2"><Edit3 size={20} className="text-indigo-400" /> Edit Activity</h3>
            <div className="mb-6">
              <p className="text-indigo-400 font-black text-lg leading-tight uppercase tracking-tighter">{editingLog.topicName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Adjust the current entry</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                id="edit-log-input"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white text-lg font-mono focus:border-indigo-500 outline-none"
                defaultValue={trackingMode === 'module' ? editingLog.modules : formatTime(editingLog.minutes)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setEditingLog(null)} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Cancel</button>
                <button
                  onClick={() => handleEditLogSave(editingLog.id, document.getElementById('edit-log-input').value)}
                  className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
                >Update Log</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {celebration === 'topic' && (
        <div className="fixed inset-0 pointer-events-none z-[250] flex items-center justify-center animate-in zoom-in-50 duration-300">
          <div className="bg-slate-900/90 backdrop-blur border border-indigo-500/50 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <PartyPopper size={64} className="text-yellow-400 animate-bounce" />
            <h2 className="text-2xl font-black text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-tighter">Time Synced!</h2>
          </div>
        </div>
      )}

      {/* SYLLABUS ANALYTICS MODAL */}
      {showAnalytics && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setShowAnalytics(false)}>
          <div className="bg-[#0b1121] border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><TrendingUp size={20} /></div>
                <h3 className="text-white font-black uppercase tracking-tighter text-lg sm:text-xl">Vault Analytics</h3>
              </div>
              <button onClick={() => setShowAnalytics(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[80vh] no-scrollbar">
              {/* Target Date Section */}
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50 flex flex-col sm:flex-row items-center gap-6">
                <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 shrink-0"><Target size={32} /></div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Vault Completion Deadline</label>
                  <input
                    type="date"
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black focus:border-indigo-500 outline-none w-full sm:w-auto"
                    value={targetDate}
                    onChange={(e) => updateTargetDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Main Progress Gauge */}
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 py-4">
                <div className="relative w-48 h-48 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.9} strokeDashoffset={552.9 - (552.9 * progressPercentage) / 100} className="text-indigo-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-black text-white leading-none">{progressPercentage}%</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Cleared</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/30">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Study Done</p>
                    <p className="text-xl font-black text-emerald-400 tracking-tighter">{formatTime(totalStudyMins)}</p>
                  </div>
                  <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/30">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Left</p>
                    <p className="text-xl font-black text-indigo-400 tracking-tighter">{formatTime(remainingMins)}</p>
                  </div>
                  <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800/30 col-span-2 flex items-center justify-between">
                    <div>
                      {trackingMode === 'module' ? (
                        <>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Modules</p>
                          <p className="text-2xl font-black text-white tracking-tighter">{syllabus.reduce((acc, s) => acc + s.topics.reduce((ta, t) => ta + (t.totalModules || 0), 0), 0)} <span className="text-xs text-slate-500 font-bold">UNITS</span></p>
                        </>
                      ) : (
                        <>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Required Daily</p>
                          <p className="text-2xl font-black text-white tracking-tighter">{formatTime(dailyGoalMins)} <span className="text-xs text-slate-500 font-bold">/ day</span></p>
                        </>
                      )}
                    </div>
                    <Zap size={24} className="text-yellow-400 opacity-50" />
                  </div>

                </div>
              </div>

              {/* Graphical representation (Syllabus Weight) */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1">Syllabus Weight Distribution</label>
                <div className="space-y-3">
                  {syllabus.map(sub => {
                    const subTotal = sub.topics.reduce((acc, t) => acc + (t.time || 0), 0);
                    const subDone = sub.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
                    const weight = totalEstimatedMins === 0 ? 0 : Math.round((subTotal / totalEstimatedMins) * 100);
                    const subProgress = subTotal === 0 ? 0 : Math.round((subDone / subTotal) * 100);
                    return (
                      <div key={sub.id} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-300">{sub.name} <span className="text-slate-600 font-black ml-2">{weight}% Weight</span></span>
                          <span className="text-indigo-400">{subProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden flex">
                          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${subProgress}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
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

              <div className="space-y-4">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Syllabus Breakdown</label>
                  <button
                    type="button"
                    onClick={() => setEditorData({ ...editorData, topics: [...editorData.topics, { name: "", estimate: "12h", modules: 1, timeSpent: 0, completedModules: 0, id: null }] })}
                    className="text-[10px] bg-indigo-500/10 text-indigo-400 font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
                  ><Plus size={14} /> Add Topic</button>

                </div>

                <div className="space-y-3">
                  {editorData.topics.map((topic, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/30 animate-in slide-in-from-left-2 transition-all">
                      <div className="flex flex-col sm:flex-row gap-3">
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
                          <div className="w-24">
                            <input
                              type="text"
                              placeholder={trackingMode === 'module' ? "Modules" : "12h"}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-center text-indigo-400 font-mono font-bold focus:border-indigo-500 outline-none"
                              value={trackingMode === 'module' ? topic.modules : topic.estimate}
                              onChange={e => {
                                const updated = [...editorData.topics];
                                if (trackingMode === 'module') updated[idx].modules = e.target.value;
                                else updated[idx].estimate = e.target.value;
                                setEditorData({ ...editorData, topics: updated });
                              }}
                              onBlur={e => handleManualTopicUpdate(topic.id, trackingMode === 'module' ? 'modules' : 'estimate', e.target.value)}
                            />
                          </div>

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
                      {topic.id && (
                        <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Progress</span>
                              <span className="text-[10px] font-mono text-indigo-400 font-bold">
                                {trackingMode === 'module'
                                  ? `${topic.completedModules} / ${topic.modules} Modules`
                                  : `${formatTime(topic.timeSpent)} Logged`}
                              </span>
                            </div>
                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (trackingMode === 'module' ? (topic.completedModules / (topic.modules || 1)) : (topic.timeSpent / parseFormalTime(topic.estimate))) * 100)}%` }} />
                            </div>

                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              id={`log-hub-${topic.id}`}
                              placeholder={trackingMode === 'module' ? "+ Mod" : "+ Time"}
                              className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-center text-white focus:border-indigo-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = document.getElementById(`log-hub-${topic.id}`).value;
                                handleLogTopicActivity(topic.id, val);
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
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px] border border-slate-800 px-6 py-4 sm:py-2 rounded-xl"
            >
              <ArrowLeft size={16} /> HUB
            </button>
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
          <div onClick={() => setShowAnalytics(true)} className="bg-slate-900/50 border border-slate-800 border-indigo-500/20 p-6 rounded-3xl flex items-center gap-6 relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition-all active:scale-[0.98]">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10"><BarChart3 size={120} /></div>
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform"><BarChart3 size={32} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 flex justify-between">Study Hours <span className="text-indigo-400">{progressPercentage}%</span></p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tighter">{formatTime(totalStudyMins)} <span className="text-[10px] text-slate-600 align-middle"> DONE</span></h2>
              <div className="mt-3 space-y-1">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shrink-0"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progressPercentage}%` }} /></div>
                <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Goal: {formatTime(dailyGoalMins)}</span>
                  <span className="text-slate-600">{formatTime(remainingMins)} LEFT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SYLLABUS GRID */}
        {loading && !syllabus.length && <div className="text-center py-20 text-slate-600 font-black uppercase tracking-widest animate-pulse text-xs">Synchronizing Syllabus...</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {syllabus.map((sub) => {
            const subTotal = trackingMode === 'module'
              ? sub.topics.reduce((acc, t) => acc + (t.totalModules || 0), 0)
              : sub.topics.reduce((acc, t) => acc + (t.time || 0), 0);
            const subDone = trackingMode === 'module'
              ? sub.topics.reduce((acc, t) => acc + (t.completedModules || 0), 0)
              : sub.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
            const subProgress = subTotal === 0 ? 0 : Math.round((subDone / subTotal) * 100);
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
                  <span>
                    {trackingMode === 'module' ? `${subDone} / ${subTotal} Modules` : `${formatTime(subDone)} / ${formatTime(subTotal)}`}
                  </span>
                  <span className={subProgress >= 100 ? 'text-emerald-400' : 'text-indigo-400'}>{subProgress}%</span>
                </div>

                <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden mb-6 cursor-pointer" onClick={() => toggleExpand(sub.id)}>
                  <div className={`h-full ${subProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'} transition-all duration-1000`} style={{ width: `${subProgress}%` }} />
                </div>

                <div className={`expand-container ${isOpen ? 'open' : ''}`}>
                  <div className="expand-content">
                    <div className="space-y-2 pt-2">
                      {sub.topics.map((t, tIdx) => {
                        const weight = trackingMode === 'module' ? t.totalModules : t.time;
                        const done = trackingMode === 'module' ? t.completedModules : t.timeSpent;
                        const tp = weight > 0 ? (done / weight) * 100 : 0;
                        return (
                          <div key={tIdx} className="group/topic bg-slate-950/40 border border-slate-800/30 rounded-xl p-3 sm:p-4 transition-all hover:border-indigo-500/20 active:scale-[0.98]">
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <span onClick={() => setLoggingTopic({ subId: sub.id, topicName: t.name, currentSpent: done, topicId: t.id })} className={`text-[11px] sm:text-xs font-bold leading-tight flex-1 cursor-pointer ${tp >= 100 ? 'text-emerald-400 opacity-60' : 'text-slate-300'}`}>{t.name}</span>
                              <div className="flex items-center gap-2 min-w-max">
                                {trackingMode === 'module'
                                  ? <span className="text-[9px] font-mono text-slate-600 font-black">{done}/{weight}</span>
                                  : <span className="text-[9px] font-mono text-slate-600 font-black">{formatTime(done)}</span>
                                }
                                <div className="flex gap-1">
                                  <button onClick={async () => {
                                    const logs = await syllabusApi.getLogs(t.id);
                                    if (logs) setEditingLog({ id: logs.id, minutes: logs.minutes_logged, modules: logs.modules_logged, topicName: t.name });
                                    else alert("No recent log found for this topic.");
                                  }} className="p-1 hover:text-indigo-400 transition-colors"><PenTool size={10} /></button>
                                  <button onClick={() => setLoggingTopic({ subId: sub.id, topicName: t.name, currentSpent: done, topicId: t.id })} className="p-1 hover:text-indigo-400 transition-colors"><Plus size={10} /></button>
                                </div>
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

      {/* QUICK LOG MODAL */}
      {loggingTopic && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setLoggingTopic(null)}>
          <div className="bg-[#0b1121] border border-slate-700 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight flex items-center gap-2"><Clock size={20} className="text-indigo-400" /> {trackingMode === 'module' ? 'Check Unit' : 'Log Time'}</h3>
            <div className="mb-6 space-y-1 text-center sm:text-left">
              <p className="text-indigo-400 font-black text-lg leading-tight uppercase tracking-tighter">{loggingTopic.topicName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Currently: {trackingMode === 'module' ? `${loggingTopic.currentSpent} Done` : formatTime(loggingTopic.currentSpent)}</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  id="quick-log-input"
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 text-white text-lg font-mono focus:border-indigo-500 outline-none transition-all shadow-inner"
                  placeholder={trackingMode === 'module' ? "Units done (e.g. 1)" : "e.g. 1h 30m"}
                  autoFocus
                />
                <button
                  onClick={() => {
                    const val = document.getElementById('quick-log-input').value;
                    handleLogTopicActivity(loggingTopic.topicId, val);
                    setLoggingTopic(null);
                  }}
                  className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/10"
                >{trackingMode === 'module' ? 'Finish Units' : 'Log Work'}</button>

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