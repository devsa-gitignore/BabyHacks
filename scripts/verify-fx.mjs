// Proves the React Bits files are byte-identical to upstream (David Haz/reactbits, commit c2a1408).
// Run: npm run verify:fx   (needs network; compares against raw.githubusercontent.com)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const COMMIT = 'c2a1408d9219a5bd7a2d9c93c9c499042f5fa34a';
const base = (commit = COMMIT) => `https://raw.githubusercontent.com/DavidHDev/react-bits/${commit}/src/ts-tailwind`;
const FILES = {
  'ElasticMesh.tsx': 'Animations/ElasticMesh/ElasticMesh.tsx',
  'PixelSnow.tsx': 'Backgrounds/PixelSnow/PixelSnow.tsx',
  'PixelTrail.tsx': 'Animations/PixelTrail/PixelTrail.tsx',
  'ClickSpark.tsx': 'Animations/ClickSpark/ClickSpark.tsx',
  'PaperCrumple.tsx': 'Micro/PaperCrumple/PaperCrumple.tsx',
  'CRTWarp.tsx': ['Backgrounds/CRTWarp/CRTWarp.tsx', '14330e6963f6c5ddd773ee2af844d0630c22b958'], // added later, newer commit
};
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 16);
let bad = 0;
for (const [local, entry] of Object.entries(FILES)) {
  const [remote, commit] = Array.isArray(entry) ? entry : [entry];
  const mine = readFileSync(new URL(`../src/components/react-bits/${local}`, import.meta.url));
  const res = await fetch(`${base(commit)}/${remote}`);
  if (!res.ok) { console.log(`?  ${local}: could not fetch upstream (${res.status})`); bad++; continue; }
  const theirs = Buffer.from(await res.arrayBuffer());
  const same = sha(mine) === sha(theirs);
  console.log(`${same ? 'OK' : 'CHANGED'}  ${local}  ${sha(mine)}`);
  if (!same) bad++;
}
process.exit(bad ? 1 : 0);
