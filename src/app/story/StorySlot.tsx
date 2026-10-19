'use client';

import dynamic from 'next/dynamic';

// Keep the story's animation and 3D dependencies out of the route entry chunk.
const Slot = dynamic(() => import('@/features/story'), { ssr: false });

export function StorySlot() {
  return <Slot />;
}
