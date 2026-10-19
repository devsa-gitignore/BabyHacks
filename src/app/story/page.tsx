import { PageShell } from '@/components/PageShell';
import { StorySlot } from './StorySlot';

// No snow here: each scene paints its own sky.

export default function Page() {
  return (
    <>
      <PageShell>
        <StorySlot />
      </PageShell>
    </>
  );
}
