import React from 'react';
import { Coins } from 'lucide-react';
import { useCredits } from '../contexts/CreditContext';

const CreditBadge = ({ onClick }) => {
    const { credits, loading } = useCredits();

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="w-8 h-4 rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
        );
    }

    const isLowCredits = credits <= 5;
    
    return (
        <button
            onClick={() => onClick ? onClick() : null}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm transition-all duration-200
                hover:shadow-md active:scale-95 border
                ${isLowCredits 
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                }
            `}
            title={isLowCredits ? "Low credits! Click to top up." : "Your credit balance"}
        >
            <Coins className={`w-4 h-4 ${isLowCredits ? 'animate-bounce' : ''}`} />
            <span>{credits}</span>
        </button>
    );
};

export default CreditBadge;
