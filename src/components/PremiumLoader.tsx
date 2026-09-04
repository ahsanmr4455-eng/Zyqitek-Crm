import React from 'react';

export default function PremiumLoader() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Outer rotating ring (Clockwise) */}
      <svg
        className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite]"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(79, 70, 229, 0.4)" // Indigo-600 with opacity
          strokeWidth="1.5"
          strokeDasharray="80 140"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(79, 70, 229, 0.5))' }}
        />
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(79, 70, 229, 0.8)"
          strokeWidth="1.5"
          strokeDasharray="20 280"
          strokeDashoffset="100"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px rgba(79, 70, 229, 0.8))' }}
        />
      </svg>

      {/* Inner rotating ring (Counter-clockwise) */}
      <svg
        className="absolute inset-0 w-full h-full animate-[spin_6s_linear_infinite_reverse]"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(59, 130, 246, 0.3)" // Blue-500
          strokeWidth="1"
          strokeDasharray="100 100"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.4))' }}
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(59, 130, 246, 0.6)"
          strokeWidth="1"
          strokeDasharray="15 235"
          strokeDashoffset="50"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.6))' }}
        />
      </svg>

      {/* Soft pulse from center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-[var(--crm-primary)]/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      {/* Orbiting particles */}
      <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
        <div className="absolute top-1 left-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full -translate-x-1/2 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
      </div>
      <div className="absolute inset-0 animate-[spin_5s_linear_infinite_reverse]">
        <div className="absolute bottom-3 left-1/4 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
      </div>

      {/* Logo Container (Empty for the user's logo) */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="w-24 h-24 rounded-full flex items-center justify-center">
          {/* User's logo will go here */}
        </div>
      </div>
    </div>
  );
}
