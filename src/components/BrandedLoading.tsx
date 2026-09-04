import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import zyqitekLogoImg from '../assets/images/zyqitek_logo_1784722857265.jpg';

interface BrandedLoadingProps {
  onComplete: () => void;
}

export default function BrandedLoading({ onComplete }: BrandedLoadingProps) {
  const [isExiting, setIsExiting] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Total animation flow duration: 2.7 seconds
    // Trigger smooth fade & blur out at 2.3 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2300);

    // Complete transition into CRM Dashboard at 2.7 seconds
    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, 2700);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Floating micro-particles configuration
  const particles = [
    { id: 1, x: -110, y: -45, size: 3, delay: 0.1, duration: 2.2 },
    { id: 2, x: 130, y: -75, size: 2.5, delay: 0.4, duration: 2.0 },
    { id: 3, x: -75, y: 85, size: 3.5, delay: 0.2, duration: 2.4 },
    { id: 4, x: 95, y: 65, size: 2.5, delay: 0.6, duration: 2.1 },
    { id: 5, x: -150, y: 25, size: 2, delay: 0.3, duration: 2.3 },
    { id: 6, x: 160, y: -30, size: 3, delay: 0.5, duration: 2.5 },
    { id: 7, x: -10, y: -125, size: 2.5, delay: 0.7, duration: 1.9 },
    { id: 8, x: -35, y: 130, size: 3, delay: 0.8, duration: 2.2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        filter: isExiting ? 'blur(16px)' : 'blur(0px)',
        scale: isExiting ? 1.03 : 1,
      }}
      transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[99999] bg-[var(--crm-bg)] flex items-center justify-center overflow-hidden select-none"
    >
      {/* 1. Camera Zoom Container (Slow cinematic zoom-in) */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 2.8, ease: 'linear' }}
        className="relative flex items-center justify-center w-full h-full"
      >
        {/* Soft Dotted Pattern Background for Light Mode */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--crm-text-muted)_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

        {/* Ambient Top & Center Soft Green Spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] sm:w-[700px] sm:h-[700px] bg-gradient-radial from-[#ECFCCB]/60 via-[#DCFCE7]/30 to-transparent rounded-full blur-[110px] pointer-events-none" />

        {/* 2. Soft Green Light Glow Behind Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{
            opacity: [0, 0.55, 0.35, 0.45],
            scale: [0.75, 1.25, 1.05, 1.18],
          }}
          transition={{ duration: 2.6, ease: 'easeOut' }}
          className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-[#84cc16]/25 blur-[90px] pointer-events-none"
        />

        {/* 3. Gentle Pulse Effect Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: [0, 0.45, 0],
            scale: [0.85, 1.35],
          }}
          transition={{ duration: 2.1, delay: 0.4, ease: 'easeOut' }}
          className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-lime-500/35 pointer-events-none"
        />

        {/* 4. Thin Circular Light Ring (Rotates slowly around logo) */}
        <div className="absolute w-[290px] h-[290px] sm:w-[350px] sm:h-[350px] pointer-events-none flex items-center justify-center">
          <motion.svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 11, ease: 'linear', repeat: Infinity }}
          >
            <defs>
              <linearGradient id="ring-gradient-main" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#84cc16" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#22c55e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#65a30d" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke="url(#ring-gradient-main)"
              strokeWidth="1.2"
              strokeDasharray="130 190"
              strokeLinecap="round"
            />
          </motion.svg>

          {/* Secondary Counter-Rotating Ring */}
          <motion.svg
            viewBox="0 0 200 200"
            className="absolute inset-0 w-full h-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, ease: 'linear', repeat: Infinity }}
          >
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="rgba(148, 163, 184, 0.25)"
              strokeWidth="0.8"
              strokeDasharray="35 245"
              strokeLinecap="round"
            />
          </motion.svg>
        </div>

        {/* 5. Floating Subtle Green Particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: p.x, y: p.y + 15, scale: 0.5 }}
            animate={{
              opacity: [0, 0.8, 0],
              y: [p.y + 15, p.y - 35],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
            style={{ width: p.size, height: p.size }}
            className="absolute rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.6)] pointer-events-none"
          />
        ))}

        {/* 6. Logo Container with Smooth Fade & Scale */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.25,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 flex flex-col items-center justify-center"
        >
          {/* Main Logo Card Container with Premium Light Glassmorphism */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl p-1 flex items-center justify-center overflow-hidden border border-[var(--crm-card-border)] bg-[var(--crm-card)]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06),0_0_30px_rgba(132,204,22,0.15)]">
            
            {/* Logo Inner Area */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-[var(--crm-card)]">
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={zyqitekLogoImg}
                  alt="Zyqitek Z Logo"
                  className="w-full h-full object-cover object-center scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* 7. Premium Light Metallic Sweep Layer */}
              <motion.div
                initial={{ x: '-150%', opacity: 0 }}
                animate={{
                  x: ['-150%', '170%'],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.25,
                  delay: 0.75,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.85) 50%, transparent 75%)',
                  mixBlendMode: 'overlay',
                }}
              />
            </div>

            {/* Corner Cybernetic Light Accents */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-lime-500/80 rounded-tl" />
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-lime-500/80 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-lime-500/80 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-lime-500/80 rounded-br" />
          </div>

          {/* Minimal Luxury Light Branding Label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: 'easeOut' }}
            className="mt-6 flex items-center gap-2"
          >
            <span className="text-[var(--crm-text)] text-xs sm:text-sm font-bold tracking-[0.15em] font-structure">
              Zyqitek
            </span>
            <span className="text-lime-700 text-[8px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-lime-100/90 border border-lime-300/80 font-structure shadow-xs">
              Customer Relationship Management
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
