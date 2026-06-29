import React from 'react';
import { Search, Timer, Bell } from 'lucide-react';
import CreditBadge from '../CreditBadge';

const Topbar = ({ 
    user, 
    showSearch, 
    searchQuery, 
    setSearchQuery, 
    onOpenProfile, 
    onOpenCreditStore, 
    onStartFocus 
}) => {
    return (
        <header className="h-20 px-4 md:px-8 flex items-center justify-between z-30">
            {/* Left side: Search (optional) */}
            <div className="flex-1">
                {showSearch && (
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" size={16} />
                        <input 
                            type="text"
                            placeholder="Search modules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery?.(e.target.value)}
                            className="w-full bg-surface-900 border border-surface-800 rounded-full py-3 pl-10 pr-4 text-sm text-heading placeholder:text-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
                        />
                    </div>
                )}
            </div>

            {/* Right side: Actions & Profile */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                {onOpenCreditStore && (
                    <div onClick={onOpenCreditStore} className="cursor-pointer hover:scale-105 transition-transform">
                        <CreditBadge />
                    </div>
                )}
                
                <button onClick={onStartFocus} className="text-surface-400 hover:text-heading transition-colors" title="Focus Timer">
                    <Timer size={20} />
                </button>
                
                <button className="text-surface-400 hover:text-heading transition-colors relative" title="Notifications">
                    <Bell size={20} />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-base"></div>
                </button>
                
                <button onClick={onOpenProfile} className="relative group ml-2">
                    <div className="w-9 h-9 bg-surface-800 rounded-full border border-surface-700 overflow-hidden group-hover:border-primary-500 transition-colors">
                        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-black text-sm">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-base"></div>
                </button>
            </div>
        </header>
    );
};

export default Topbar;
