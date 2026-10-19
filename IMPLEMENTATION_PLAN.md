# Void: Style Sync + Page Rebuild Plan (45-minute build, v2)

Track: **Track 2 (Void, original character).** Judged on the Track 2 requirements: character sheet, 3+ projects, origin story in scenes under 150 words each, one interactive moment, mobile layout, one hidden Easter egg.

Feel: **the whole site is calm.** Soft night sky, slow motion, soft light, gentle sound that is off until a visitor turns it on. No separate "calm mode" toggle. OS reduced-motion is still respected.

Supabase: **no changes.** `src/lib/supabase.ts`, `supabase/schema.sql`, and the `insertWish` / `fetchWishes` / `subscribeWishes` / `countWishes` signatures stay exactly as they are.

Budget: **45 minutes total.** Order: P0 Lottie fix (3 min), P1 global style and day/night sync (8), P2 toggles (4), P3 Landing + Home (10), P4 Story (5), P5 Projects (8), P6 Wishes UI (4), P7 Easter egg (3), verify (2). Budget is tight on purpose. Verify is a typecheck, a build, and one pass at phone and desktop width. No extra re-checks.

---

## Decisions (already taken, change before I start if needed)

| # | Decision | Why |
|---|---|---|
| D1 | Tier 2 picks: **lullaby music box** and **dream route SVG on scroll**. Mini-game is cut (time). | PS says pick 1–2. You picked three. Two fit calm best. |
| D2 | Pronoun: **she / her** everywhere. The one "he" in the story copy becomes "she". | `CHARACTER_SHEET` says "her". |
| D3 | Projects: four projects as cards that expand in place. The tab strip and the 3D Playroom come off `/projects`. | Playroom is the main source of mess and the heaviest code. |
| D4 | Home: real hero with 3D Void, character card, three link cards, music box button. | Home is currently bland. |
| D5 | Story copy stays verbatim except D2. Scenes stay under 150 words. | You asked to keep the story. |
| D6 | Wishes: UI only. Nothing in the data path changes. | Supabase must not change. |
| D7 | Easter egg: **type `hush` anywhere on the site** (not inside a text field). Details in P7. | Empty `FEATURES.easter` slot is the missing egg. |

---

## P0. Lottie fix (3 min)

**Problem found:** `public/lottie/manifest.json` contains `[]`. `IconSlot` only loads a Lottie file if its name is in the manifest, so **none of your Lottie animations play right now.** Every icon shows the static fallback.

**Changes:**

1. `public/lottie/manifest.json` becomes the list of the 11 files that exist:
   `["nav-home","nav-story","nav-projects","nav-wishes","nav-about","icon-star","icon-heart","icon-moon","icon-cloud","icon-sparkle"]`
   (10 names: 5 nav and 5 icon. The `public/lottie` folder holds exactly 10 `.lottie` files, so the manifest lists all of them.)
2. `src/components/IconSlot.tsx`: raise `MAX_ANIMATING` from 3 to 8. Pages now show more Lottie icons at once (nav, cards, toggles). Without this, later icons stay static.
3. Verify: open `/home` and confirm there are no 404s for `/lottie/*.lottie` in the network tab, and that nav icons animate.

**Where each Lottie is used (after P3–P6):**

| Lottie | Used in |
|---|---|
| `nav-home`, `nav-story`, `nav-projects`, `nav-wishes`, `nav-about` | Navbar (already wired) |
| `icon-star` | Landing (beside the wordmark), Wishes empty wall |
| `icon-heart` | Wishes jar, Home "Wishes" card |
| `icon-moon` | Theme toggle (night state), Story TV when off |
| `icon-cloud` | Sound toggle (off state), Home "Story" card |
| `icon-sparkle` | Home "Projects" card, Easter egg burst |

---

## P1. Global style and day/night sync (8 min)

**Goal:** one token set, used identically by day and night. Nothing on any page hardcodes a colour or a font size.

### 1a. Colour tokens (`src/app/globals.css`)

