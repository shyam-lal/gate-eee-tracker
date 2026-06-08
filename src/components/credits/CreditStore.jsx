import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { useCredits } from '../../contexts/CreditContext';
import { user as userApi } from '../../services/api'; // We'll add this to api.js

const pricingTiers = [
    {
        id: 'pack_starter',
        name: 'Starter',
        credits: 200,
        price: 49,
        decks: 20,
        efficiency: '₹2.45',
        features: [
            'Basic generation speed',
            'Semantic caching included',
            'No expiry date'
        ],
        recommended: false
    },
    {
        id: 'pack_value',
        name: 'Value',
        credits: 500,
        price: 100,
        decks: 50,
        efficiency: '₹2.00',
        features: [
            'Priority generation speed',
            'Semantic caching included',
            'Advanced LaTeX formatting',
            'No expiry date'
        ],
        recommended: true
    },
    {
        id: 'pack_pro',
        name: 'Pro',
        credits: 1000,
        price: 140,
        decks: 100,
        efficiency: '₹1.40',
        features: [
            'Maximum generation speed',
            'Semantic caching included',
            'Priority support access',
            'No expiry date'
        ],
        recommended: false
    }
];

const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

const CreditStore = ({ onBack }) => {
    const { credits, refreshCredits } = useCredits();
    const [processingId, setProcessingId] = useState(null);

    const handlePurchase = async (tier) => {
        setProcessingId(tier.id);
        try {
            const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                return;
            }

            // API call to initialize payment session
            const session = await userApi.buyCreditSession(tier.id, tier.price);
            
            // Client-side gateway integration (Razorpay)
            const options = {
               key: session.key, // Should be passed securely from backend or ENV
               amount: session.amount,
               currency: session.currency,
               name: "GATE EEE Tracker",
               description: `${tier.credits} AI Credits (${tier.name})`,
               order_id: session.id,
               handler: async function (response) {
                  try {
                      await userApi.verifyCreditPayment({
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                          credits: tier.credits
                      });
                      await refreshCredits();
                      alert('Payment successful! Credits added to your account.');
                  } catch (err) {
                      console.error('Verification failed', err);
                      alert('Payment verification failed. Please contact support if amount was deducted.');
                  }
               },
               theme: {
                   color: "#3b82f6" // Primary color
               }
            };
            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response){
                console.error(response.error);
                alert(`Payment failed: ${response.error.description}`);
            });

            rzp.open();
        } catch (error) {
            console.error('Payment initialization failed:', error);
            alert('Could not initialize payment session. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="mb-10">
                <button 
                    onClick={() => onBack ? onBack() : window.history.back()} 
                    className="flex items-center gap-2 text-surface-400 hover:text-heading font-medium text-sm transition-colors mb-6"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-heading mb-2">Top Up Your Credits</h1>
                        <p className="text-surface-400 font-medium max-w-xl">
                            Unlock AI-powered flashcard generation instantly. Choose a credit pack that fits your study pace. One deck averages about 10 cards.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-2xl px-5 py-3 shadow-sm">
                        <div className="p-2 bg-primary-500/10 rounded-xl text-primary-400">
                            <Zap size={20} className="fill-current" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Current Balance</p>
                            <p className="text-xl font-bold text-heading leading-none mt-1">{credits} <span className="text-sm font-medium text-surface-400">credits</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
                {pricingTiers.map((tier) => (
                    <div 
                        key={tier.id}
                        className={`
                            relative flex flex-col bg-surface-900 rounded-3xl p-6 lg:p-8 transition-all duration-300
                            ${tier.recommended 
                                ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/10 md:-translate-y-4' 
                                : 'border border-surface-800 hover:border-surface-700 hover:shadow-lg'
                            }
                        `}
                    >
                        {tier.recommended && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                                Best Value
                            </div>
                        )}

                        <div className="mb-6 border-b border-surface-800 pb-6">
                            <h3 className="text-lg font-black text-heading mb-2">{tier.name}</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-black text-heading">₹{tier.price}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 bg-surface-950 text-primary-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-surface-800">
                                <Zap size={14} className="fill-current" /> {tier.credits} Credits
                            </div>
                        </div>

                        <div className="mb-8 flex-1">
                            <div className="mb-6 p-4 bg-surface-950 rounded-2xl border border-surface-800/50">
                                <p className="text-sm font-bold text-heading mb-1">Approx. {tier.decks} Topic Decks</p>
                                <p className="text-xs text-surface-400 font-medium">Efficiency: <span className="text-emerald-400 font-bold">{tier.efficiency}</span> per deck</p>
                            </div>

                            <ul className="space-y-3">
                                {tier.features.map((feat, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-surface-300 font-medium">
                                        <CheckCircle2 size={18} className="text-primary-500 shrink-0" />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => handlePurchase(tier)}
                            disabled={processingId !== null}
                            className={`
                                w-full h-[52px] rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2
                                ${tier.recommended
                                    ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20'
                                    : 'bg-surface-800 hover:bg-surface-700 text-heading'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {processingId === tier.id ? (
                                <><Loader2 size={18} className="animate-spin" /> Processing...</>
                            ) : (
                                'Buy Now'
                            )}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex items-center justify-center gap-2 text-surface-500 text-xs font-medium">
                <ShieldCheck size={16} /> Secure payments powered by UPI & standard payment gateways.
            </div>
        </div>
    );
};

export default CreditStore;
