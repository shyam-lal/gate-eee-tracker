import React, { useState, useEffect } from 'react';
import { battlePlan as api } from '../../services/api';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

// Components
import CommandCenter from './CommandCenter';
import MissionView from './MissionView';
import CompletionFeedback from './CompletionFeedback';
import RoadmapDrawer from './RoadmapDrawer';
import SettingsPanel from './SettingsPanel';
import BattlePlanSetup from './BattlePlanSetup';
import { onboarding as onboardingApi } from '../../services/api';

/**
 * BattlePlan v2 — Orchestrator
 * 
 * Three layers:
 *  1. CommandCenter (always visible) — readiness, countdown, streak, weekly hours
 *  2. MissionView (always visible below) — today's tasks with hero card
 *  3. RoadmapDrawer (expandable overlay) — strategic overview
 *  + SettingsPanel (modal) — edit daily hours & target date
 *  + CompletionFeedback (modal) — post-complete with feedback
 */
const BattlePlan = ({ onBack }) => {
    // ─── State ───
    const [plan, setPlan] = useState(null);
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // UI panels
    const [showRoadmap, setShowRoadmap] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Completion modal
    const [completeModal, setCompleteModal] = useState(null); // task object
    const [actualMinutes, setActualMinutes] = useState('');

    // Setup
    const [needsSetup, setNeedsSetup] = useState(false);
    const [subjects, setSubjects] = useState([]);

    // ─── Data Loading ───
    useEffect(() => {
        loadPlan();
        loadRoadmap();
    }, []);

    const loadPlan = async () => {
        setLoading(true);
        setError(null);
        try {
            // Check if setup is needed
            const status = await onboardingApi.getStatus();
            if (status.enrollment && (!status.enrollment.learning_preferences || !status.enrollment.learning_preferences.mode)) {
                setNeedsSetup(true);
                // Also fetch subjects for the setup screen from syllabus
                // Wait, BattlePlan's roadmap might have it, but we need it before roadmap
                // Actually, syllabus api can fetch it, or exams.getSyllabus
            }

            const data = await api.getToday();
            setPlan(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadRoadmap = async () => {
        try {
            const data = await api.getRoadmap();
            setRoadmap(data);
            if (data.subjects) setSubjects(data.subjects);
        } catch (err) {
            console.warn('Failed to load roadmap:', err.message);
            // Non-blocking — roadmap data is supplementary
        }
    };

    // ─── Task Actions ───
    const handleStartTask = async (taskId) => {
        setActionLoading(taskId);
        try {
            const data = await api.startTask(taskId);
            setPlan(data);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const handleCompleteTask = async (taskId) => {
        const task = plan?.tasks?.find(t => t.id === taskId) || plan?.current_task;
        if (!task) return;
        setCompleteModal(task);
        setActualMinutes(String(task.duration_minutes || ''));
    };

    const submitComplete = async (selfRating) => {
        if (!completeModal) return;
        setActionLoading(completeModal.id);
        try {
            const data = await api.completeTask(completeModal.id, parseInt(actualMinutes) || 0, selfRating);
            setPlan(data);
            setCompleteModal(null);
            // Refresh roadmap to update readiness score
            loadRoadmap();
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const handleSkipTask = async (taskId) => {
        if (!confirm('Skip this task? It will be rescheduled for tomorrow with a priority boost.')) return;
        setActionLoading(taskId);
        try {
            const data = await api.skipTask(taskId);
            setPlan(data);
        } catch (err) { alert(err.message); }
        finally { setActionLoading(null); }
    };

    const handleRegenerate = async () => {
        if (!confirm('Regenerate today\'s plan? This will replace all current tasks.')) return;
        setLoading(true);
        try {
            const data = await api.regenerate();
            setPlan(data);
            loadRoadmap();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    // ─── Settings ───
    const handleSaveSettings = async (settingsData) => {
        const result = await api.updateSettings(settingsData);
        // Refresh roadmap to reflect new settings
        loadRoadmap();
        // Update plan settings in-memory
        if (plan) {
            setPlan(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    ...result,
                },
            }));
        }
        return result;
    };

    const handleRegenerateFromSettings = async () => {
        setShowSettings(false);
        await handleRegenerate();
    };

    const handleSetupComplete = async () => {
        setNeedsSetup(false);
        await handleRegenerate();
    };

    // ─── Loading State ───
    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto" />
                    <p className="text-surface-500 text-xs font-black uppercase tracking-widest">Generating Battle Plan...</p>
                </div>
            </div>
        );
    }

    // ─── Error State ───
    if (error) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto">
                        <AlertCircle size={40} className="text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-heading text-xl font-black uppercase tracking-tighter mb-2">Plan Unavailable</h2>
                        <p className="text-surface-400 text-sm">{error}</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button onClick={onBack} className="px-6 py-3 bg-surface-800 text-heading rounded-2xl font-black text-xs uppercase tracking-widest">Back</button>
                        <button onClick={loadPlan} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!plan) return null;

    return (
        <div className="min-h-screen bg-transparent text-surface-400 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[var(--color-glow1)] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[var(--color-glow2)] rounded-full blur-[120px] pointer-events-none" />

            {/* Header nav */}
            <header className="relative z-20 px-4 sm:px-6 lg:px-8 pt-6 pb-2 max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="p-2 text-surface-500 hover:text-heading transition-colors rounded-xl hover:bg-surface-800/50">
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        onClick={handleRegenerate}
                        className="p-2 text-surface-500 hover:text-primary-400 transition-colors rounded-xl hover:bg-surface-800/50"
                        title="Regenerate plan"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 space-y-6">
                {/* Layer 1: Command Center */}
                <CommandCenter
                    plan={plan}
                    roadmap={roadmap}
                    onOpenSettings={() => setShowSettings(true)}
                    onOpenRoadmap={() => setShowRoadmap(true)}
                />

                {/* Layer 2: Today's Mission */}
                <MissionView
                    plan={plan}
                    onComplete={handleCompleteTask}
                    onSkip={handleSkipTask}
                    onStart={handleStartTask}
                    actionLoading={actionLoading}
                />
            </main>

            {/* Layer 3: Roadmap Drawer (overlay) */}
            <RoadmapDrawer
                roadmap={roadmap}
                isOpen={showRoadmap}
                onClose={() => setShowRoadmap(false)}
            />

            {/* Settings Panel (modal) */}
            {showSettings && (
                <SettingsPanel
                    settings={plan?.settings || roadmap?.settings}
                    onSave={handleSaveSettings}
                    onClose={() => setShowSettings(false)}
                    onRegenerate={handleRegenerateFromSettings}
                />
            )}

            {/* Completion Feedback (modal) */}
            {completeModal && (
                <CompletionFeedback
                    task={completeModal}
                    actualMinutes={actualMinutes}
                    setActualMinutes={setActualMinutes}
                    onConfirm={submitComplete}
                    onCancel={() => setCompleteModal(null)}
                    isLoading={actionLoading === completeModal.id}
                />
            )}

            {/* Setup flow if needed */}
            {needsSetup && (
                <BattlePlanSetup
                    subjects={subjects}
                    onComplete={handleSetupComplete}
                />
            )}
        </div>
    );
};

export default BattlePlan;
