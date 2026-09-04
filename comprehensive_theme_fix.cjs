const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Backgrounds
  const bgMappings = {
    'bg-white': 'dark:bg-[#1A1D23]',
    'bg-slate-50': 'dark:bg-[#20242B]',
    'bg-zinc-50': 'dark:bg-[#20242B]',
    'bg-gray-50': 'dark:bg-[#20242B]',
    'bg-slate-100': 'dark:bg-[#20242B]',
    'bg-zinc-100': 'dark:bg-[#20242B]',
    'bg-gray-100': 'dark:bg-[#20242B]',
    'bg-slate-200': 'dark:bg-[#20242B]',
    'bg-zinc-200': 'dark:bg-[#20242B]',
    'bg-gray-200': 'dark:bg-[#20242B]'
  };

  for (const [light, dark] of Object.entries(bgMappings)) {
    const reg = new RegExp(`(\\b${light})(?!\\/)(?!\\s+dark:)(?!\\s+focus:dark:)(?!\\s+hover:dark:)(?!\\s+active:dark:)`, 'g');
    content = content.replace(reg, `$1 ${dark}`);
    
    // Hover variants
    const hReg = new RegExp(`(\\bhover:${light})(?!\\/)(?!\\s+dark:)(?!\\s+hover:dark:)`, 'g');
    content = content.replace(hReg, `$1 hover:${dark}`);
    
    // Focus variants
    const fReg = new RegExp(`(\\bfocus:${light})(?!\\/)(?!\\s+dark:)(?!\\s+focus:dark:)`, 'g');
    content = content.replace(fReg, `$1 focus:${dark}`);
  }

  // 2. Borders
  const borderMappings = {
    'border-slate-100': 'dark:border-[#30353D]',
    'border-zinc-100': 'dark:border-[#30353D]',
    'border-gray-100': 'dark:border-[#30353D]',
    'border-slate-200': 'dark:border-[#30353D]',
    'border-zinc-200': 'dark:border-[#30353D]',
    'border-gray-200': 'dark:border-[#30353D]',
    'border-zinc-300': 'dark:border-[#30353D]',
    'border-slate-300': 'dark:border-[#30353D]'
  };

  for (const [light, dark] of Object.entries(borderMappings)) {
    const reg = new RegExp(`(\\b${light})(?!\\s+dark:)`, 'g');
    content = content.replace(reg, `$1 ${dark}`);
  }

  // 3. Text Colors
  const textMappings = {
    'text-slate-900': 'dark:text-[#F8FAFC]',
    'text-zinc-900': 'dark:text-[#F8FAFC]',
    'text-gray-900': 'dark:text-[#F8FAFC]',
    'text-black': 'dark:text-[#F8FAFC]',
    'text-slate-800': 'dark:text-[#E5E7EB]',
    'text-zinc-800': 'dark:text-[#E5E7EB]',
    'text-gray-800': 'dark:text-[#E5E7EB]',
    'text-slate-700': 'dark:text-[#E5E7EB]',
    'text-zinc-700': 'dark:text-[#E5E7EB]',
    'text-gray-700': 'dark:text-[#E5E7EB]',
    'text-slate-600': 'dark:text-[#9CA3AF]',
    'text-zinc-600': 'dark:text-[#9CA3AF]',
    'text-gray-600': 'dark:text-[#9CA3AF]',
    'text-slate-500': 'dark:text-[#6B7280]',
    'text-zinc-500': 'dark:text-[#6B7280]',
    'text-gray-500': 'dark:text-[#6B7280]',
    'text-slate-400': 'dark:text-[#6B7280]',
    'text-zinc-400': 'dark:text-[#6B7280]',
    'text-gray-400': 'dark:text-[#6B7280]'
  };

  for (const [light, dark] of Object.entries(textMappings)) {
    const reg = new RegExp(`(\\b${light})(?!\\s+dark:)`, 'g');
    content = content.replace(reg, `$1 ${dark}`);
  }

  // 4. Special cases for opacity/transparency already handled by previous script but let's re-verify simple ones
  // We'll leave the complex regex for transparency as I already ran it.

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('Comprehensive theme fix applied');
