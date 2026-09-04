import React from 'react';

interface PremiumLoadingAnimationProps {
  children?: React.ReactNode;
  className?: string;
  size?: number;
}

export default function PremiumLoadingAnimation({ 
  children, 
  className = '',
  size = 160
}: PremiumLoadingAnimationProps) {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer rotating ring (Clockwise) */}
      <svg
        className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]"
        viewBox="0 0 100 100"
      >
        {/* Faint track */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgb(var(--crm-primary-rgb) / 0.15)"
          strokeWidth="0.5"
        />
        {/* Glowing segments */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="url(#outerGradient)"
          strokeWidth="1.5"
          strokeDasharray="80 140"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgb(var(--crm-primary-rgb) / 0.4))' }}
        />
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgb(var(--crm-primary-rgb) / 0.8)"
          strokeWidth="2"
          strokeDasharray="10 290"
          strokeDashoffset="120"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px rgb(var(--crm-primary-rgb) / 0.8))' }}
        />
        
        <defs>
          <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(var(--crm-primary-rgb) / 0.1)" />
            <stop offset="50%" stopColor="rgb(var(--crm-primary-rgb) / 0.8)" />
            <stop offset="100%" stopColor="rgb(var(--crm-primary-rgb) / 0.1)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Inner rotating ring (Counter-clockwise) */}
      <svg
        className="absolute inset-0 w-full h-full animate-[spin_5s_linear_infinite_reverse]"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgb(var(--crm-accent-rgb) / 0.15)"
          strokeWidth="0.5"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#innerGradient)"
          strokeWidth="1"
          strokeDasharray="60 180"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 3px rgb(var(--crm-accent-rgb) / 0.3))' }}
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgb(var(--crm-accent-rgb) / 0.7)"
          strokeWidth="1.5"
          strokeDasharray="15 235"
          strokeDashoffset="50"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px rgb(var(--crm-accent-rgb) / 0.6))' }}
        />

        <defs>
          <linearGradient id="innerGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(var(--crm-accent-rgb) / 0.1)" />
            <stop offset="50%" stopColor="rgb(var(--crm-accent-rgb) / 0.6)" />
            <stop offset="100%" stopColor="rgb(var(--crm-accent-rgb) / 0.1)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Soft pulse from center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-1/2 h-1/2 bg-[var(--crm-primary)] opacity-10 rounded-full animate-ping" 
          style={{ animationDuration: '3s' }} 
        />
      </div>

      {/* Orbiting particles */}
      <div className="absolute inset-0 animate-[spin_4s_linear_infinite] pointer-events-none">
        <div 
          className="absolute rounded-full bg-[var(--crm-primary)] opacity-80 shadow-[0_0_8px_rgb(var(--crm-primary-rgb)_/_0.8)]" 
          style={{ 
            top: 'calc(50% - 48px - 2px)', // 50% - r - half_particle_size
            left: 'calc(50% - 2px)', 
            width: '4px', 
            height: '4px' 
          }} 
        />
      </div>
      <div className="absolute inset-0 animate-[spin_6s_linear_infinite_reverse] pointer-events-none">
        <div 
          className="absolute rounded-full bg-[var(--crm-accent)] opacity-80 shadow-[0_0_6px_rgb(var(--crm-accent-rgb)_/_0.8)]" 
          style={{ 
            bottom: 'calc(50% - 40px - 1.5px)', 
            left: 'calc(50% - 1.5px)', 
            width: '3px', 
            height: '3px' 
          }} 
        />
      </div>
      <div className="absolute inset-0 animate-[spin_7s_linear_infinite] pointer-events-none" style={{ animationDelay: '-2s' }}>
         <div 
          className="absolute rounded-full bg-[var(--crm-primary)] opacity-60 shadow-[0_0_5px_rgb(var(--crm-primary-rgb)_/_0.8)]" 
          style={{ 
            top: 'calc(50% - 1.5px)', 
            right: 'calc(50% - 48px - 1.5px)', 
            width: '3px', 
            height: '3px' 
          }} 
        />
      </div>

      {/* Logo Container */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="w-[60%] h-[60%] flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