Defined once in `:root` (day) and overridden once in `[data-theme='night']`. Every component reads only these names.

| Token | Day | Night | Used for |
|---|---|---|---|
| `--sky-top` | `#5b8fc9` | `#1b1a40` | page background gradient top |
| `--sky-bottom` | `#cfe6f5` | `#3d2f7e` | page background gradient bottom |
| `--paper` | `#fff8ec` | `#efe6d4` | cards, notes, buttons |
| `--ink` | `#2a2440` | `#120f26` | text on paper, outlines |
| `--text-on-sky` | `#fff8ec` | `#fff8ec` | text placed on the sky |
| `--cloud` | `#fbf8f2` | `#cfc4f2` | clouds |
| `--eye` | `#b8f23a` | `#b8f23a` | focus ring, glow accents (same both) |
| `--butter` | `#ffe27a` | `#ffe27a` | primary button (same both) |
| `--berry` | `#ff8fab` | `#ff8fab` | small badges (same both) |
| `--mist` | `#a8ecf0` | `#a8ecf0` | new accent (same both) |
| `--puffy` | existing shadow | darker shadow (`rgba(0,0,0,.45)` base) | soft card shadow |

Sticker colours (`--sticker-*`) stay as they are, used only for wish colours and project card tints.

Rule: **text on the sky is `--text-on-sky`. Text on paper is `--ink`.** No other text colour anywhere.

### 1b. Type scale

- Remove the `font-size: 21px` on `body`. Root stays at the browser default (16px). All sizes are rem.
- Tokens on `:root`:
  - `--fs-xs: 1rem` (16px, the minimum anywhere)
  - `--fs-sm: 1.125rem` (18px)
  - `--fs-body: 1.375rem` (22px)
  - `--fs-lead: 1.75rem` (28px)
  - `--fs-h3: 2.25rem` (36px)
  - `--fs-h2: clamp(2.6rem, 6vw, 3.6rem)`
  - `--fs-h1: clamp(3.4rem, 9vw, 5.5rem)`
- Fonts: Gochi Hand for headings, buttons and body. Nanum Pen Script for notes and quotes only, minimum `--fs-lead`.
- Body line-height `1.5`. Body text `max-width: 36rem` in prose blocks.
- Fix these known one-offs to tokens: `.credit-btn b` (13px), `.credit-btn i` (10.5px), `.footer-note` (1.05rem), `.nav-link` (1.4rem), `.sheet dt` (1rem), `.zzz` (3rem), `.note-input` (2.1rem), `.wish-card .meta` (0.95rem), `.landing-tag span` (1.8rem), `.dangle .tag` (1.5rem), `.soon` (0.95rem), and every inline `text-[1.Xrem]` in the views.

### 1c. Surfaces and buttons

- `.soft`: `--paper` background, `border-radius: 28px`, `var(--puffy)` shadow, 3px `--ink` border at 12% opacity. The one card style for all new work. `.paper` stays as an alias.
- `.btn`: primary (`--butter`), min 52×52px, `--fs-body`, 3px `--ink` border, `var(--puffy)`, pressed state moves down 3px. `.btn-quiet`: `--paper`, same size. `.px-btn` maps to `.btn` through an alias so old markup keeps working.
- Motion tokens: `--ease-soft: cubic-bezier(.22,.61,.36,1)`, `--dur-fast: 220ms`, `--dur: 420ms`, `--dur-slow: 900ms`. No looping motion faster than 3s.
- Focus ring: 3px `--eye`, 3px offset, on every interactive element.

### 1d. Day/night sync checklist (done when all true)

- Switching day ↔ night on `/`, `/home`, `/story`, `/projects`, `/wishes` changes the same tokens everywhere. Nothing stays day-coloured in night.
- Background gradient crossfades over 900ms (set `transition` on `body` background via a `@property` registered custom property, or a fixed full-screen layer that fades).
- The inline `THEME_BOOT` script in `layout.tsx` keeps working (no flash).
- `themeColor` in `layout.tsx` matches the current sky-top in both themes, or stays neutral.

