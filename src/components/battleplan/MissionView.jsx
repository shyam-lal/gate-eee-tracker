import React from 'react';
import { Trophy, Flame } from 'lucide-react';
import TaskCard from './TaskCard';

const MissionView = ({ plan, onComplete, onSkip, onStart, actionLoading }) => {
    if (!plan) return null;

    const { current_task, tasks, status, summary } = plan;
    const pendingTasks = tasks?.filter(t => t.status === 'PENDING') || [];
    const completedTasks = tasks?.filter(t => t.status === 'COMPLETED') || [];
    const skippedTasks = tasks?.filter(t => t.status === 'SKIPPED') || [];
    const allDone = status === 'COMPLETED';

    return (
        <div className="space-y-4">
            {/* Current Task Hero Card */}
            {current_task && !allDone && (
                <TaskCard
                    task={current_task}
                    variant="hero"
                    onComplete={onComplete}
                    onSkip={onSkip}
                    actionLoading={actionLoading}
                />
            )}

            {/* All Done Card */}
            {allDone && (
                <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl shadow-emerald-500/10">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto">
                        <Trophy size={40} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-heading uppercase tracking-tighter">Mission Complete</h2>
                    <p className="text-body opacity-80 text-sm">You've conquered today's battle plan. Rest up and come back stronger tomorrow.</p>
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                        <Flame size={16} fill="currentColor" />
                        <span className="text-lg font-black">{summary?.streak || 0} day streak</span>
                    </div>
                </div>
            )}

            {/* Pending Tasks Queue */}
            {pendingTasks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-body opacity-60 uppercase tracking-[0.3em] px-1 pt-2">
                        Up Next · {pendingTasks.length} remaining
                    </h3>
                    {pendingTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            variant="queue"
                            onStart={onStart}
                            onComplete={onComplete}
                            onSkip={onSkip}
                            actionLoading={actionLoading}
                        />
                    ))}
                </div>
            )}

            {/* Completed Tasks (collapsed) */}
            {completedTasks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-body opacity-60 uppercase tracking-[0.3em] px-1 pt-2">
                        Completed · {completedTasks.length} tasks
                    </h3>
                    {completedTasks.map(task => (
                        <TaskCard key={task.id} task={task} variant="queue" />
                    ))}
                </div>
            )}

            {/* Skipped Tasks */}
            {skippedTasks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-body opacity-60 uppercase tracking-[0.3em] px-1 pt-2">
                        Skipped · {skippedTasks.length}
                    </h3>
                    {skippedTasks.map(task => (
                        <TaskCard key={task.id} task={task} variant="queue" />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MissionView;
