import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./modeleval-pro/migrated_prompt_history/prompt_2026-02-12T11:38:25.821Z.json', 'utf8'));

const files = {};

data.forEach(message => {
  if (message.payload && message.payload.type === 'generationTable' && message.payload.entries) {
    message.payload.entries.forEach(entry => {
      if (entry.diffs && entry.diffs.length > 0) {
        entry.diffs.forEach(diff => {
          if (diff.replacement) {
            files[entry.path] = diff.replacement;
          }
        });
      }
    });
  }
});

for (const [path, content] of Object.entries(files)) {
  console.log(`--- FILE: ${path} ---`);
  console.log(content.substring(0, 100) + '...');
}

fs.writeFileSync('extracted_files.json', JSON.stringify(files, null, 2));