---

## P2. Toggles: fun, interactive, peaceful (4 min)

**Goal:** the sound and theme toggles are the first thing a visitor touches. They should be delightful and calm.

**File:** `src/components/Toggles.tsx`, `src/components/icons.tsx`, `src/app/globals.css` (`.toggles`, `.icon-btn`).

### 2a. Theme toggle (sun ↔ moon)

- Day state shows a sun: a `--butter` disc with 8 soft rays. On hover the rays slowly rotate (`--dur-slow`).
- Night state shows the Lottie `icon-moon` (replaces the static moon). Lottie is 40px.
- Click: the disc travels in an arc to the other side over 600ms, the sky crossfades (see P1d), and the toggle plays `toggleNight` / `toggleDay` (existing sounds).
- Keyboard: Enter/Space, `aria-pressed` unchanged.

### 2b. Sound toggle (speaker ↔ muted)

- Sound on: three small bars (`--mist`) that breathe up and down over 1.6s, staggered. This shows "playing" without being loud.
- Sound off: the bars shrink to three dots, still. The Lottie `icon-cloud` sits behind as a soft halo (opacity 0.6) only in the off state.
- Hover: bars wiggle once (`wobble`, 300ms). Only on `(hover: hover)`.
- Click: the toggle plays `tap` if turning sound on. Turning sound off is silent. This keeps the off state quiet.

### 2c. Shared behaviour

- Both buttons are 52×52px with a 3px `--ink` ring, `--paper` fill, `var(--puffy)` shadow.
- Hover and press states use `transform` only.
- Tooltip is the existing `title`. Plus a visible `aria-label`.
- Reduced motion: no breathing, no arc, no wiggle. State change is a 200ms fade.

**Done when:** on phone and desktop, both toggles animate on tap, both states read at a glance, and mute silences everything (including the music box in P5).

---

## P3. Landing + Home (10 min, MAJOR)

### 3a. Landing (`src/views/LandingView.tsx`, `src/components/fx/*`)

Keep the iris transition to Home and the Void hero. Make the opening feel calm and complete.

Layout (top to bottom, all in normal flow, no absolute text):

1. **Wordmark** (`Wordmark.tsx`) at `--fs-h1`. Beside it, `icon-star` Lottie at 56px.
2. **Tagline** (`TAGLINE` from `config.ts`) at `--fs-lead`, max-width 26rem, `--text-on-sky`.
3. **Void hero** (existing `VoidHero`), centred, 280px phone / 360px desktop.
4. **Hand-written line** in Nanum Pen at `--fs-lead`: "Void is awake. Come in and rest with her."
5. **Button** `.btn`: "Come in" → iris to `/home`.
6. Background: `CloudSky` stays, slowed to 80% speed.

Remove: `.landing-tag` absolute placement, the `hidden md:block` side note at `right-[6vw] top-[44dvh]`, and the `left-[8%] top-[6%]` status note (move its text to the hand-written line above).

### 3b. Home (`src/views/HomeView.tsx`, `src/views/CribObjects.tsx`)

Goal: a warm nursery that answers "who is Void" on one screen and sends people on.

Layout (top to bottom):

1. **Hero:** `Void3D` at 60vh laptop, 45vh phone, centred. Headline "Hi, I'm Void." at `--fs-h1`. `TAGLINE` at `--fs-lead` under it.
2. **Character card** (`.soft`, max-width 40rem, centred). From `CHARACTER_SHEET`:
   - Labels "WHAT" / "DOES" / "STORY": `--fs-sm`, uppercase, letter-spacing 0.12em.
   - Values: `--fs-body`, line-height 1.5.
   - `icon-moon` Lottie in the corner.
