// Add a row here and a new 88x31 badge appears in the footer and About dialog.
export type Credit = { label: string; sub: string; href: string; bg: string };

export const CREDITS: Credit[] = [
  { label: 'React Bits', sub: 'FX, unmodified', href: 'https://reactbits.dev/', bg: '#b3bfff' },
  { label: 'Aceternity', sub: 'Cloud Shader', href: 'https://ui.aceternity.com/components/cloud-shader', bg: '#ffe27a' },
  { label: 'LottieFiles', sub: 'icons', href: 'https://lottiefiles.com/', bg: '#b8f23a' },
  { label: 'Gochi Hand', sub: 'main font', href: 'https://fonts.google.com/specimen/Gochi+Hand', bg: '#ffb3c9' },
  { label: 'Nanum Pen', sub: 'note font', href: 'https://fonts.google.com/specimen/Nanum+Pen+Script', bg: '#a8ecf0' },
  { label: 'three.js', sub: '3D Void', href: 'https://threejs.org/', bg: '#ffc28a' },
  { label: 'Motion', sub: 'springs', href: 'https://motion.dev/', bg: '#fff8ec' },
  { label: 'Supabase', sub: 'wish wall', href: 'https://supabase.com/', bg: '#8cf0c0' },
];

export const CREDIT_NOTE =
  'The five React Bits effects and the Aceternity Cloud Shader are used exactly as published. Void, the clouds and every icon are original art made for this site.';
