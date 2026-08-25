import React, { useState, useEffect } from 'react';
import { 
    CheckCircle2, 
    BarChart3, 
    Timer, 
    Search, 
    Bell, 
    Settings,
    User
} from 'lucide-react';
import FullPYQTab from './FullPYQTab';
import CustomRevisionTab from './CustomRevisionTab';
import PYQTestEngine from './PYQTestEngine';
import { pyq as pyqApi } from '../../services/api';

const API_BASE = '/api';

const PYQDashboard = ({ user }) => {
    const [view, setView] = useState('tabs'); // 'tabs', 'test', 'results'
    const [activeTab, setActiveTab] = useState('full'); // 'full', 'custom', 'weak'
    const [activePaper, setActivePaper] = useState(null);
    const [activeAttempt, setActiveAttempt] = useState(null);
    const [stats, setStats] = useState({ totalSolved: 0, accuracy: 0, timeEfficiency: '0.0' });
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [statsRes, papersRes] = await Promise.all([
                fetch(`${API_BASE}/pyq/stats`, { headers }),
                fetch(`${API_BASE}/pyq/papers`, { headers })
            ]);

            if (statsRes.ok) {
                const s = await statsRes.json();
                setStats(s);
            }
            if (papersRes.ok) {
                const p = await papersRes.json();
                setPapers(p);
            }
        } catch (err) {
            console.error('Error fetching PYQ data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = (paper, attempt) => {
        setActivePaper(paper);
        setActiveAttempt(attempt);
        setView('test');
    };

    const handleTestComplete = (result) => {
        setActiveAttempt(result);
        setView('results'); // Need a PYQTestResults component later, for now we can just show an alert and go back
        alert('Test completed! Check your stats later.');
        setView('tabs');
        setActivePaper(null);
        setActiveAttempt(null);
        fetchData();
    };

    const goBack = () => {
        setView('tabs');
        setActivePaper(null);
        setActiveAttempt(null);
        fetchData();
    };

    if (view === 'test' && activePaper && activeAttempt) {
        return (
            <PYQTestEngine 
                paper={activePaper} 
                attempt={activeAttempt} 
                mode="exam" 
                onComplete={handleTestComplete} 
                onExit={goBack} 
            />
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-transparent p-6 md:p-10 font-sans text-surface-400">
            {/* Top Bar - Keeping profile icon as requested, skipping search bar */}
            <div className="flex justify-end items-center mb-8 gap-4 text-surface-500">
                <button className="hover:text-heading transition-colors">
                    <Bell size={20} />
                </button>
                <button className="hover:text-heading transition-colors">
                    <Settings size={20} />
                </button>
                <div className="w-8 h-8 rounded-full bg-surface-800 overflow-hidden ml-2 border border-surface-700">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-500/10 text-primary-400 font-bold text-sm">
                            {user?.username ? user.username.charAt(0).toUpperCase() : <User size={16}/>}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface-900 rounded-2xl p-6 flex items-center gap-4 border border-surface-800">
                    <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-surface-500 font-bold uppercase tracking-widest">Total PYQs Solved</div>
                        <div className="text-3xl font-black text-heading mt-1">{stats.totalSolved}</div>
                    </div>
                </div>
                <div className="bg-surface-900 rounded-2xl p-6 flex items-center gap-4 border border-surface-800">
                    <div className="w-12 h-12 rounded-full bg-surface-800 text-surface-400 flex items-center justify-center">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-surface-500 font-bold uppercase tracking-widest">Average Accuracy</div>
                        <div className="text-3xl font-black text-heading mt-1">{stats.accuracy}%</div>
                    </div>
                </div>
                <div className="bg-surface-900 rounded-2xl p-6 flex items-center gap-4 border border-surface-800">
                    <div className="w-12 h-12 rounded-full bg-surface-800 text-surface-400 flex items-center justify-center">
                        <Timer size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-surface-500 font-bold uppercase tracking-widest">Time Efficiency</div>
                        <div className="text-3xl font-black text-heading mt-1">{stats.timeEfficiency}m / q</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-surface-800 mb-8 font-medium">
                <button 
                    onClick={() => setActiveTab('full')}
                    className={`pb-4 px-2 transition-colors relative ${activeTab === 'full' ? 'text-heading font-bold' : 'text-surface-500 hover:text-surface-400'}`}
                >
                    Full PYQ Simulations
                    {activeTab === 'full' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('custom')}
                    className={`pb-4 px-2 transition-colors relative ${activeTab === 'custom' ? 'text-heading font-bold' : 'text-surface-500 hover:text-surface-400'}`}
                >
                    Custom Revision Sets
                    {activeTab === 'custom' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('weak')}
                    className={`pb-4 px-2 transition-colors relative ${activeTab === 'weak' ? 'text-heading font-bold' : 'text-surface-500 hover:text-surface-400'}`}
                >
                    Weak Areas Focus
                    {activeTab === 'weak' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full"></div>}
                </button>
            </div>

            {/* Tab Content */}
            <div className="w-full">
                {activeTab === 'full' && <FullPYQTab papers={papers} loading={loading} onStartTest={handleStartTest} />}
                {activeTab === 'custom' && <CustomRevisionTab />}
                {activeTab === 'weak' && (
                    <div className="text-center py-20 text-surface-500">
                        Weak Areas Focus is coming soon!
                    </div>
                )}
            </div>
        </div>
    );
};

export default PYQDashboard;
