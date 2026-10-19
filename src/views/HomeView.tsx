'use client';

// Home: the peek, then a short scroll film about who Void is (see HOME_LANDING_PLAN.md).
import { Footer } from '@/components/Footer';
import { Doorways, Goodnight, Voice } from '@/views/home/Ending';
import { FieldGuide } from '@/views/home/FieldGuide';
import { Moods } from '@/views/home/Moods';
import { PeekHero } from '@/views/home/PeekHero';
import { WishKeeper } from '@/views/home/WishKeeper';

export function HomeView() {
  return (
    <main className="home-v3">
      <PeekHero />
      <FieldGuide />
      <Moods />
      <WishKeeper />
      <Voice />
      <Doorways />
      <Goodnight />
      <div className="home-foot">
        <Footer />
      </div>
    </main>
  );
}
