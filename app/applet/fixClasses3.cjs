const fs = require('fs');
const path = require('path');

function fixClasses(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log('File not found:', fullPath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(/bg-white\b/g, 'bg-white/5');
  content = content.replace(/bg-slate-50\b/g, 'bg-white/5');
  content = content.replace(/bg-slate-100\b/g, 'bg-white/10');
  content = content.replace(/border-slate-200\b/g, 'border-white/10');
  content = content.replace(/border-slate-300\b/g, 'border-white/20');
  content = content.replace(/border-slate-100\b/g, 'border-white/5');
  content = content.replace(/text-slate-800\b/g, 'text-slate-200');
  content = content.replace(/text-slate-700\b/g, 'text-slate-200');
  content = content.replace(/text-slate-600\b/g, 'text-slate-300');
  content = content.replace(/text-slate-500\b/g, 'text-slate-400');
  content = content.replace(/text-gray-500\b/g, 'text-slate-400');
  content = content.replace(/text-indigo-600\b/g, 'text-amber-400');
  content = content.replace(/text-indigo-800\b/g, 'text-amber-300');
  content = content.replace(/text-blue-600\b/g, 'text-amber-400');
  content = content.replace(/text-blue-800\b/g, 'text-amber-300');
  content = content.replace(/bg-indigo-50\b/g, 'bg-amber-500/10');
  content = content.replace(/bg-indigo-100\b/g, 'bg-amber-500/20');
  content = content.replace(/bg-indigo-600\b/g, 'bg-amber-500');
  content = content.replace(/bg-indigo-700\b/g, 'bg-amber-600');
  content = content.replace(/hover:bg-indigo-50\b/g, 'hover:bg-amber-500/10');
  content = content.replace(/hover:bg-indigo-700\b/g, 'hover:bg-amber-600');
  content = content.replace(/hover:text-indigo-700\b/g, 'hover:text-amber-300');
  content = content.replace(/ring-indigo-500\b/g, 'ring-amber-500');
  content = content.replace(/focus:border-indigo-500\b/g, 'focus:border-amber-500');
  content = content.replace(/focus:ring-indigo-500\b/g, 'focus:ring-amber-500');
  content = content.replace(/text-green-800\b/g, 'text-emerald-400');
  content = content.replace(/bg-green-50\b/g, 'bg-emerald-500/10');
  content = content.replace(/bg-green-100\b/g, 'bg-emerald-500/20');
  content = content.replace(/text-green-600\b/g, 'text-emerald-400');
  content = content.replace(/text-green-700\b/g, 'text-emerald-300');
  content = content.replace(/text-red-600\b/g, 'text-rose-400');
  content = content.replace(/bg-red-50\b/g, 'bg-rose-500/10');
  content = content.replace(/text-red-800\b/g, 'text-rose-400');
  content = content.replace(/bg-amber-50\b/g, 'bg-amber-500/10');
  content = content.replace(/text-amber-800\b/g, 'text-amber-400');
  content = content.replace(/text-slate-900\b/g, 'text-slate-100');
  content = content.replace(/bg-slate-900\b/g, 'bg-black');
  content = content.replace(/bg-emerald-50\b/g, 'bg-emerald-500/10');
  content = content.replace(/border-emerald-200\b/g, 'border-emerald-500/20');
  content = content.replace(/text-emerald-700\b/g, 'text-emerald-400');
  content = content.replace(/bg-white\/5\/5/g, 'bg-white/5'); // fix double replacement
  content = content.replace(/bg-white\/5\/10/g, 'bg-white/10');
  content = content.replace(/bg-white\/5\/20/g, 'bg-white/20');
  content = content.replace(/bg-white\/5\/\[0\.05\]/g, 'bg-white/[0.05]');
  
  fs.writeFileSync(fullPath, content);
  console.log('Fixed', fullPath);
}

fixClasses('src/components/VotingScreen.tsx');
fixClasses('src/components/ResultsScreen.tsx');
