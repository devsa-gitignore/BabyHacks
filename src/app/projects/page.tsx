import dynamic from 'next/dynamic';
import { PageShell } from '@/components/PageShell';
import { SnowBg } from '@/components/fx/SnowBg';

// The projects page is an empty slot: paste your code into src/features/projects/index.tsx.
const Slot = dynamic(() => import('@/features/projects'));

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
