// Everything you are likely to tweak lives here.

export const CAT_NAME = 'Void';
export const SITE_TITLE = 'Void';
export const TAGLINE = 'I catch the wishes you whisper at night.';

// Flags for features that are intentionally NOT built yet.
export const FEATURES = {
  easter: false, // set true once src/features/easter/index.tsx is filled in
} as const;

export const NAV_ITEMS = [
  { key: 'home', href: '/home', label: 'Home' },
  { key: 'story', href: '/story', label: 'Story' },
  { key: 'projects', href: '/projects', label: 'Projects' },
  { key: 'wishes', href: '/wishes', label: 'Wishes' },
] as const;

// Character sheet (Track 2 requires these five fields; keep each under 60 words).
export const CHARACTER_SHEET = {
  name: CAT_NAME,
  what: 'A baby black kitten with enormous green eyes and a tiny golden star charm. Curious, a little shy, easily startled by butterflies, and purrs the instant someone is kind to her.',
  does: 'Wish Keeper of the Window. Void stays up all night by the glass, catches the wishes you whisper, and hangs each one in the sky as a star.',
  story: 'Void was born on the night a wish had nowhere to land. (The full story is coming soon.)',
  tagline: TAGLINE,
};

export const WISH_COLORS = ['pink', 'aqua', 'periwinkle', 'yellow', 'orange'] as const;
export const WISH_ICONS = ['star', 'heart', 'moon', 'cloud', 'sparkle'] as const;
export const WISH_MAX = 80;
export const WISH_PAGE_SIZE = 40;
export const WISH_COOLDOWN_MS = 10_000;
