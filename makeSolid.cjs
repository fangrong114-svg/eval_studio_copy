const fs = require('fs');

function makeSolid(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Backgrounds
  content = content.replace(/bg-slate-800\/40\b/g, 'bg-slate-900');
  content = content.replace(/bg-slate-700\/40\b/g, 'bg-slate-800');
  content = content.replace(/bg-slate-600\/40\b/g, 'bg-slate-700');
  content = content.replace(/bg-slate-900\/40\b/g, 'bg-slate-900');
  content = content.replace(/bg-slate-900\/60\b/g, 'bg-slate-900');
  
  // Borders
  content = content.replace(/border-slate-800\/60\b/g, 'border-slate-800');
  content = content.replace(/border-slate-700\/60\b/g, 'border-slate-700');
  content = content.replace(/border-slate-600\/60\b/g, 'border-slate-600');
  
  // Hover Backgrounds
  content = content.replace(/hover:bg-slate-700\/40\b/g, 'hover:bg-slate-800');
  content = content.replace(/hover:bg-slate-600\/40\b/g, 'hover:bg-slate-700');
  content = content.replace(/hover:bg-slate-500\/40\b/g, 'hover:bg-slate-600');
  
  // Also fix the glass-panel in index.css
  if (filePath.endsWith('index.css')) {
    content = content.replace(/bg-slate-900\/80/g, 'bg-slate-900');
    content = content.replace(/border-slate-700\/50/g, 'border-slate-700');
  }

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
  'src/components/CreateProjectModal.tsx',
  'src/components/EditStepModal.tsx',
  'src/index.css'
];

files.forEach(makeSolid);
