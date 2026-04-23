const fs = require('fs');
const path = './src/components/ProjectDetail.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replacements
content = content.replace(/bg-white/g, 'glass-panel');
content = content.replace(/border-gray-100/g, 'border-white/10');
content = content.replace(/border-gray-200/g, 'border-white/10');
content = content.replace(/text-gray-900/g, 'text-slate-100');
content = content.replace(/text-gray-700/g, 'text-slate-200');
content = content.replace(/text-gray-600/g, 'text-slate-300');
content = content.replace(/text-gray-500/g, 'text-slate-400');
content = content.replace(/text-gray-400/g, 'text-slate-500');
content = content.replace(/text-gray-300/g, 'text-slate-600');
content = content.replace(/bg-gray-50/g, 'bg-white/5');
content = content.replace(/divide-gray-200/g, 'divide-white/10');
content = content.replace(/border-white bg-white/g, 'border-white/10 bg-black/40');
content = content.replace(/before:via-gray-200/g, 'before:via-white/20');

fs.writeFileSync(path, content);
console.log('Done');
