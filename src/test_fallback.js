import Papa from 'papaparse';

const text = `Video Prompt	Start Image URL	Slot_1_Output_URL	Slot_2_Output_URL
[Tags]: lip-sync, micro-motion, hair-flutter, breath, static-camera, indoor-studio [Shot Type]: close-up, locked-off [Summary]: The singer's lips open and close with subtle singing articulation, a few loose hair strands near her cheek tremble gently with her breath, her chest rises and falls rhythmically, eyelashes flutter occasionally, no camera movement throughout [Character]: female singer performing subtle facial and vocal micro-expressions [Location]: recording studio [Secondary]: microphone diaphragm vibrates faintly, acoustic panels remain static [Style]: photorealistic, warm ambient light holds steady, shallow DOF unchanged	https://vidmuse-dev.sandcdn.com/user/0/assets/images/90b7a1.jpg	https://vidmuse-dev.sandcdn.com/user/0/assets/videos/8f858f.mp4	https://vidmuse-dev.sandcdn.com/user/0/assets/videos/e0040a.mp4`;

const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
const rawHasUrls = lines.some(l => l.includes('http'));

const runAggressiveParser = () => {
  const parsedData = [];
  let maxUrls = 0;
  
  const extractUrls = (line) => {
    const parts = line.split(/(?=https?:\/\/)/);
    return parts
      .filter(p => p.trim().startsWith('http'))
      .map(p => {
        const match = p.match(/^https?:\/\/[^\s"'\t|,;>]+/);
        return match ? match[0] : '';
      })
      .filter(Boolean);
  };

  lines.forEach(line => {
    const urls = extractUrls(line);
    maxUrls = Math.max(maxUrls, urls.length);
  });

  if (maxUrls > 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const urls = extractUrls(line);
      
      if (i === 0 && urls.length === 0 && maxUrls > 0) continue;

      if (urls.length > 0) {
        const firstUrlIndex = line.indexOf(urls[0]);
        let prompt = line.substring(0, firstUrlIndex).trim();
        prompt = prompt.replace(/^[,;\t|]+|[,;\t|]+$/g, '').trim();
        prompt = prompt.replace(/^["']|["']$/g, '').trim();
        
        const row = { 'Video Prompt': prompt || 'Empty Prompt' };
        
        if (maxUrls === 3) {
          row['Start Image'] = urls[0] || '';
          row['Slot_1_Out'] = urls[1] || '';
          row['Slot_2_Out'] = urls[2] || '';
        } else if (maxUrls === 2) {
          row['Slot_1_Out'] = urls[0] || '';
          row['Slot_2_Out'] = urls[1] || '';
        } else {
          urls.forEach((url, idx) => {
            row[`URL_${idx + 1}`] = url;
          });
        }
        parsedData.push(row);
      }
    }
    return parsedData;
  }
  return null;
};

let data = [];
let headers = [];

let results = Papa.parse(text, {
  header: true,
  skipEmptyLines: true,
  transform: (value) => value.trim(),
  transformHeader: (header) => header.trim(),
});

data = results.data;
headers = results.meta.fields || (data.length > 0 ? Object.keys(data[0]) : []);

let hasMergedUrls = false;
let hasUrlInParsedData = false;
if (data.length > 0) {
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const rowVals = Object.values(data[i]);
    if (rowVals.some(val => typeof val === 'string' && val.includes('http'))) {
      hasUrlInParsedData = true;
    }
    if (rowVals.some(val => typeof val === 'string' && (val.match(/https?:\/\//g) || []).length > 1)) {
      hasMergedUrls = true;
    }
  }
}

const papaParseFailed = headers.length <= 1 || hasMergedUrls || (rawHasUrls && !hasUrlInParsedData);

console.log("PapaParse Failed?", papaParseFailed);
console.log("hasMergedUrls?", hasMergedUrls);
console.log("headers length:", headers.length);

if (papaParseFailed) {
  const aggressiveData = runAggressiveParser();
  if (aggressiveData && aggressiveData.length > 0) {
    data = aggressiveData;
    headers = Object.keys(data[0]);
    console.log("Recovered with aggressive parser!");
  }
}

console.log(JSON.stringify(data, null, 2));
