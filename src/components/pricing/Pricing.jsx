import React, { useState, useEffect } from 'react';
import { subscriptions } from '../../services/api';
import { Check, Shield, Zap, Sparkles, ArrowLeft, Loader2, Crown, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const Pricing = ({ user, onBack, onUpgradeSuccess }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingPlanId, setProcessingPlanId] = useState(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await subscriptions.getPlans();
            setPlans(data);
        } catch (error) {
            console.error('Failed to load plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (plan) => {
        setProcessingPlanId(plan.id);
        try {
            const res = await loadRazorpayScript();
            if (!res) {
                alert("Razorpay SDK failed to load. Are you online?");
                setProcessingPlanId(null);
                return;
            }

            // Create Order on Backend
            const orderData = await subscriptions.createOrder(plan.id);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key',
                amount: orderData.amount,
                currency: orderData.currency,
                name: "GATE EE Tracker",
                description: `Upgrade to ${plan.name} Tier`,
                image: "https://cdn-icons-png.flaticon.com/512/355/355088.png",
                order_id: orderData.order_id,
                handler: async function (response) {
                    try {
                        const verificationData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan_id: plan.id
                        };
                        
                        await subscriptions.verifyPayment(verificationData);

                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#3b82f6', '#10b981', '#f59e0b']
                        });

                        if (onUpgradeSuccess) {
                            onUpgradeSuccess(plan.name);
                        }
                    } catch (err) {
                        alert("Payment Verification Failed: " + err.message);
                    }
                },
                prefill: {
                    name: user?.username || '',
                    email: user?.email || '',
                },
                theme: {
                    color: "#3b82f6"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', function (response) {
                alert(response.error.description);
            });
            paymentObject.open();

        } catch (error) {
            console.error(error);
            alert("Failed to initiate checkout: " + error.message);
        } finally {
            setProcessingPlanId(null);
        }
    };

    const getPlanIcon = (name) => {
        if (name.toLowerCase().includes('premium')) return <Crown className="text-amber-400" size={24} />;
        if (name.toLowerCase().includes('pro')) return <Zap className="text-primary-400" size={24} />;
        return <Shield className="text-slate-400" size={24} />;
    };

    const getPlanHighlightProps = (name) => {
        if (name.toLowerCase().includes('premium')) {
            return {
                bg: 'bg-gradient-to-br from-amber-500/10 to-orange-600/10',
                border: 'border-amber-500/50',
                button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]',
                popularBadge: true
            };
        }
        if (name.toLowerCase().includes('pro')) {
            return {
                bg: 'bg-surface-900',
                border: 'border-primary-500/30 hover:border-primary-500/50',
                button: 'bg-primary-600 hover:bg-primary-500 text-white',
                popularBadge: false
            };
        }
        return {
            bg: 'bg-surface-900/50',
            border: 'border-surface-800',
            button: 'bg-surface-800 hover:bg-surface-700 text-heading',
            popularBadge: false
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <Loader2 size={40} className="text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in">
            {/* Header / Back Button */}
            <div className="max-w-7xl mx-auto mb-12">
                <button onClick={onBack} className="p-2 hover:bg-surface-800 rounded-xl text-surface-400 hover:text-heading transition-colors flex items-center gap-2">
                    <ArrowLeft size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                </button>
            </div>

            {/* Pricing Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 mb-6">
                    <Sparkles size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Level Up Your Preparation</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-heading uppercase tracking-tighter mb-4">
                    Choose Your <span className="bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">Arsenal</span>
                </h1>
                <p className="text-surface-400 text-lg">
                    Unlock advanced analytics, AI flashcards, and priority support to ace your GATE exams.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {plans.map((plan) => {
                    const styleProps = getPlanHighlightProps(plan.name);
                    const features = Array.isArray(plan.features) ? plan.features : (plan.features ? plan.features.split(',') : []);

                    return (
                        <div 
                            key={plan.id}
                            className={`relative rounded-3xl border p-8 flex flex-col h-full transition-all duration-300 transform hover:-translate-y-2 ${styleProps.bg} ${styleProps.border} ${styleProps.popularBadge ? 'shadow-2xl shadow-amber-500/10 z-10 scale-105' : 'shadow-xl shadow-black/20 z-0'}`}
                        >
                            {styleProps.popularBadge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-2xl ${styleProps.popularBadge ? 'bg-amber-500/20' : 'bg-surface-800'}`}>
                                    {getPlanIcon(plan.name)}
                                </div>
                                <h3 className="text-2xl font-black text-heading tracking-tighter">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-black text-heading tracking-tighter">
                                    {plan.price > 0 ? `₹${plan.price}` : 'Free'}
                                </span>
                                {plan.price > 0 && <span className="text-surface-500 ml-2 font-bold">/ {plan.duration_months} mo</span>}
                            </div>

                            <div className="flex-1">
                                <ul className="space-y-4 mb-8">
                                    {features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-surface-300">
                                            <CheckCircle size={18} className={styleProps.popularBadge ? 'text-amber-400 shrink-0 mt-0.5' : 'text-primary-500 shrink-0 mt-0.5'} />
                                            <span>{feature.trim()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => handleUpgrade(plan)}
                                disabled={processingPlanId === plan.id || plan.price <= 0}
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${styleProps.button} ${plan.price <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {processingPlanId === plan.id ? (
                                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                ) : plan.price <= 0 ? (
                                    'Current Plan'
                                ) : (
                                    'Upgrade Now'
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Pricing;