3. **Three link cards** (`.soft`, a row on desktop, stacked on phone). Each card: a Lottie icon at 72px, a title at `--fs-h3`, one line at `--fs-body`, and the whole card is the link.
   - **Story** (`icon-cloud`): "Watch Void's late night broadcast." → `/story`.
   - **Projects** (`icon-sparkle`): "Four very serious experiments." → `/projects`.
   - **Wishes** (`icon-heart`): "Whisper one. Void catches it." → `/wishes`, with the live count (`countWishes`, read-only, via `Odometer`).
4. **Lullaby strip:** one `.btn` "Hum a lullaby". Starts the music box (P5b). Plays nothing until tapped.
5. **Footer** (existing).

Remove from Home: `bottom-[26dvh]` and `right-4 top-[calc(50%+2rem)]` notes, `hint-note` absolute placement. They overlap on phones.

`CribObjects`: keep at most 4 objects, each moving no faster than one cycle per 6s. Anything that moves faster is removed.

**Done when:** no absolutely positioned text on Landing or Home. At 390px nothing overlaps and the cards stack. Day and night both read.

---

## P4. Story (5 min, MEDIUM)

- `src/features/story/data.ts`: change the one "he" to "she". Check each scene is under 150 words.
- `Captions.tsx` and `story.module.css`: caption text `--fs-body` minimum, closing line `--fs-lead`.
- `.osd` (`CH 01 ...`): `--fs-sm` minimum.
- Scene hint notes (`.note`): Nanum Pen at `--fs-lead`.
- Buttons: `.btn` / `.btn-quiet`.
- **TV off screen is no longer blank:** the off screen shows a slow CSS star field (12 stars, 4s twinkle) and `icon-moon` Lottie at 120px above the "PRESS POWER" button.
- Warp: cap `fps` at 30 on all devices. One warp per channel change.
- Keep: TV, knob, AUTO, POWER, keyboard, swipe, the tail-x5 secret (scene 5, already built).

**Done when:** every caption reads at phone width without zoom. TV controls are 44px or larger. The off screen is not empty.

---

## P5. Projects (8 min, MAJOR MAJOR)

Goal: one calm page. Four project cards you can see at once. One clear route through them.

### 5a. Structure (`src/features/projects/index.tsx`, `projects.module.css`)

- Header: "Void's Projects" at `--fs-h1`. Nanum Pen line at `--fs-lead`: "Four very serious experiments."
- **Dream route** (Tier 2, 5c): dashed night path drawn across the page. The four cards are the stops.
- **Four project cards** in a 2×2 grid on desktop, one column on phone. Each card (`.soft`): Lottie icon at 72px, title at `--fs-h3`, one-line description at `--fs-body`, one `.btn` "Open".
  - Puppets: `icon-star`. Table: `icon-cloud`. Forts: `icon-heart`. Report: `icon-sparkle`.
- "Open" expands the card in place to show the existing project content at full width. Only one card open at a time. Closing returns to the grid.
  - Puppets → `ShadowPuppetTheater`
  - Table → `KnockItOffTable`
  - Forts → `BlanketFortBlueprints`
  - Report → `VoidReport`
- Deep link `/projects#forts` opens that card.
- Keyboard: Arrow keys move focus between cards. Enter/Space opens.

### 5b. Music box (Tier 2, shared)

Web Audio synth in `src/audio/musicbox.ts` (new file, ~80 lines):
- Pentatonic scale, 8-note loop, triangle oscillator, 1.8s release, soft low-pass.
- Play/stop toggle. Respects the global mute: if `muted`, the button is disabled with a tooltip "sound is off".
- Shown on Home (P3, "Hum a lullaby") and in the Projects header as a small `.btn-quiet`.
- Nothing starts until the user taps.

### 5c. Dream route (Tier 2)

- One `<svg>` path with `stroke-dasharray` / `stroke-dashoffset` set from scroll progress (`requestAnimationFrame` on scroll).
- Four stops, one per card. A small sprite of Void (`Kitten` from `_kit`) sits at the active stop.
- Reduced motion: the path is fully drawn, no sprite movement.

### 5d. What gets deleted

- Tab strip (`TABS`, `ico()`, tab keyboard code) in `index.tsx`.
- `Playroom` import on this page (file stays in the repo, unused).
- The `hasWebGL2` gate on this page.

