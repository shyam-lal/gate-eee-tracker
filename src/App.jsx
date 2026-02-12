import { useState, useEffect } from 'react';
import { syllabusData as defaultSyllabus } from './syllabusData';
import {
  Calendar, Trash2, Plus, X,
  ChevronDown, ChevronRight, Clock, Edit3,
  CalendarRange, AlertTriangle,
  Play, Pause, RotateCcw, Coffee, Brain,
  Maximize2, Minus, CheckCircle, Target, PenTool, History,
  PartyPopper, Trophy, RefreshCw
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
        data = defaultSyllabus.map(sub => ({
          ...sub,
          manualTime: 0,
          topics: sub.topics.map(t => typeof t === 'string' ? { name: t, time: 0, timeSpent: 0 } : { ...t, timeSpent: t.timeSpent || 0 }),
          startDate: "", endDate: ""
        }));
      }

      // Data Migration
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

  // --- CELEBRATION TRIGGER ---
  const triggerCelebration = (type) => {
    setCelebration(type);
    if (type === 'topic') setTimeout(() => setCelebration(null), 3000);
  };

  // --- ACTIONS ---

  // *** UPDATED TOGGLE TOPIC LOGIC ***
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
    }
  };

  // --- CORRECTION HANDLERS ---
  const handleEditDailyFocus = () => {
    const newVal = prompt("Override Daily Progress?", dailyFocusMinutes);
    if (newVal !== null && !isNaN(parseInt(newVal))) setDailyFocusMinutes(parseInt(newVal));
  };
  const handleCorrectManualTime = (subject) => {
    const current = subject.manualTime || 0;
    const currentSubTopicsTime = subject.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    const totalTime = current + currentSubTopicsTime;
    const newVal = prompt(`Correct Manual Time for ${subject.subject}\n(Current Manual: ${current}m | Timer Logs: ${currentSubTopicsTime}m | Total: ${totalTime}m):`, current);
    if (newVal !== null && !isNaN(parseInt(newVal))) {
      const min = parseInt(newVal);
      let updated = syllabus.map(s => s.id === subject.id ? { ...s, manualTime: min } : s);
      if (min === 0 && currentSubTopicsTime > 0 && confirm("Reset all sub-topic timer logs for this subject too?")) {
        updated = updated.map(s => s.id === subject.id ? { ...s, topics: s.topics.map(t => ({ ...t, timeSpent: 0 })) } : s);
      }
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

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let diffDays = "N/A";
  let isOverdue = false;
  if (targetDate) {
    const target = new Date(targetDate);
    diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    isOverdue = diffDays < 0 && progressPercentage < 100;
  }

  // --- VICTORY CHECK ---
  useEffect(() => {
    if (progressPercentage === 100 && totalTopics > 0) {
      triggerCelebration('victory');
    }
  }, [progressPercentage]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-6 pb-32 relative overflow-x-hidden">

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

      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">GATE EE <span className="text-indigo-500">TRACKER</span></h1>
            <p className="text-slate-500 mt-2 italic">"Hardships often prepare ordinary people for an extraordinary destiny."</p>
          </div>
          <div className={`flex items-center gap-6 p-3 rounded-xl border shadow-lg transition-colors ${isOverdue ? 'bg-rose-950/30 border-rose-500/50' : 'bg-slate-900 border-slate-800'}`}>
            <button onClick={() => setFocusMode('expanded')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all">
              <Brain size={18} /> Focus Mode
            </button>
            <div className="text-right px-2 border-r border-slate-700">
              <div className="text-3xl font-bold text-emerald-400">{progressPercentage}%</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Completed</div>
            </div>

            <div className="text-right px-2">
              {isOverdue ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-lg animate-pulse">
                    <AlertTriangle size={20} /> OVERDUE
                  </div>
                  <button
                    onClick={() => {
                      const newDate = prompt("You are overdue! Enter a new realistic target date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                      if (newDate) setTargetDate(newDate);
                    }}
                    className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded mt-1 flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Reschedule
                  </button>
                </div>
              ) : (
                <>
                  <div className={`text-4xl font-bold ${diffDays <= 30 && diffDays !== "N/A" ? 'text-rose-500' : 'text-indigo-400'}`}>
                    {diffDays === "N/A" ? "--" : diffDays}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Days Left</div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* SYLLABUS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
            let borderColor = isDone ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-slate-800 bg-slate-900';
            if (sub.startDate && sub.endDate && !isDone) {
              const start = new Date(sub.startDate); const end = new Date(sub.endDate); const now = new Date(); now.setHours(0, 0, 0, 0);
              if (now > end) { borderColor = 'border-rose-500/50 bg-rose-950/10'; statusBadge = <span className="text-rose-400 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12} /> Overdue</span>; }
              else if (now >= start && now <= end) { borderColor = 'border-blue-500/50 bg-blue-950/10'; statusBadge = <span className="text-blue-400 text-xs font-bold flex items-center gap-1 animate-pulse"><Clock size={12} /> Active Now</span>; }
            }

            return (
              <div key={sub.id} className={`flex flex-col rounded-xl border transition-all duration-300 relative group/card ${borderColor}`}>
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2" onClick={() => toggleExpand(sub.id)}>
                      <h2 className={`font-semibold text-lg cursor-pointer ${isDone ? 'text-emerald-400' : 'text-slate-100'}`}>{sub.subject}</h2>
                      <button onClick={(e) => { e.stopPropagation(); handleAddTopic(sub.id); }} className="p-1 text-slate-500 hover:text-indigo-400 opacity-0 group-hover/card:opacity-100 transition-opacity"><Plus size={16} /></button>
                    </div>
                    {statusBadge}
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                      <Clock size={12} />
                      <span className="text-indigo-400 font-bold">{formatTime(actualStudyMinutes)}</span>
                      <span className="text-slate-600">/</span>
                      <span>{formatTime(totalLectureMinutes)}</span>
                    </div>
                    {editingScheduleId === sub.id ? (
                      <div className="flex flex-col gap-2 bg-slate-800 p-2 rounded absolute top-12 right-4 z-10 shadow-xl border border-slate-600 animate-in zoom-in-95">
                        <input type="date" className="bg-slate-700 rounded p-1 text-white" defaultValue={sub.startDate} id={`start-${sub.id}`} />
                        <input type="date" className="bg-slate-700 rounded p-1 text-white" defaultValue={sub.endDate} id={`end-${sub.id}`} />
                        <div className="flex gap-2"><button onClick={() => setEditingScheduleId(null)} className="text-xs p-1">Cancel</button><button onClick={() => handleSaveSchedule(sub.id, document.getElementById(`start-${sub.id}`).value, document.getElementById(`end-${sub.id}`).value)} className="text-xs bg-indigo-600 px-2 py-1 rounded">Save</button></div>
                      </div>
                    ) : (
                      <button onClick={() => setEditingScheduleId(sub.id)} className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors ${sub.startDate ? 'text-indigo-400' : 'text-slate-500'}`}><CalendarRange size={12} /> {sub.startDate ? `${formatDate(sub.startDate)} - ${formatDate(sub.endDate)}` : "Plan"}</button>
                    )}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1" onClick={() => toggleExpand(sub.id)}><div className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${subPercent}%` }} /></div>
                  <div className="flex justify-between items-center mt-1"><span className="text-sm font-medium text-slate-300">{subCompleted} / {subTotal} topics</span><span className="text-xs font-bold text-slate-500">{subPercent}%</span></div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 space-y-1 animate-in slide-in-from-top-2">
                    {sub.topics.map((topic, tIdx) => {
                      const uniqueKey = `${sub.id}-${topic.name}-${tIdx}`;
                      const isChecked = !!completed[`${sub.id}-${topic.name}`];
                      const progress = topic.time > 0 ? Math.min((topic.timeSpent / topic.time) * 100, 100) : 0;
                      const isOvertime = topic.time > 0 && topic.timeSpent > topic.time;

                      return (
                        <div key={uniqueKey} className="group/topic flex items-center justify-between hover:bg-slate-800/50 rounded p-1 -mx-1 pr-2">
                          <label className={`flex flex-col gap-1 cursor-pointer flex-1 ${isChecked ? 'opacity-50' : ''}`}>
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 min-w-[16px] h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>{isChecked && <div className="w-2 h-2 bg-white rounded-full" />}<input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleTopic(sub.id, topic.name)} /></div>
                              <span className={`text-sm ${isChecked ? 'line-through decoration-slate-600 text-slate-500' : 'text-slate-300'}`}>{topic.name}</span>
                            </div>
                            {(topic.time > 0 || topic.timeSpent > 0) && (
                              <div className="ml-7 flex items-center gap-2 w-full max-w-[200px]">
                                <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${isOvertime ? 'bg-amber-500' : (progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500')}`} style={{ width: `${isOvertime ? 100 : progress}%` }} />
                                </div>
                                <span className={`text-[10px] ${isOvertime ? 'text-amber-500' : 'text-slate-500'}`}>{formatTime(topic.timeSpent)} / {formatTime(topic.time)}</span>
                              </div>
                            )}
                          </label>
                          <div className="flex items-center gap-2 opacity-0 group-hover/topic:opacity-100 transition-opacity self-start mt-1">
                            <button onClick={() => handleCorrectTopicTime(sub.id, topic)} className="text-slate-500 hover:text-indigo-400 p-1" title="Fix Log"><History size={12} /></button>
                            <button onClick={() => handleRenameTopic(sub.id, topic.name)} className="text-slate-500 hover:text-white p-1" title="Rename"><Edit3 size={12} /></button>
                            <button onClick={() => handleEditTime(sub.id, topic.name, topic.time)} className="text-xs font-mono text-slate-500 hover:text-emerald-400 bg-slate-800/50 px-1.5 py-0.5 rounded flex items-center gap-1" title="Set Goal Time">{topic.time > 0 ? formatTime(topic.time) : <><Clock size={10} /> Goal</>}</button>
                            <button onClick={() => handleDeleteTopic(sub.id, topic.name)} className="text-slate-700 hover:text-red-400 p-1"><X size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- FOCUS DASHBOARD (Expanded) --- */}
        {focusMode === 'expanded' && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[650px] rounded-2xl shadow-2xl flex overflow-hidden">
              <div className="w-5/12 p-8 border-r border-slate-700 flex flex-col justify-between relative bg-slate-900">
                <button onClick={() => setFocusMode('minimized')} className="absolute top-4 right-4 text-slate-500 hover:text-white"><Minus /></button>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Focus Mode</h2>
                  <p className="text-slate-400 text-sm mb-6">Select a task on the right to start tracking time.</p>
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6 text-center">
                    <div className="text-6xl font-bold text-white mb-2">{focusDuration}</div>
                    <div className="text-sm text-slate-500 uppercase tracking-widest mb-4">Minutes</div>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setFocusDuration(Math.max(5, focusDuration - 5))} className="bg-slate-700 hover:bg-slate-600 w-10 h-10 rounded-full flex items-center justify-center">-</button>
                      <button onClick={() => setFocusDuration(focusDuration + 5)} className="bg-slate-700 hover:bg-slate-600 w-10 h-10 rounded-full flex items-center justify-center">+</button>
                    </div>
                  </div>
                  <button onClick={startFocusSession} disabled={!focusTask} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${focusTask ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}><Play fill="currentColor" /> {focusTask ? "Start Session" : "Select a Task →"}</button>
                </div>
              </div>
              <div className="w-7/12 bg-slate-800/50 p-8 flex flex-col">
                <div className="mb-6 flex gap-6 items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                      <circle cx="48" cy="48" r="40" stroke="#6366f1" strokeWidth="8" fill="transparent" strokeDasharray="251" strokeDashoffset={251 - (Math.min(dailyFocusMinutes, 360) / 360) * 251} />
                    </svg>
                    <div className="absolute flex flex-col items-center"><span className="text-xl font-bold text-white">{Math.round(dailyFocusMinutes / 60 * 10) / 10}h</span></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Daily Progress</span>
                      <button onClick={handleEditDailyFocus} className="text-indigo-400 hover:text-white" title="Edit Daily Total"><Edit3 size={14} /></button>
                    </div>
                    <div className="text-2xl font-bold text-white">{dailyFocusMinutes} <span className="text-sm font-normal text-slate-500">mins today</span></div>
                    <button onClick={handleManualLog} className="mt-2 text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded flex items-center gap-2"><Plus size={14} /> Log Offline Study</button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                  <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Target size={16} /> Select Subject to Study</h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {syllabus.map((sub) => {
                      const totalSubTime = sub.topics.reduce((acc, t) => acc + (t.timeSpent || 0), 0) + (sub.manualTime || 0);
                      return (
                        <div key={sub.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                          <div className="w-full p-3 flex justify-between items-center hover:bg-slate-700/50 text-left cursor-pointer" onClick={() => setFocusTask(focusTask?.subId === sub.id ? null : { subId: sub.id, topicName: sub.topics.find(t => !completed[`${sub.id}-${t.name}`])?.name || sub.topics[0].name })}>
                            <div>
                              <div className="font-bold text-slate-200">{sub.subject}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-xs text-indigo-400 font-mono">{formatTime(totalSubTime)} spent</div>
                                <button onClick={(e) => { e.stopPropagation(); handleCorrectManualTime(sub); }} className="text-slate-500 hover:text-white" title="Correct Subject Time"><Edit3 size={10} /></button>
                              </div>
                            </div>
                            {focusTask?.subId === sub.id ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                          </div>
                          {focusTask?.subId === sub.id && (
                            <div className="border-t border-slate-700 bg-slate-900/50 p-2 max-h-40 overflow-y-auto">
                              {sub.topics.map(t => {
                                const progress = t.time > 0 ? Math.min((t.timeSpent / t.time) * 100, 100) : 0;
                                const isOvertime = t.time > 0 && t.timeSpent > t.time;
                                return (
                                  <div key={t.name} className="flex flex-col w-full p-2 rounded hover:bg-slate-800 border-b border-slate-800/50 last:border-0">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2 flex-1">
                                        <button onClick={() => setFocusTask({ subId: sub.id, topicName: t.name })} className={`p-1 rounded-full border ${focusTask?.topicName === t.name ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 hover:border-white'}`}><Play size={10} fill="currentColor" className="text-white ml-0.5" /></button>
                                        <button onClick={() => setFocusTask({ subId: sub.id, topicName: t.name })} className={`text-left text-sm ${focusTask?.topicName === t.name ? 'text-indigo-300 font-bold' : 'text-slate-400'}`}><span className="truncate">{t.name}</span></button>
                                      </div>
                                      <button onClick={(e) => { e.stopPropagation(); handleCorrectTopicTime(sub.id, t); }} className="text-slate-600 hover:text-white p-1" title="Fix Timer Log"><History size={12} /></button>
                                    </div>
                                    {(t.time > 0 || t.timeSpent > 0) && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden">
                                          <div className={`h-full ${isOvertime ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${isOvertime ? 100 : progress}%` }} />
                                        </div>
                                        <span className={`text-[10px] ${isOvertime ? 'text-amber-500' : 'text-slate-500'} font-mono`}>{formatTime(t.timeSpent)} / {formatTime(t.time)}</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- FLOATING WIDGET --- */}
        {focusMode === 'minimized' && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl w-72 animate-in slide-in-from-bottom-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                    {timerActive ? <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> : <span className="w-2 h-2 bg-amber-500 rounded-full" />}
                    {timerActive ? 'Focusing' : 'Paused'}
                  </div>
                  <div className="text-sm font-medium text-slate-200 truncate w-48 mt-1" title={focusTask?.topicName}>{focusTask?.topicName || "Select a task..."}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setFocusMode('expanded')} className="p-1 text-slate-500 hover:text-white" title="Maximize"><Maximize2 size={14} /></button>
                  <button onClick={() => setFocusMode('hidden')} className="p-1 text-slate-500 hover:text-white" title="Close"><X size={14} /></button>
                </div>
              </div>
              <div className="text-5xl font-mono font-bold text-white tracking-wider text-center py-2">{formatTimerDisplay(timerTime)}</div>
              <div className="flex justify-center gap-4 mt-2">
                <button onClick={() => { if (!focusTask) { alert("Select a task first!"); setFocusMode('expanded'); return; } setTimerActive(!timerActive); }} disabled={!focusTask} className={`p-3 rounded-full text-white transition-all ${!focusTask ? 'bg-slate-800 cursor-not-allowed' : (timerActive ? 'bg-slate-800 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500')}`}>{timerActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
                <button onClick={() => { setTimerActive(false); setTimerTime(focusDuration * 60); }} className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white"><RotateCcw size={18} /></button>
                {focusTask && (<button onClick={() => { const topicObj = syllabus.find(s => s.id === focusTask.subId)?.topics.find(t => t.name === focusTask.topicName); if (topicObj) toggleTopic(focusTask.subId, focusTask.topicName); setFocusTask(null); }} className="p-3 rounded-full bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50" title="Mark Complete"><CheckCircle size={18} /></button>)}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;