import React from 'react';
import { Coffee, Shield, Zap, Star } from 'lucide-react';

const SAFEGUARD_CONFIG = {
    is_buffer_day: {
        label: 'Buffer Day',
        icon: Coffee,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        description: 'Revision-only rest day',
    },
    is_inactive_restart: {
        label: 'Welcome Back',
        icon: Star,
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        description: 'Light restart after break',
    },
    is_first_plan: {
        label: 'First Plan',
        icon: Zap,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        description: 'Easy onboarding plan',
    },
};

const SafeguardBadge = ({ safeguards }) => {
    if (!safeguards) return null;

    const active = Object.entries(SAFEGUARD_CONFIG).filter(
        ([key]) => safeguards[key]
    );

    if (active.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {active.map(([key, config]) => {
                const Icon = config.icon;
                return (
                    <span
                        key={key}
                        className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${config.color}`}
                        title={config.description}
                    >
                        <Icon size={10} />
                        {config.label}
                    </span>
                );
            })}
        </div>
    );
};

export default SafeguardBadge;
