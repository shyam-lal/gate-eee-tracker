import React, { useEffect, useState } from 'react';
import { user as userApi } from '../../services/api';
import { Loader2, ArrowUpRight, ArrowDownRight, Clock, Box } from 'lucide-react';
import { useCredits } from '../../contexts/CreditContext';

const CreditHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { credits } = useCredits();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await userApi.getTransactions();
                setTransactions(res.transactions || []);
            } catch (err) {
                console.error('Failed to fetch transactions', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const formatTimestamp = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getTransactionLabel = (tx) => {
        switch(tx.transaction_type) {
            case 'FLASHCARD_GENERATION':
                return 'AI Flashcard Generation';
            case 'PURCHASE':
                return 'Credit Top-Up';
            case 'REFUND':
                return 'API Failure Refund';
            default:
                return tx.transaction_type;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-surface-400">
                <Loader2 className="animate-spin w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
            <div className="bg-surface-900 border border-surface-800 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-heading uppercase tracking-tighter">Current Balance</h2>
                    <p className="text-sm text-surface-400 font-medium">Available for AI Generations</p>
                </div>
                <div className="text-4xl font-black text-heading bg-primary-500/10 text-primary-400 px-6 py-2 rounded-2xl border border-primary-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                    {credits}
                </div>
            </div>

            <h3 className="text-sm font-black text-surface-400 uppercase tracking-widest pl-2">Transaction History</h3>

            {transactions.length === 0 ? (
                <div className="bg-surface-900 border border-surface-800 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center text-surface-500 mb-4">
                        <Box size={32} />
                    </div>
                    <h3 className="text-lg font-black text-heading uppercase tracking-tighter mb-2">No History Yet</h3>
                    <p className="text-sm text-surface-400 max-w-sm">
                        Your audit history is empty. Generate your first AI deck or purchase a top-up pack to get started!
                    </p>
                </div>
            ) : (
                <div className="bg-surface-900 border border-surface-800 rounded-3xl overflow-hidden shadow-sm divide-y divide-surface-800/50">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface-800/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {tx.amount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-heading text-sm">{getTransactionLabel(tx)}</p>
                                    <p className="text-xs text-surface-500 flex items-center gap-1.5 mt-0.5">
                                        <Clock size={12} /> {formatTimestamp(tx.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className={`font-black text-sm sm:text-base ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount} Credits
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CreditHistory;
