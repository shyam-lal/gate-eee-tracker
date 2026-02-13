import { useState, useEffect } from 'react';
import { syllabusData as defaultSyllabus } from './syllabusData';
import {
  Calendar as CalendarIcon, Trash2, Plus, X,
  ChevronDown, ChevronRight, Clock, Edit3,
  CalendarRange, AlertTriangle,
  Play, Pause, RotateCcw, Coffee, Brain,
  Maximize2, Minus, CheckCircle, Target, PenTool, History,
  PartyPopper, Trophy, RefreshCw, Flame, BarChart3, Map,
  MoreVertical
} from 'lucide-react';

function App() {
  // --- HELPERS ---
  const formatTime = (minutes) => {
    if (!minutes || isNaN(minutes)) return "0m";
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatTimerDisplay = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- STATE MANAGEMENT ---
  const [syllabus, setSyllabus] = useState(() => {
    try {
      let data = [];
      const saved = localStorage.getItem('gateSyllabus');
      if (saved) {
        data = JSON.parse(saved);
      } else {
        // Fallback or migration logic could go here, but simplifying for merge
        data = defaultSyllabus.map(sub => ({
          ...sub,
          manualTime: 0,
          topics: sub.topics.map(t => typeof t === 'string' ? { name: t, time: 0, timeSpent: 0 } : { ...t, timeSpent: t.timeSpent || 0 }),
          startDate: "", endDate: ""
        }));
      }

      // Ensure data structure integrity
      let processed = data.map((sub, sIdx) => ({
        ...sub,
        id: sub.id || `sub-${sIdx}`,
        startDate: sub.startDate || "",
        endDate: sub.endDate || "",
        manualTime: sub.manualTime || 0,
        topics: sub.topics.map((t, tIdx) => {
          if (typeof t === 'string') return { name: t, time: 0, timeSpent: 0 };
          return {
            name: t.name || `Topic ${tIdx + 1}`,
            time: t.time || 0,
            timeSpent: t.timeSpent || 0
          };
        })
      }));

      // Ensure Break Exists
      if (!processed.find(s => s.id === 'break-mode')) {
        processed.push({
          id: "break-mode", subject: "Break", manualTime: 0, startDate: "", endDate: "",
          topics: [{ name: "Short Break", time: 5, timeSpent: 0 }, { name: "Long Break", time: 15, timeSpent: 0 }, { name: "Lunch/Dinner", time: 30, timeSpent: 0 }, { name: "Nap", time: 20, timeSpent: 0 }]
        });
      }
      return processed;
    } catch (e) { return defaultSyllabus; }
  });

  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem('gateProgress');
    return saved ? JSON.parse(saved) : {};
  });

  const [targetDate, setTargetDate] = useState(() => localStorage.getItem('gateTargetDate') || "");
  const [expanded, setExpanded] = useState({ [syllabus[0]?.id]: true });
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // --- CELEBRATION STATES ---
  const [celebration, setCelebration] = useState(null);

  // --- FOCUS MODE STATE ---
  const [focusMode, setFocusMode] = useState('hidden');
  const [focusDuration, setFocusDuration] = useState(25);
  const [focusTask, setFocusTask] = useState(null);
  const [timerTime, setTimerTime] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [dailyFocusMinutes, setDailyFocusMinutes] = useState(() => {
    try {
      const today = new Date().toDateString();
      const saved = JSON.parse(localStorage.getItem('gateDailyFocus') || '{}');
      return saved.date === today ? saved.minutes : 0;
    } catch { return 0; }
  });

  // --- ROADMAP DATA (Example) ---
  const roadmapSteps = [
    { month: "JAN", subject: "Network Theory", color: "bg-pink-500" },
    { month: "FEB", subject: "Mathematics", color: "bg-purple-500" },
    { month: "MAR", subject: "Control Systems", color: "bg-blue-500" },
    { month: "APR", subject: "Signals & Systems", color: "bg-teal-500" },
    { month: "MAY", subject: "Machines", color: "bg-yellow-500" },
    { month: "JUN", subject: "Power Systems", color: "bg-orange-500" },
  ];

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('gateSyllabus', JSON.stringify(syllabus)); }, [syllabus]);
  useEffect(() => { localStorage.setItem('gateProgress', JSON.stringify(completed)); }, [completed]);
  useEffect(() => { localStorage.setItem('gateTargetDate', targetDate); }, [targetDate]);
  useEffect(() => { localStorage.setItem('gateDailyFocus', JSON.stringify({ date: new Date().toDateString(), minutes: dailyFocusMinutes })); }, [dailyFocusMinutes]);

  // --- TIMER TITLE & NOTIFICATION ---
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (timerActive) {
      document.title = `${formatTimerDisplay(timerTime)} - ${focusTask ? focusTask.topicName : "Study"}`;
    } else {
      document.title = "GATE EE Tracker";
    }
  }, [timerTime, timerActive, focusTask]);

  // --- AUTO-COMPLETE (Timer -> Checkbox) ---
  useEffect(() => {
    let updates = {};
    let hasUpdates = false;
    syllabus.forEach(sub => {
      sub.topics.forEach(t => {
        const key = `${sub.id}-${t.name}`;
        // If time spent >= goal (and goal > 0), mark complete automatically
        if (t.time > 0 && t.timeSpent >= t.time && !completed[key]) {
          updates[key] = new Date().toISOString();
          hasUpdates = true;
        }
      });
    });
    if (hasUpdates) {
      setCompleted(prev => ({ ...prev, ...updates }));
      triggerCelebration('topic');
    }
  }, [syllabus]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (timerActive && timerTime > 0) {
      interval = setInterval(() => {
        setTimerTime((prev) => {
          if (prev === 1 && "Notification" in window && Notification.permission === "granted") {
            new Notification("Session Complete!", { body: `Great job on ${focusTask?.topicName}!` });
          }
          if (prev % 60 === 0) {
            if (focusTask?.subId !== 'break-mode') setDailyFocusMinutes(d => d + 1);
            if (focusTask) {
              setSyllabus(currentSyllabus => currentSyllabus.map(sub => {
                if (sub.id === focusTask.subId) {
                  return { ...sub, topics: sub.topics.map(t => t.name === focusTask.topicName ? { ...t, timeSpent: (t.timeSpent || 0) + 1 } : t) };
                }
                return sub;
              }));
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerTime === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerTime, focusTask]);

  // --- HELPERS FOR STREAK ---
  const calculateStreak = () => {
    // This is a simple mock streak calculation based on activity dates
    // In a real app, you'd parse all completion dates. 
    // For now, we'll just check if there was activity yesterday and today.
    // Simplifying for this merged version.

    // Check if any topic was completed today
    const today = new Date().toISOString().split('T')[0];
    const hasActivityToday = Object.values(completed).some(dateStr => dateStr.startsWith(today));

    return hasActivityToday ? 1 : 0; // Simple placeholder logic
  };

  // --- CORRECTION HANDLERS ---
  const handleManualLog = () => {
    const subName = prompt("Enter Subject Name:");
    if (!subName) return;
    const subject = syllabus.find(s => s.subject.toLowerCase().includes(subName.toLowerCase()));
    if (subject) {
      const min = parseInt(prompt(`Add minutes to ${subject.subject}?`), 10);
      if (min) {
        setSyllabus(syllabus.map(s => s.id === subject.id ? { ...s, manualTime: (s.manualTime || 0) + min } : s));
        setDailyFocusMinutes(d => d + min);
      }
    } else {
      alert("Subject not found!");
    }
  };

  const handleCorrectManualTime = (subject) => {
    const current = subject.manualTime || 0;
    const currentSubTopicsTime = subject.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    const totalTime = current + currentSubTopicsTime;
    const newVal = prompt(`Correct Manual Time for ${subject.subject}\n(Current Manual: ${current}m | Timer Logs: ${currentSubTopicsTime}m | Total: ${totalTime}m):`, current);
    if (newVal !== null && !isNaN(parseInt(newVal))) {
      const min = parseInt(newVal);
      let updated = syllabus.map(s => s.id === subject.id ? { ...s, manualTime: min } : s);
      // Optional: Reset logic could go here if needed, keeping it simple for now
      setSyllabus(updated);
    }
  };
  const handleCorrectTopicTime = (subjectId, topic) => {
    const current = topic.timeSpent || 0;
    const newVal = prompt(`Correct Time Spent on "${topic.name}" (current: ${current}m):`, current);
    if (newVal !== null && !isNaN(parseInt(newVal))) {
      const min = parseInt(newVal);
      setSyllabus(syllabus.map(s => s.id === subjectId ? { ...s, topics: s.topics.map(t => t.name === topic.name ? { ...t, timeSpent: min } : t) } : s));
    }
  };

  // --- ACTIONS ---
  const triggerCelebration = (type) => {
    setCelebration(type);
    if (type === 'topic') setTimeout(() => setCelebration(null), 3000);
  };

  const toggleTopic = (subjectId, topicName) => {
    const key = `${subjectId}-${topicName}`;
    const isNowDone = !completed[key]; // We are marking it AS DONE

    setCompleted(prev => {
      const newState = { ...prev };
      if (newState[key]) delete newState[key]; // Unchecking
      else {
        newState[key] = new Date().toISOString(); // Checking
        triggerCelebration('topic');
      }
      return newState;
    });

    // AUTO-FILL HOURS if marking as done manually
    if (isNowDone) {
      setSyllabus(prev => prev.map(sub => {
        if (sub.id === subjectId) {
          return {
            ...sub,
            topics: sub.topics.map(t => {
              // If goal exists (>0) and we haven't reached it yet, auto-fill it
              if (t.name === topicName && t.time > 0 && t.timeSpent < t.time) {
                const addedTime = t.time - t.timeSpent;
                setDailyFocusMinutes(d => d + addedTime); // Add difference to today's stats
                return { ...t, timeSpent: t.time }; // Set spent = goal
              }
              return t;
            })
          };
        }
        return sub;
      }));
    }
  };

  const startFocusSession = () => {
    if (!focusTask) { alert("Please select a subtopic or break first!"); return; }
    setTimerTime(focusDuration * 60);
    setTimerActive(true);
    setFocusMode('minimized');
  };

  // --- EDIT ACTIONS ---
  const handleEditTime = (subjectId, topicName, currentVal) => {
    const newTime = prompt(`Set Goal Duration (mins) for "${topicName}":`, currentVal || 0);
    if (newTime !== null) setSyllabus(syllabus.map(sub => sub.id === subjectId ? { ...sub, topics: sub.topics.map(t => t.name === topicName ? { ...t, time: parseInt(newTime) } : t) } : sub));
  };
  const handleDeleteTopic = (subjectId, topicName) => {
    if (confirm(`Delete "${topicName}"?`)) {
      setSyllabus(syllabus.map(sub => sub.id === subjectId ? { ...sub, topics: sub.topics.filter(t => t.name !== topicName) } : sub));
      setCompleted(prev => { const n = { ...prev }; delete n[`${subjectId}-${topicName}`]; return n; });
    }
  };
  const handleRenameTopic = (subjectId, oldName) => {
    const newName = prompt("Rename:", oldName);
    if (newName) {
      setSyllabus(syllabus.map(sub => sub.id === subjectId ? { ...sub, topics: sub.topics.map(t => t.name === oldName ? { ...t, name: newName } : t) } : sub));
      setCompleted(prev => { const n = { ...prev }; if (n[`${subjectId}-${oldName}`]) { n[`${subjectId}-${newName}`] = n[`${subjectId}-${oldName}`]; delete n[`${subjectId}-${oldName}`]; } return n; });
    }
  };
  const handleAddTopic = (subjectId) => {
    const name = prompt("New topic name:");
    if (name) setSyllabus(syllabus.map(sub => sub.id === subjectId ? { ...sub, topics: [...sub.topics, { name, time: 0, timeSpent: 0 }] } : sub));
  };
  const handleSaveSchedule = (subjectId, start, end) => {
    setSyllabus(syllabus.map(sub => sub.id === subjectId ? { ...sub, startDate: start, endDate: end } : sub));
    setEditingScheduleId(null);
  };
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // --- CALCULATIONS ---
  const totalTopics = syllabus.reduce((acc, sub) => sub.id === 'break-mode' ? acc : acc + sub.topics.length, 0);
  const completedKeys = Object.keys(completed).filter(k => completed[k]);
  const realCompletedCount = completedKeys.filter(k => !k.startsWith('break-mode')).length;
  const progressPercentage = totalTopics === 0 ? 0 : Math.round((realCompletedCount / totalTopics) * 100);
  const totalStudyTime = syllabus.reduce((acc, sub) => acc + sub.topics.reduce((tAcc, t) => tAcc + (t.timeSpent || 0), 0) + (sub.manualTime || 0), 0);
  const streakDays = calculateStreak();

  const renderCalendar = () => {
    const curr = new Date();
    const target = targetDate ? new Date(targetDate) : null;
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 h-full">
        <div className="flex justify-between items-center px-1 mb-2">
          <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><CalendarIcon size={14} /> {curr.toLocaleString('default', { month: 'long' })}</h3>
          <button onClick={() => setTargetDate(prompt("New Target Date (YYYY-MM-DD):"))} className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-400 hover:bg-indigo-500/40 transition-colors">Set Goal</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[9px] font-bold text-center text-slate-600">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
          {Array.from({ length: new Date(curr.getFullYear(), curr.getMonth(), 1).getDay() }).map((_, i) => <div key={i} />)}
          {Array.from({ length: new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate() }).map((_, i) => {
            const d = i + 1;
            const isToday = d === curr.getDate();
            const isTarget = target && d === target.getDate() && curr.getMonth() === target.getMonth();
            return (
              <div key={d} className={`h-5 w-5 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : isTarget ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-800'}`}>{d}</div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-4 md:p-8 pb-32">

      {/* --- CELEBRATION OVERLAYS --- */}
      {celebration === 'topic' && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center animate-in zoom-in-50 duration-300">
          <div className="bg-slate-900/90 backdrop-blur border border-indigo-500/50 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <PartyPopper size={64} className="text-yellow-400 animate-bounce" />
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Topic Completed!</h2>
            <p className="text-slate-400 text-sm">Great job, keep going!</p>
          </div>
        </div>
      )}

      {celebration === 'victory' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-slate-900 border-2 border-yellow-500 p-10 rounded-3xl shadow-2xl text-center max-w-lg mx-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
            <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-4xl font-extrabold text-white mb-2">VICTORY!</h1>
            <p className="text-xl text-slate-300 mb-6">You have completed the entire GATE EE Syllabus.</p>
            <p className="text-sm text-slate-500 italic mb-8">"The harder the battle, the sweeter the victory."</p>
            <button onClick={() => setCelebration(null)} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-full transition-transform hover:scale-105">Continue Reviewing</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">GATE <span className="text-indigo-500">2027</span> DASHBOARD</h1>
            <p className="text-slate-500 italic">"Focus on the process. The results will follow."</p>
          </div>
          <button onClick={() => setFocusMode('expanded')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black transition-all shadow-xl shadow-indigo-500/20 hover:scale-105"><Brain size={24} /> FOCUS MODE</button>
        </header>

        {/* ROADMAP INFOGRAPHIC */}
        <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-10"><Map size={18} className="text-indigo-400" /><h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Study Roadmap Infographic</h2></div>
          <div className="relative flex justify-between items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-12 z-0" />
            {roadmapSteps.map((step, idx) => {
              const isCurrent = idx === new Date().getMonth() % 6;
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center min-w-[120px]">
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-xs font-black mb-4 transition-all duration-500 ${isCurrent ? `${step.color} border-white scale-110 shadow-lg` : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{step.month}</div>
                  <div className={`w-2 h-2 rounded-full mb-3 ${isCurrent ? 'bg-white ring-4 ring-indigo-500/30' : 'bg-slate-700'}`} />
                  <p className={`text-[10px] font-black text-center leading-tight uppercase ${isCurrent ? 'text-indigo-400' : 'text-slate-600'}`}>{step.subject}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {renderCalendar()}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-6 h-full">
            <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500"><Flame size={40} fill="currentColor" /></div>
            <div><p className="text-xs font-bold text-slate-500 uppercase">Consistency Streak</p><h2 className="text-4xl font-black text-white">{streakDays} Days</h2></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-6 h-full">
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500"><BarChart3 size={40} /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Total Study Vault</p>
              <h2 className="text-4xl font-black text-white">{formatTime(totalStudyTime)}</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-slate-600 font-bold">({progressPercentage}% Done)</div>
                <button onClick={handleManualLog} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1 transition-colors"><Plus size={10} /> Log Offline</button>
              </div>
            </div>
          </div>
        </div>

        {/* SUBJECT GRID (MERGED) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {syllabus.map((sub, sIdx) => {
            if (sub.id === 'break-mode') return null;
            const subTotal = sub.topics.length;
            const subCompleted = sub.topics.filter(t => completed[`${sub.id}-${t.name}`]).length;
            const subPercent = subTotal === 0 ? 0 : Math.round((subCompleted / subTotal) * 100);
            const isDone = subPercent === 100 && subTotal > 0;
            const isOpen = expanded[sub.id];

            const totalLectureMinutes = sub.topics.reduce((acc, t) => acc + (t.time || 0), 0);
            const actualStudyMinutes = sub.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0) + (sub.manualTime || 0);

            let statusBadge = null;
            let borderColor = isDone ? 'border-emerald-500/30' : 'border-slate-800';

            // Overdue Logic
            if (sub.startDate && sub.endDate && !isDone) {
              const start = new Date(sub.startDate); const end = new Date(sub.endDate); const now = new Date(); now.setHours(0, 0, 0, 0);
              if (now > end) { borderColor = 'border-rose-500/50'; statusBadge = <span className="text-rose-400 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12} /> Overdue</span>; }
              else if (now >= start && now <= end) { borderColor = 'border-blue-500/50'; statusBadge = <span className="text-blue-400 text-xs font-bold flex items-center gap-1 animate-pulse"><Clock size={12} /> Active Now</span>; }
            }

            return (
              <div key={sub.id} className={`bg-slate-900 border ${borderColor} rounded-2xl p-5 hover:border-indigo-500/50 transition-all flex flex-col group/card relative`}>

                {/* Card Header & Summary */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(sub.id)}>
                    <h3 className={`font-bold uppercase text-sm truncate pr-2 ${isDone ? 'text-emerald-400' : 'text-white'}`}>{sub.subject}</h3>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <span className={`text-xs font-black ${isDone ? 'text-emerald-400' : 'text-indigo-400'}`}>{subPercent}%</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-4" onClick={() => toggleExpand(sub.id)}>
                  <div className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all duration-1000`} style={{ width: `${subPercent}%` }} />
                </div>

                {/* Meta Controls (Schedule) */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Clock size={10} /> {formatTime(actualStudyMinutes)} / {formatTime(totalLectureMinutes)}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleCorrectManualTime(sub); }} className="text-slate-600 hover:text-white" title="Correct Manual Time"><Edit3 size={8} /></button>
                  </div>
                  {editingScheduleId === sub.id ? (
                    <div className="flex flex-col gap-2 bg-slate-800 p-2 rounded absolute top-12 right-4 z-20 shadow-xl border border-slate-600 animate-in zoom-in-95">
                      <input type="date" className="bg-slate-700 rounded p-1 text-white text-xs" defaultValue={sub.startDate} id={`start-${sub.id}`} />
                      <input type="date" className="bg-slate-700 rounded p-1 text-white text-xs" defaultValue={sub.endDate} id={`end-${sub.id}`} />
                      <div className="flex gap-2"><button onClick={() => setEditingScheduleId(null)} className="text-xs p-1">Cancel</button><button onClick={() => handleSaveSchedule(sub.id, document.getElementById(`start-${sub.id}`).value, document.getElementById(`end-${sub.id}`).value)} className="text-xs bg-indigo-600 px-2 py-1 rounded text-white">Save</button></div>
                    </div>
                  ) : (
                    <button onClick={() => setEditingScheduleId(sub.id)} className={`flex items-center gap-1 hover:text-white transition-colors ${sub.startDate ? 'text-indigo-400' : ''}`}>
                      {statusBadge || <><CalendarRange size={10} /> {sub.startDate ? `${formatDate(sub.startDate)} - ${formatDate(sub.endDate)}` : "Plan"}</>}
                    </button>
                  )}
                </div>

                {/* Subtopics List (Collapsible) */}
                {isOpen ? (
                  <div className="space-y-2 animate-in slide-in-from-top-2 border-t border-slate-800 pt-4 mt-2">
                    {sub.topics.map((topic, tIdx) => {
                      const isChecked = !!completed[`${sub.id}-${topic.name}`];
                      return (
                        <div key={tIdx} className="group/topic flex items-center justify-between hover:bg-slate-800/50 rounded p-1 -mx-1">
                          <label className={`flex items-center gap-2 cursor-pointer flex-1 ${isChecked ? 'opacity-50' : ''}`}>
                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                              {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleTopic(sub.id, topic.name)} />
                            </div>
                            <span className={`text-[11px] truncate ${isChecked ? 'line-through text-slate-600' : 'text-slate-400'}`}>{topic.name}</span>
                          </label>

                          <div className="flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                            <button onClick={() => handleCorrectTopicTime(sub.id, topic)} className="text-slate-600 hover:text-indigo-400" title="Fix Log"><History size={10} /></button>
                            <button onClick={() => handleAddTopic(sub.id)} className="text-slate-600 hover:text-indigo-400 block md:hidden"><Plus size={10} /></button>
                            {/* Actions for specific topic */}
                            <button onClick={() => handleEditTime(sub.id, topic.name, topic.time)} className="text-[9px] font-mono text-slate-600 hover:text-emerald-400 bg-slate-800 px-1 rounded">{topic.time > 0 ? formatTime(topic.time) : 'Goal'}</button>
                            <button onClick={() => handleRenameTopic(sub.id, topic.name)} className="text-slate-600 hover:text-white"><Edit3 size={10} /></button>
                            <button onClick={() => handleDeleteTopic(sub.id, topic.name)} className="text-slate-600 hover:text-rose-400"><X size={10} /></button>
                          </div>
                        </div>
                      )
                    })}
                    <button onClick={() => handleAddTopic(sub.id)} className="w-full text-[10px] text-center text-slate-600 hover:text-indigo-400 py-2 border-t border-slate-800 border-dashed mt-2">+ Add Topic</button>
                  </div>
                ) : (
                  // Summary View (Top 3)
                  <div className="space-y-1 mt-auto" onClick={() => toggleExpand(sub.id)}>
                    {sub.topics.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
                        <div className={`w-1 h-1 rounded-full ${completed[`${sub.id}-${t.name}`] ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                        <span className="truncate">{t.name}</span>
                      </div>
                    ))}
                    {sub.topics.length > 3 && <div className="text-[10px] text-slate-700 pl-3">+{sub.topics.length - 3} more...</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FOCUS MODE OVERLAY (MERGED) */}
      {focusMode === 'expanded' && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-4xl h-[600px] rounded-[3rem] shadow-2xl flex overflow-hidden">
            <div className="w-1/2 p-12 border-r border-white/5 flex flex-col justify-between items-center text-center relative">
              <button onClick={() => setFocusMode('hidden')} className="absolute top-8 left-8 text-slate-500 hover:text-white"><Minus /></button>
              <div>
                <h2 className="text-8xl font-black text-white mb-2 tracking-tighter">{focusDuration}</h2>
                <p className="text-slate-500 uppercase font-black tracking-widest text-xs">Minutes Focus</p>

                <div className="flex gap-4 mt-8 justify-center">
                  <button onClick={() => setFocusDuration(Math.max(5, focusDuration - 5))} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-2xl transition-colors">-</button>
                  <button onClick={() => setFocusDuration(focusDuration + 5)} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-2xl transition-colors">+</button>
                </div>
              </div>

              <button onClick={() => {
                if (!focusTask) { alert("Select a topic first!"); return; }
                setTimerTime(focusDuration * 60); setTimerActive(true); setFocusMode('minimized');
              }} disabled={!focusTask} className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl transition-all ${focusTask ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>START SESSION</button>
            </div>

            <div className="w-1/2 p-8 overflow-y-auto bg-slate-950/50">
              <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest sticky top-0 bg-slate-950/50 backdrop-blur pb-2">Select Task</h3>
              <div className="space-y-6">
                {syllabus.map(sub => (
                  <div key={sub.id}>
                    <h4 className="text-[10px] font-bold text-slate-600 uppercase mb-2">{sub.subject}</h4>
                    <div className="space-y-1">
                      {sub.topics.map(t => (
                        <button key={t.name} onClick={() => setFocusTask({ subId: sub.id, topicName: t.name })} className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex justify-between items-center ${focusTask?.topicName === t.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
                          <span>{t.name}</span>
                          {focusTask?.topicName === t.name && <CheckCircle size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOAT TIMER */}
      {focusMode === 'minimized' && (
        <div className="fixed bottom-8 right-8 z-[100] bg-slate-900 border-2 border-indigo-500 p-6 rounded-[2.5rem] shadow-2xl w-80 text-center animate-in slide-in-from-bottom-10">
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${timerActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <p className="text-[10px] font-black text-indigo-400 uppercase truncate max-w-[120px]" title={focusTask?.topicName}>{focusTask?.topicName}</p>
            </div>
            <button onClick={() => setFocusMode('hidden')} className="text-slate-600 hover:text-white"><X size={14} /></button>
          </div>

          <h2 className="text-6xl font-black text-white font-mono tracking-tighter mb-6">{formatTimerDisplay(timerTime)}</h2>

          <div className="flex justify-center gap-3">
            <button onClick={() => setTimerActive(!timerActive)} className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-colors text-white shadow-lg shadow-indigo-500/20">{timerActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button>
            <button onClick={() => setTimerTime(focusDuration * 60)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white transition-colors"><RotateCcw /></button>
            <button onClick={() => setFocusMode('expanded')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white transition-colors"><Maximize2 size={20} /></button>
            {focusTask && (<button onClick={() => { const topicObj = syllabus.find(s => s.id === focusTask.subId)?.topics.find(t => t.name === focusTask.topicName); if (topicObj) toggleTopic(focusTask.subId, focusTask.topicName); setFocusTask(null); }} className="p-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-2xl transition-colors"><CheckCircle size={20} /></button>)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;