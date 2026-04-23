const fs = require('fs');

function fixClasses(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/bg-white\/5\/20/g, 'bg-white/20');
  content = content.replace(/bg-white\/5\/\[0\.05\]/g, 'bg-white/[0.05]');
  content = content.replace(/bg-white\/5\/10/g, 'bg-white/10');
  content = content.replace(/bg-white\/5\/5/g, 'bg-white/5');
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed', filePath);
}

fixClasses('/src/components/TaskBuilderScreen.tsx');
fixClasses('/src/components/DashboardScreen.tsx');
fixClasses('/src/components/DatasetRepositoryScreen.tsx');
fixClasses('/src/components/TemplateRepositoryScreen.tsx');
