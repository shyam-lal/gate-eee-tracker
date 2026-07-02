import { useState, useRef, useEffect } from 'react';
import { Mail, User, Loader2 } from 'lucide-react';
import { auth } from '../services/api';
import { auth as firebaseAuth, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

export default function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    const [activeVideo, setActiveVideo] = useState('chilling-left');
    const [isAnimating, setIsAnimating] = useState(false);

    const videoChillingLeftRef = useRef(null);
    const videoRunningLToRRef = useRef(null);
    const videoRunningRToLRef = useRef(null);

    const handleAuthResult = async (userCredential, displayName) => {
        // Wait for token to be set by onIdTokenChanged, or set it directly to be safe
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);

        const res = await auth.sync(userCredential.user, displayName);
        localStorage.setItem('user', JSON.stringify(res.user));
        onLogin(res.user);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            let userCredential;
            let displayName = formData.username;
            if (isLogin) {
                userCredential = await signInWithEmailAndPassword(firebaseAuth, formData.email, formData.password);
            } else {
                userCredential = await createUserWithEmailAndPassword(firebaseAuth, formData.email, formData.password);
            }
            await handleAuthResult(userCredential, displayName);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setLoading(true);
        try {
            const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
            await handleAuthResult(userCredential);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        const nextIsLogin = !isLogin;
        setIsLogin(nextIsLogin);
        setError(null);

        if (nextIsLogin) {
            // Switch back to Login
            setActiveVideo('running-r-to-l');
            if (videoRunningRToLRef.current) {
                videoRunningRToLRef.current.currentTime = 0;
                videoRunningRToLRef.current.play().catch(e => console.log(e));
                videoRunningRToLRef.current.onended = () => {
                    setActiveVideo('chilling-left');
                    setIsAnimating(false);
                    if (videoChillingLeftRef.current) {
                        videoChillingLeftRef.current.currentTime = 0;
                        videoChillingLeftRef.current.play().catch(e => console.log(e));
                    }
                };
            } else {
                setIsAnimating(false);
            }
        } else {
            // Switch to Signup
            setActiveVideo('running-l-to-r');
            if (videoRunningLToRRef.current) {
                videoRunningLToRRef.current.currentTime = 0;
                videoRunningLToRRef.current.play().catch(e => console.log(e));
                videoRunningLToRRef.current.onended = () => {
                    setIsAnimating(false);
                };
            } else {
                setIsAnimating(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#fdf3eb] flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl h-[600px] bg-white rounded-3xl overflow-hidden shadow-2xl flex border border-surface-200">

                {/* Background Videos */}
                <video
                    ref={videoChillingLeftRef}
                    className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${activeVideo === 'chilling-left' ? 'opacity-100' : 'opacity-0'}`}
                    src="/fox-chilling-left.mp4"
                    muted
                    loop
                    playsInline
                    autoPlay
                />

                <video
                    ref={videoRunningLToRRef}
                    className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${activeVideo === 'running-l-to-r' ? 'opacity-100' : 'opacity-0'}`}
                    src="/fox-running-left-to-right.mp4"
                    muted
                    playsInline
                />

                <video
                    ref={videoRunningRToLRef}
                    className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300 ${activeVideo === 'running-r-to-l' ? 'opacity-100' : 'opacity-0'}`}
                    src="/fox-running-right-to-left.mp4"
                    muted
                    playsInline
                />

                {/* Sliding Form Container */}
                <div
                    className={`absolute top-0 bottom-0 w-full md:w-1/2 bg-white z-10 flex flex-col justify-center px-8 md:px-12 transition-all duration-700 ease-in delay-200 ${isLogin ? 'left-0 md:left-1/2' : 'left-0'
                        }`}
                >
                    <div className="w-full max-w-sm mx-auto">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
                                {isLogin ? 'Log in' : 'Sign up'}
                            </h1>
                            <p className="text-slate-500 text-sm">Start your learning journey</p>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-3 rounded-xl mb-6 text-xs font-bold text-center">
                                {error}
                            </div>
                        )}



                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div className="relative">
                                    <input
                                        type="text" placeholder="Username" required
                                        className="bg-slate-100 w-full outline-none text-slate-800 placeholder-slate-400 text-sm font-medium p-4 rounded-full border border-transparent focus:border-[#34A853] transition-colors"
                                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        disabled={isAnimating}
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <input
                                    type="email" placeholder="Email" required
                                    className="bg-slate-100 w-full outline-none text-slate-800 placeholder-slate-400 text-sm font-medium p-4 rounded-full border border-transparent focus:border-[#34A853] transition-colors"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={isAnimating}
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="password" placeholder="Password" required
                                    className="bg-slate-100 w-full outline-none text-slate-800 placeholder-slate-400 text-sm font-medium p-4 rounded-full border border-transparent focus:border-[#34A853] transition-colors"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    disabled={isAnimating}
                                />
                            </div>

                            <button disabled={loading || isAnimating} className={`w-full bg-[#34A853] hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-md mt-6`}>
                                {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? "Let's start!" : 'Sign up with Email')}
                            </button>
                        </form>


                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-slate-400 text-xs font-bold uppercase">or</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading || isAnimating}
                            className={`w-full ${!isLogin ? 'bg-[#1a73e8] text-white hover:bg-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-sm mb-4 mt-4`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                <path fill="none" d="M1 1h22v22H1z" />
                            </svg>
                            {isLogin ? 'Log in with Google' : 'Sign up with Google'}
                        </button>


                        <p className="text-center mt-6 text-slate-500 text-xs font-bold">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={toggleMode}
                                type="button"
                                disabled={isAnimating}
                                className={`text-[#34A853] ml-1 hover:underline ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLogin ? "Sign up" : "Log in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
