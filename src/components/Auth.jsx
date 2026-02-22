import { useState } from 'react';
import { Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '../services/api';

export default function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            let res;
            if (isLogin) {
                res = await auth.login(formData.email, formData.password);
            } else {
                res = await auth.register(formData.username, formData.email, formData.password);
            }
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            onLogin(res.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">GATE <span className="text-indigo-500">VAULT</span></h1>
                    <p className="text-slate-500 text-sm">Sign in to sync your progress across devices.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-xl mb-6 text-xs font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-3 border border-slate-700 focus-within:border-indigo-500 transition-colors">
                            <User size={18} className="text-slate-500" />
                            <input
                                type="text" placeholder="Username" required
                                className="bg-transparent w-full outline-none text-white placeholder-slate-600 text-sm font-medium"
                                value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    )}
                    <div className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-3 border border-slate-700 focus-within:border-indigo-500 transition-colors">
                        <Mail size={18} className="text-slate-500" />
                        <input
                            type="email" placeholder="Email Address" required
                            className="bg-transparent w-full outline-none text-white placeholder-slate-600 text-sm font-medium"
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-3 border border-slate-700 focus-within:border-indigo-500 transition-colors">
                        <Lock size={18} className="text-slate-500" />
                        <input
                            type="password" placeholder="Password" required
                            className="bg-transparent w-full outline-none text-white placeholder-slate-600 text-sm font-medium"
                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 mt-4">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <p className="text-center mt-6 text-slate-500 text-xs font-bold">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 ml-1 hover:underline">
                        {isLogin ? "Register" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
}