**Done when:** `/projects` shows the route and four cards with no empty space. Each card opens and closes by mouse, touch and keyboard. No 3D canvas on this page.

---

## P6. Wishes UI (4 min)

- Paper note text `--fs-lead` minimum. Character counter `--fs-sm`.
- Wall cards: `--fs-body` text, `.soft` surface. Tilt capped at ±2° (calm).
- Empty wall: `icon-star` Lottie and "no wishes yet. be the first star." at `--fs-lead`, so no blank space.
- Jar counter: `icon-heart` Lottie beside the count.
- "Load more" and the Send button: `.btn-quiet` / `.btn`.
- Remove the dead `void i` in the swatch map (`WishesView.tsx`).
- **Known bug, documented, not fixed in this pass** (touches the send path): a wish that takes more than 4s to insert is saved locally, and may post twice when it flushes. Say the word and I fix it next.

**Done when:** the page reads at phone width, no overlap, day and night both work, and a test wish still lands in the jar.

---

## P7. Easter egg: `hush` (3 min)

**Missing piece:** `src/features/easter/index.tsx` is empty and `FEATURES.easter` is `false`, so the site has no working Easter egg.

**Trigger:** typing the letters **h, u, s, h** anywhere on the site, not inside a text field or textarea. Buffer resets after 2s of no typing.

**What happens (about 12 seconds, then it fades out):**
1. The screen dims to a starry night (all pages, both themes). A fixed full-screen layer, `pointer-events: none` except the close button.
2. Void (the `Kitten` SVG) curls up in the centre. Eyes close. `purr(true)` plays.
3. A line appears in Nanum Pen at `--fs-lead`: "Goodnight. You did well today."
4. `icon-sparkle` Lottie bursts out from Void's position, 12 of them, drifting slowly.
5. After 6s, `purr(false)` and the layer fades out. A "still here" button stays for 2 more seconds, then hides.

**Changes:**
- `src/config.ts`: `FEATURES.easter = true`.
- `src/features/easter/index.tsx`: the keyboard listener, the buffer, the layer.
- Reduced motion: no drift, the layer is a 300ms fade.
- Mute respected: purr and sparkle sounds only when sound is on.

**Done when:** typing `hush` on `/home` and `/projects` triggers it, and nothing triggers it while typing in the wish box.

---

## No blank space audit (checked during the pages above)

| Place | Blank problem | Fix |
|---|---|---|
| Landing side | empty right half | Void hero and tagline fill it (P3a) |
| Home | empty middle | character card and link cards (P3b) |
| Story TV off | black screen | star field + moon Lottie (P4) |
| Projects, no WebGL | empty header | route + cards (P5) |
| Wishes empty wall | "no wishes yet" alone | star Lottie and copy (P6) |
| Footer | fine | unchanged |

---

## Verify (2 min)

1. `npm run typecheck` → no errors.
2. `npm run build` → passes.
3. Quick check at 390×844 and 1440×900 on `/`, `/home`, `/story`, `/projects`, `/wishes`: no overlap, no horizontal scroll, day and night both work, the toggles animate, Lottie icons load (no 404s), the `hush` egg works.

No extra double-checking beyond this.

---

## Time budget

| Part | Minutes |
|---|---|
| P0 Lottie fix | 3 |
| P1 Global style and day/night | 8 |
| P2 Toggles | 4 |
| P3 Landing + Home | 10 |
| P4 Story | 5 |
| P5 Projects (incl. music box, route) | 8 |
| P6 Wishes UI | 4 |
| P7 Easter egg | 3 |
| Verify | 2 |
| **Total** | **47** |

Over by 2 minutes. Cut first: the dream-route sprite (P5c, keep the path). Then the sparkle count in P7 (12 → 6).

---

## Open items (not blocking)

- Whether the music box should also play on Story (I am not adding it there, to keep Story calm).
- The wishes double-post bug (documented, not fixed).
