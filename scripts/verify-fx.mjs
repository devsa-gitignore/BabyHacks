// Proves the React Bits files are byte-identical to upstream (David Haz/reactbits, commit c2a1408).
// Run: npm run verify:fx   (needs network; compares against raw.githubusercontent.com)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const COMMIT = 'c2a1408d9219a5bd7a2d9c93c9c499042f5fa34a';
const BASE = `https://raw.githubusercontent.com/DavidHDev/react-bits/${COMMIT}/src/ts-tailwind`;
const FILES = {
  'ElasticMesh.tsx': 'Animations/ElasticMesh/ElasticMesh.tsx',
  'PixelSnow.tsx': 'Backgrounds/PixelSnow/PixelSnow.tsx',
  'PixelTrail.tsx': 'Animations/PixelTrail/PixelTrail.tsx',
  'ClickSpark.tsx': 'Animations/ClickSpark/ClickSpark.tsx',
  'PaperCrumple.tsx': 'Micro/PaperCrumple/PaperCrumple.tsx',
};
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 16);
let bad = 0;
for (const [local, remote] of Object.entries(FILES)) {
  const mine = readFileSync(new URL(`../src/components/react-bits/${local}`, import.meta.url));
  const res = await fetch(`${BASE}/${remote}`);
  if (!res.ok) { console.log(`?  ${local}: could not fetch upstream (${res.status})`); bad++; continue; }
  const theirs = Buffer.from(await res.arrayBuffer());
  const same = sha(mine) === sha(theirs);
  console.log(`${same ? 'OK' : 'CHANGED'}  ${local}  ${sha(mine)}`);
  if (!same) bad++;
}
process.exit(bad ? 1 : 0);
