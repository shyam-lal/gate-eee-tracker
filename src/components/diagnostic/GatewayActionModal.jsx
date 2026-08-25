import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Zap, UserPlus } from 'lucide-react';

const GatewayActionModal = ({ isOpen, onClose, onAction }) => {
  if (!isOpen) return null;

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
            className="relative bg-white shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden flex flex-col z-10 border border-slate-100"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="p-8 pb-4 text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Welcome to VAULT</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Choose how you'd like to proceed. Create a free account to track your progress, or take a quick diagnostic test to preview the tool.
              </p>
            </div>
            
            <div className="p-6 pt-2 flex flex-col gap-4">
              <button 
                onClick={() => onAction('signup')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-md group"
              >
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start text-left">
                  <span className="leading-tight">Create a Free Account</span>
                  <span className="text-[10px] font-normal text-emerald-100">Save progress and unlock all features</span>
                </div>
              </button>

              <button 
                onClick={() => onAction('diagnostic')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all group"
              >
                <Zap className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start text-left">
                  <span className="leading-tight">Take a 3-Min Diagnostic Test</span>
                  <span className="text-[10px] font-normal text-slate-500">Preview the dashboard as a guest</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GatewayActionModal;
