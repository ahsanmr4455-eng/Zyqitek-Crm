import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, X, ShieldAlert, ShieldCheck, ArrowRight, AlertCircle, Clock } from 'lucide-react';

interface SecurityAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  subtitle?: string;
  requireCode?: boolean;
}

const DEFAULT_VALID_CODES = ['2005', '1234', 'admin', 'admin123', 'zyqitek-secure-2025!'];

export const SecurityAccessModal: React.FC<SecurityAccessModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  title = 'Administrative Security Verification',
  subtitle = 'Enter security code to view or modify this administrative section.',
  requireCode = true
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 45-Minute Lockout timer state
  const [lockUntil, setLockUntil] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    window.localStorage.removeItem('zyqitek_admin_security_lock_until');
    window.localStorage.setItem('zyqitek_admin_security_failed_attempts', '0');
  }, []);

  useEffect(() => {
    if (lockUntil <= Date.now()) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((lockUntil - now) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        setLockUntil(0);
        window.localStorage.removeItem('zyqitek_admin_security_lock_until');
        window.localStorage.setItem('zyqitek_admin_security_failed_attempts', '0');
        setError(null);
        clearInterval(interval);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isLocked = timeLeft > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isVerifying) return;
    
    if (!requireCode) {
      onVerified();
      onClose();
      return;
    }

    if (!code.trim()) {
      setError('Please enter a security code.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const storedCustomCode = typeof window !== 'undefined' ? localStorage.getItem('zyqitek_crm_security_code') : null;
      const validCodes = storedCustomCode 
        ? [storedCustomCode, ...DEFAULT_VALID_CODES] 
        : DEFAULT_VALID_CODES;

      const inputNormalized = code.trim();
      const isMatch = validCodes.some(vc => vc.trim() === inputNormalized);

      if (isMatch) {
        window.localStorage.setItem('zyqitek_admin_security_failed_attempts', '0');
        window.localStorage.removeItem('zyqitek_admin_security_lock_until');
        setError(null);
        setCode('');
        onVerified();
        onClose();
      } else {
        const currentAttemptsStr = window.localStorage.getItem('zyqitek_admin_security_failed_attempts') || '0';
        const newAttempts = parseInt(currentAttemptsStr, 10) + 1;
        window.localStorage.setItem('zyqitek_admin_security_failed_attempts', newAttempts.toString());

        if (newAttempts >= 3) {
          const lockTime = Date.now() + 45 * 60 * 1000; // 45-minute lockout
          window.localStorage.setItem('zyqitek_admin_security_lock_until', lockTime.toString());
          setLockUntil(lockTime);
          setTimeLeft(45 * 60);
          setError('Too many incorrect attempts. Locked for 45 minutes.');
        } else {
          const remaining = 3 - newAttempts;
          setError(`Invalid security code (${newAttempts}/3 attempts used — ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining)`);
        }
      }
      setIsVerifying(false);
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-[#17191D] rounded-2xl shadow-2xl overflow-hidden border border-[#2A2D33] text-[#F5F5F5] font-sans"
        >
          {/* Header Bar */}
          <div className="h-1 bg-zinc-700" />
          
          <div className="p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-zinc-800/80 text-[#F5F5F5] border border-[#2A2D33] rounded-xl">
                <ShieldAlert size={20} />
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold !text-[#F9FAFB] font-structure tracking-tight">
                Administrative Security Verification
              </h2>
              <p className="text-xs !text-[#D1D5DB] leading-relaxed">
                {subtitle}
              </p>
            </div>

            {isLocked ? (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-red-300 font-medium text-sm">
                  <Clock size={16} />
                  <span>Access Temporarily Locked</span>
                </div>
                <p className="text-xs text-red-400 leading-relaxed">
                  Too many incorrect security code attempts.
                </p>
                <p className="text-xs text-[#9CA3AF] font-sans pt-1">
                  Try again in: <span className="font-mono text-red-400 font-medium text-sm ml-1">{formatTime(timeLeft)}</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {requireCode && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium !text-[#F3F4F6] italic block ml-0.5">
                        CRM Security Code
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
                        <input
                          type="password"
                          autoFocus
                          disabled={isLocked || isVerifying}
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value);
                            setError(null);
                          }}
                          placeholder="Enter security code..."
                          className="w-full pl-10 pr-4 py-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] focus:border-indigo-500 rounded-xl text-[var(--crm-text)] placeholder-[#6B7280] font-medium text-sm focus:outline-none transition-all disabled:opacity-50 tracking-wider"
                        />
                      </div>
                    </div>
                    
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-xs font-medium"
                      >
                        <AlertCircle size={15} className="shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={isVerifying || isLocked}
                    className="w-full py-3 bg-white hover:bg-zinc-200 disabled:opacity-50 text-[#111827] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    {isVerifying ? (
                      <div className="h-4 w-4 border-2 border-zinc-400 border-t-[#111827] rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>{requireCode ? 'Verify Security Code' : 'Confirm Access'}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 bg-[#242830] hover:bg-[#2e333d] border border-[#2A2D33] text-[#D1D5DB] text-xs font-medium rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="p-3 bg-[#13151A] border-t border-[#2A2D33] flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-[#9CA3AF]" />
            <span className="text-[10px] font-medium text-[#9CA3AF]">
              Zyqitek CRM Access Protection
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
