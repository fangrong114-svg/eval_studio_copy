export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'avi', 'mkv', 'flv', 'wmv'];

// CSV format sample for the textarea
export const SAMPLE_CSV = `A futuristic city with flying cars\thttps://picsum.photos/id/1/400/300\thttps://picsum.photos/seed/future1/800/600\thttps://picsum.photos/seed/future2/800/600
A cute cat eating spaghetti\thttps://picsum.photos/id/2/400/300\thttps://picsum.photos/seed/cat1/800/600\thttps://picsum.photos/seed/cat2/800/600
Video: A robot dancing\thttps://picsum.photos/id/3/400/300\thttps://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4\thttps://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4`;

// CSV format sample for uploading external results
export const RESULTS_TEMPLATE_CSV = `Item ID,Prompt,Model A,Winner,Model B,User
item_001,A futuristic city,url_a,A,url_b,alice@example.com
item_002,A cute cat,url_a,B,url_b,bob@example.com
item_003,A robot dancing,url_a,Tie,url_b,charlie@example.com`;

export const KEYBOARD_SHORTCUTS = {
  A: ['1', 'ArrowLeft'],
  B: ['2', 'ArrowRight'],
  TIE: ['3', 'ArrowDown', 'Enter'],
};