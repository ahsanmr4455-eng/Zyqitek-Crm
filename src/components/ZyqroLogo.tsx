import React from 'react';
import zyqitekLogoImg from '../assets/images/zyqitek_logo_1784722857265.jpg';

interface ZyqroLogoProps {
  className?: string;
  iconSize?: string;
  useImage?: boolean;
}

export function ZyqitekLogo({ className = "h-10 w-10", iconSize = "h-5 w-5", useImage = true }: ZyqroLogoProps) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-xs shrink-0 select-none bg-white dark:bg-zinc-900 ${className}`}>
      <img 
        src={zyqitekLogoImg} 
        alt="Zyqitek Logo" 
        className="w-full h-full object-cover object-center"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default ZyqitekLogo;

