import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X } from 'lucide-react';
import Auth from '../Auth';

const AuthModal = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  title = "Target Your Identified Weak Spots",
  subtitle = "Create a free account to unlock targeted flashcards and generate an auto-recovery study plan based on your diagnostic results."
}) => {
  if (!isOpen) return null;

  const handleLogin = async (user) => {
    const guestDataStr = localStorage.getItem('vault_guest_diagnostic');
    if (guestDataStr) {
      try {
        const guestData = JSON.parse(guestDataStr);
        const token = localStorage.getItem('token');
        if (token) {
          await fetch('/api/diagnostics/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(guestData)
          });
        }
        localStorage.removeItem('vault_guest_diagnostic');
      } catch (err) {
        console.error('Failed to sync guest diagnostic data', err);
      }
    }
    
    if (onLoginSuccess) {
      onLoginSuccess(user);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-white shadow-2xl rounded-3xl w-full max-w-xl flex flex-col z-10 border border-slate-100 max-h-[95vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="p-6 pb-2 text-center flex-shrink-0 pt-8">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{title}</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {subtitle}
              </p>
            </div>
            
            {/* Auth Form (Embedded - No scrollbar) */}
            <div className="p-4 px-6 flex-1">
               <Auth onLogin={handleLogin} embedded={true} />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center flex-shrink-0">
              <button 
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors uppercase tracking-wider"
              >
                Continue previewing dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
