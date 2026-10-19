import dynamic from 'next/dynamic';
import { PageShell } from '@/components/PageShell';
import { SnowBg } from '@/components/fx/SnowBg';

// The story page is an empty slot: paste your code into src/features/story/index.tsx.
const Slot = dynamic(() => import('@/features/story'));

export default function Page() {
  return (
    <>
      <SnowBg />
      <PageShell>
        <Slot />
      </PageShell>
    </>
  );
}
