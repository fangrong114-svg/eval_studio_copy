import Papa from 'papaparse';

const text = `Video Prompt\tStart Image URL\tSlot_1_Output_URL\tSlot_2_Output_URL
[Tags]: lip-sync, micro-motion, hair-flutter, breath, static-camera, indoor-studio [Shot Type]: close-up, locked-off [Summary]: The singer's lips open and close with subtle singing articulation, a few loose hair strands near her cheek tremble gently with her breath, her chest rises and falls rhythmically, eyelashes flutter occasionally, no camera movement throughout [Character]: female singer performing subtle facial and vocal micro-expressions [Location]: recording studio [Secondary]: microphone diaphragm vibrates faintly, acoustic panels remain static [Style]: photorealistic, warm ambient light holds steady, shallow DOF unchanged\thttps://vidmuse-dev.sandcdn.com/user/0/assets/images/90b7a1.jpg\thttps://vidmuse-dev.sandcdn.com/user/0/assets/videos/8f858f.mp4\thttps://vidmuse-dev.sandcdn.com/user/0/assets/videos/e0040a.mp4`;

let results = Papa.parse(text, {
  header: true,
  skipEmptyLines: true,
  transform: (value) => value.trim(),
  transformHeader: (header) => header.trim(),
});

console.log("PapaParse results:");
console.log(JSON.stringify(results.data[0], null, 2));
console.log("Meta:", results.meta);
