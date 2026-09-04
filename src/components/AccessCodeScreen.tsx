import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import zyqitekLogoImg from '../assets/images/zyqitek_logo_1784722857265.jpg';
import { EnterpriseBackgroundAnimation } from './EnterpriseBackgroundAnimation';

interface AccessCodeScreenProps {
  onSuccess: () => void;
}

export default function AccessCodeScreen({ onSuccess }: AccessCodeScreenProps) {
  const [accessCode, setAccessCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [lockRemaining, setLockRemaining] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(focusTimer);
  }, []);

  // Check initial lock status on mount and on visibility change
  useEffect(() => {
    let isMounted = true;
    const checkLockStatus = async () => {
      try {
        const res = await fetch('/api/verify-access-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkOnly: true })
        });
        const data = await res.json();
        if (isMounted) {
          if (data.locked && data.lock_remaining_seconds > 0) {
            setLockRemaining(data.lock_remaining_seconds);
          } else {
            setLockRemaining(0);
          }
        }
      } catch (e) {
        // Silent fail on lock check
      }
    };
    checkLockStatus();

    const handleFocus = () => {
      checkLockStatus();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockRemaining <= 0) {
      inputRef.current?.focus();
      return;
    }
    const timer = setInterval(() => {
      setLockRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage(null);
          setTimeout(() => inputRef.current?.focus(), 50);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockRemaining]);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainder = secs % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockRemaining > 0 || isLoading) return;

    const trimmed = accessCode.trim();
    if (!trimmed) {
      setErrorMessage('Please enter the access code.');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let res: Response | null = null;
      let data: any = null;

      // 1. Primary verification attempt: POST /api/verify-access-code
      try {
        res = await fetch('/api/verify-access-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: trimmed })
        });
      } catch (_e) {
        res = null;
      }

      // 2. If 405 (Method Not Allowed) or 404 from static host/CDN, try GET method with query parameter
      if (!res || res.status === 405 || res.status === 404) {
        try {
          const getRes = await fetch(`/api/verify-access-code?code=${encodeURIComponent(trimmed)}`, {
            method: 'GET'
          });
          if (getRes.status !== 405 && getRes.status !== 404) {
            res = getRes;
          }
        } catch (_err) {}
      }

      if (!res) {
        setIsLoading(false);
        setErrorMessage('Network connection failure. Please check your network connection and try again.');
        inputRef.current?.focus();
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (jsonErr) {
          // JSON parsing failed
        }
      }

      // 1. Rate Limit / Security Lockout (429)
      if (res.status === 429 || (data && data.locked)) {
        const remaining = (data && data.lock_remaining_seconds) || 2700;
        setLockRemaining(remaining);
        setErrorMessage((data && data.error) || 'Access is temporarily locked.');
        setIsLoading(false);
        return;
      }

      // 2. Authentication Rejection / Invalid Code (401, 403, 400)
      if (res.status === 401 || res.status === 403 || res.status === 400) {
        setShake(true);
        setTimeout(() => setShake(false), 300);
        setErrorMessage((data && data.error) || 'Incorrect access code. Please try again.');
        setIsLoading(false);
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      // 3. Server-side Exceptions (5xx)
      if (res.status >= 500) {
        setErrorMessage((data && data.error) || `Server error (${res.status}). Please try again later or contact support.`);
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      }

      // 4. Other Non-OK responses
      if (!res.ok) {
        setErrorMessage((data && data.error) || `Verification request failed (${res.status}).`);
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      }

      // 5. Successful 200 response verification
      if (data && data.success === true) {
        setAccessCode('');
        setErrorMessage(null);
        setIsLoading(false);
        onSuccess();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 300);
        setErrorMessage((data && data.error) || 'Incorrect access code. Please try again.');
        setIsLoading(false);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    } catch (err) {
      // 6. Network/Fetch Failure (Offline, DNS, Connection refused/aborted)
      setIsLoading(false);
      setErrorMessage('Network connection failure. Please check your network connection and try again.');
      inputRef.current?.focus();
    }
  };

  const isLocked = lockRemaining > 0;

  return (
    <div className="auth-page min-h-screen w-full bg-[#000000] text-white font-sans select-none overflow-x-hidden relative flex items-center justify-center p-4 sm:p-6 selection:bg-indigo-500/30 selection:text-white">
      
      {/* ========================================================= */}
      {/* ENTERPRISE DARK MINIMAL ANIMATED BACKGROUND CANVAS LAYER  */}
      {/* ========================================================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#000000]">
        {/* Subtle Floating Ambient Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-600/12 blur-[140px] animate-ambient-1 pointer-events-none" />
        <div className="absolute top-[30%] -right-[15%] w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] rounded-full bg-blue-600/10 blur-[150px] animate-ambient-2 pointer-events-none" />
        <div className="absolute -bottom-[20%] left-[25%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-violet-600/10 blur-[160px] animate-ambient-3 pointer-events-none" />

        {/* Interactive Access Code & Digital Matrix Rain Canvas Animation */}
        <EnterpriseBackgroundAnimation intensity="high" interactive={true} showCodeStreams={true} />

        {/* Minimal Subtle Dotted Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] opacity-40 animate-grid-subtle" />

        {/* Soft Radial Ambient Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90 pointer-events-none" />
      </div>

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-[420px] my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full bg-[#14171D]/95 backdrop-blur-xl border border-[#252932] rounded-[32px] p-8 sm:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.85)] relative overflow-hidden text-white ${
            shake ? 'animate-shake' : ''
          }`}
        >
          {/* Card Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8 relative z-20">
            <div className="h-14 w-14 rounded-2xl bg-[#1A1D24] border border-[#2D323E] flex items-center justify-center mb-4 p-1 shadow-inner overflow-hidden">
              <img 
                src={zyqitekLogoImg} 
                alt="Zyqitek" 
                className="w-full h-full object-cover object-center rounded-xl" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1.5 text-center">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2 font-structure">
                ACCESS CODE
              </h1>
            </div>
          </div>

        {/* Verification Logic Container */}
        <AnimatePresence mode="wait">
          {isLocked ? (
            <motion.div 
              key="locked"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="p-6 bg-[#0E1015] border border-rose-500/20 rounded-2xl text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Lock size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">🔒 Temporarily Locked</p>
                <p className="text-xs text-zinc-400">Security lockout in progress.</p>
              </div>
              <div className="pt-4 border-t border-[#1C2028]">
                <span className="font-mono text-3xl font-bold text-white tracking-wider block">
                  {formatCountdown(lockRemaining)}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              <div className="space-y-2 relative">
                <label className="block text-[11px] font-bold !text-white uppercase tracking-wider ml-1" style={{ color: '#FFFFFF' }}>
                  Access Code
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white group-focus-within:text-indigo-400 transition-colors">
                    <Lock size={16} />
                  </span>
                  <input
                    ref={inputRef}
                    type="password"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter access code"
                    disabled={isLoading}
                    autoComplete="off"
                    autoFocus
                    className="w-full bg-[#1A1D24] border border-[#2D323E] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 text-white text-sm rounded-2xl pl-11 pr-4 h-12 transition-all outline-none placeholder:text-zinc-300 placeholder:italic disabled:opacity-50 tracking-wider"
                  />
                </div>

                {/* Inline Error Message */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 text-[12px] text-rose-400 font-bold pt-1 px-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-200 text-[#0E1015] font-bold h-12 rounded-2xl text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-black/20 group active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin text-zinc-600" />
                    <span className="font-bold text-[#0E1015]">Verifying...</span>
                  </div>
                ) : (
                  <>
                    <span className="font-bold tracking-wide">ENTER ACCESS CODE</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
      </div>
    </div>
  );
}
