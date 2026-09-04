const fs = require('fs');

const files = [
  'src/components/PreHiringTestingManager.tsx',
  'src/components/PreHiringTestingList.tsx',
  'src/components/PreHiringCandidateForm.tsx',
  'src/components/PreHiringTestInterface.tsx',
  'src/components/PreHiringAdminReview.tsx',
  'src/components/PreHiringQuestionBank.tsx'
];

const replacements = [
  { regex: /bg-white/g, replacement: 'bg-white dark:bg-[#111827]' },
  { regex: /bg-slate-50(?!\/50)/g, replacement: 'bg-slate-50 dark:bg-[#0A0F17]' },
  { regex: /bg-slate-50\/50/g, replacement: 'bg-slate-50/50 dark:bg-[#0A0F17]/50' },
  { regex: /border-slate-200/g, replacement: 'border-slate-200 dark:border-[#1F2937]' },
  { regex: /border-slate-100/g, replacement: 'border-slate-100 dark:border-[#1F2937]' },
  { regex: /text-slate-900/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /text-slate-800/g, replacement: 'text-slate-800 dark:text-white' },
  { regex: /text-slate-700/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /text-slate-600/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { regex: /text-slate-500/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /text-slate-400/g, replacement: 'text-slate-400 dark:text-slate-500' },
  { regex: /hover:bg-slate-50(?!\/50)/g, replacement: 'hover:bg-slate-50 dark:hover:bg-[#1F2937]' },
  { regex: /hover:bg-slate-100/g, replacement: 'hover:bg-slate-100 dark:hover:bg-[#1F2937]' },
  { regex: /hover:text-slate-600/g, replacement: 'hover:text-slate-600 dark:hover:text-slate-300' },
  { regex: /hover:text-slate-900/g, replacement: 'hover:text-slate-900 dark:hover:text-white' },
  { regex: /divide-slate-100/g, replacement: 'divide-slate-100 dark:divide-[#1F2937]' },
  { regex: /bg-slate-100/g, replacement: 'bg-slate-100 dark:bg-[#1F2937]' },
  
  // Specific pill colors
  { regex: /bg-blue-100 text-blue-700/g, replacement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { regex: /bg-emerald-100 text-emerald-700/g, replacement: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { regex: /bg-purple-100 text-purple-700/g, replacement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { regex: /bg-rose-100 text-rose-700/g, replacement: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  { regex: /bg-amber-100 text-amber-700/g, replacement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  
  { regex: /bg-blue-50 text-blue-600/g, replacement: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  { regex: /bg-emerald-50 text-emerald-600/g, replacement: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
  { regex: /bg-purple-50 text-purple-600/g, replacement: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
  { regex: /bg-rose-50 text-rose-600/g, replacement: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' },
  
  // Inputs
  { regex: /bg-slate-50 dark:bg-\[#0A0F17\] border/g, replacement: 'bg-transparent border' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  replacements.forEach(({regex, replacement}) => {
    content = content.replace(regex, replacement);
  });
  // Quick fix for inputs so they are transparent with dark borders
  content = content.replace(/bg-transparent border border-slate-200 dark:border-\[#1F2937\]/g, 'bg-transparent dark:bg-[#0A0F17] border border-slate-200 dark:border-[#1F2937] dark:text-white');
  
  // Fix double additions
  content = content.replace(/(dark:[A-Za-z0-9#-\/\[\]]+) \1/g, '$1');
  
  fs.writeFileSync(file, content, 'utf-8');
});

console.log('Done!');
