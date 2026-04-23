const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/AnalysisScreen.tsx');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/bg-white hover:bg-slate-50 text-slate-600/g, 'glass-panel glass-panel-hover text-slate-300');
  content = content.replace(/border border-slate-200/g, 'border-white/10');
  content = content.replace(/text-slate-800/g, 'text-slate-100');
  content = content.replace(/text-slate-500/g, 'text-slate-400');
  content = content.replace(/bg-white border border-slate-200/g, 'glass-panel');
  content = content.replace(/bg-white border-2 border-dashed border-slate-300/g, 'glass-panel border-2 border-dashed border-white/20');
  content = content.replace(/bg-emerald-50 text-emerald-600/g, 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20');
  content = content.replace(/bg-blue-50 text-blue-600/g, 'bg-blue-500/10 text-blue-400 border border-blue-500/20');
  content = content.replace(/bg-indigo-50 text-indigo-600/g, 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20');
  content = content.replace(/bg-slate-50/g, 'bg-white/5');
  content = content.replace(/border border-slate-100/g, 'border-white/10');
  content = content.replace(/bg-white p-4/g, 'glass-panel p-4');
  content = content.replace(/bg-white rounded-xl/g, 'glass-panel rounded-xl');
  content = content.replace(/border-b border-slate-100/g, 'border-b border-white/10');
  content = content.replace(/text-slate-700/g, 'text-slate-200');
  content = content.replace(/border-b border-slate-200/g, 'border-b border-white/10');
  content = content.replace(/text-slate-600/g, 'text-slate-300');
  content = content.replace(/bg-slate-100/g, 'bg-white/10');
  content = content.replace(/bg-slate-400/g, 'bg-slate-500');
  content = content.replace(/border border-slate-300/g, 'glass-input');
  content = content.replace(/bg-slate-200 text-slate-400/g, 'bg-white/10 text-slate-500');
  
  fs.writeFileSync(filePath, content);
  console.log('AnalysisScreen replaced');
}
