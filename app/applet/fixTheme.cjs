const fs = require('fs');
const path = require('path');

function replaceClasses(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Backgrounds
  content = content.replace(/bg-white\/5\b/g, 'bg-slate-800/40');
  content = content.replace(/bg-white\/10\b/g, 'bg-slate-700/40');
  content = content.replace(/bg-white\/20\b/g, 'bg-slate-600/40');
  content = content.replace(/bg-black\/20\b/g, 'bg-slate-900/40');
  content = content.replace(/bg-black\/40\b/g, 'bg-slate-900/60');
  content = content.replace(/bg-black\b/g, 'bg-slate-950');
  content = content.replace(/bg-\[\#0a0a0a\]\b/g, 'bg-slate-950');
  
  // Borders
  content = content.replace(/border-white\/5\b/g, 'border-slate-800/60');
  content = content.replace(/border-white\/10\b/g, 'border-slate-700/60');
  content = content.replace(/border-white\/20\b/g, 'border-slate-600/60');
  
  // Hover Backgrounds
  content = content.replace(/hover:bg-white\/5\b/g, 'hover:bg-slate-700/40');
  content = content.replace(/hover:bg-white\/10\b/g, 'hover:bg-slate-600/40');
  content = content.replace(/hover:bg-white\/20\b/g, 'hover:bg-slate-500/40');

  // Shadows to add depth
  content = content.replace(/shadow-sm\b/g, 'shadow-md shadow-black/20');
  
  fs.writeFileSync(filePath, content);
  console.log('Processed', filePath);
}

const files = [
  'src/App.tsx',
  'src/components/DashboardScreen.tsx',
  'src/components/TaskBuilderScreen.tsx',
  'src/components/VotingScreen.tsx',
  'src/components/ResultsScreen.tsx',
  'src/components/DatasetRepositoryScreen.tsx',
  'src/components/TemplateRepositoryScreen.tsx',
  'src/components/ModelEvalApp.tsx',
  'src/components/CreateProjectModal.tsx'
];

files.forEach(replaceClasses);
