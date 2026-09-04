import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskCheckmarkProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  size?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const TaskCheckmark: React.FC<TaskCheckmarkProps> = ({
  checked,
  onChange,
  size = 18,
  label,
  className = '',
  disabled = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="relative flex items-center justify-center shrink-0">
        {/* Expanding Ring Ripple Effect on Completion */}
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0.7, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0 rounded-lg bg-emerald-50 dark:bg-emerald-900/20/50 dark:bg-emerald-400/50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Checkmark Container Box */}
        <motion.div
          animate={checked ? { scale: [0.85, 1.2, 1], rotate: [0, -6, 0] } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`rounded-md flex items-center justify-center transition-colors duration-200 border ${
            checked 
              ? 'bg-emerald-600 border-emerald-600 dark:bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
              : 'bg-[var(--crm-card)] dark:bg-[#E2E8F0] border-slate-300 dark:border-slate-400 text-transparent hover:border-slate-400 dark:hover:border-slate-500'
          }`}
          style={{ width: size, height: size }}
        >
          {/* SVG Checkmark Path Animation */}
          <AnimatePresence mode="wait">
            {checked && (
              <motion.svg
                key="check-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3/4 h-3/4"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <motion.path
                  d="M20 6L9 17l-5-5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {label && (
        <span className={`text-xs font-medium transition-all duration-200 ${
          checked ? 'text-[var(--crm-text-muted)] dark:text-[#6B7280] line-through' : 'text-[var(--crm-text)]'
        }`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default TaskCheckmark;
