# Void: Story + Projects, implementation plan (v2)

Scope: fill the two blank slots, `src/features/story/index.tsx` and `src/features/projects/index.tsx`.
Story copy, project concepts and quips are kept exactly as in the original ideation. About stays as it is for now (you will rewrite it later).

## 0. What changed from the original prompt (and why)

| Original prompt | This build | Why |
|---|---|---|
| Fredoka + a serif, italic closing line | Gochi Hand (body/titles) + Nanum Pen Script (hints, quotes, notes). No italics anywhere | your standing rule |
| `--cream/--glow/--void` tokens | site tokens `--ink --paper --eye --butter --berry --sticker-*` and the `.paper .px-btn .tape` classes | looks native, theme-aware |
| Per-component `muted` prop + own AudioContext | the global `useAudio()` + 7 new synth sounds added to `src/audio/engine.ts` | one mute switch, one unlock rule, no duplicate contexts |
| framer-motion, lucide-react, canvas-confetti | `motion/react` (already installed), the site's own SVG/pixel art, a tiny DOM pixel-burst helper | zero new dependencies |
| 5 components mounted in one parent page | Story on `/story`, the 4 projects on `/projects` behind tabs | matches the routes and nav you already have |
| 5 bespoke kitten drawings | ONE `Kitten` SVG (same head as the logo/hero) reused in every scene | he stays on-model |
| 3D flip cards | tap-to-swap with a fade + tiny scale | 3D backfaces are the likeliest thing to break on phones |
| Hover-only blueprint drawing | lines draw when the card scrolls into view (hover replays it on laptop) | hover does not exist on phones |
| 4 stacked project sections | tab strip: one project fills the screen at a time | no endless scroll, each toy gets room, phone friendly |

Kept as-is: all 5 scene texts verbatim, the 5 interactions (flashlight, shadow parallax, tail x5 secret, etc.), puppet quips, knock-off quips, 4 fort cards with their stats, the full Void Report content.

Additions I made (small, in character): scene 1 tap the kitten = blink + mrrp; scene 3 tap the wall to change the shadow (butterfly, bunny, dragon); scene 4 tap to wave back and the child holds up the COME IN sign (a callback to the landing "Come in" button); a "scene n of 5" label.

## 1. Files

```
src/features/_kit/            shared by both slots
  Kitten.tsx                  the one Void SVG (eyes, look, tail, peek) + TAIL box
  Puppets.tsx                 butterfly / bunny / bird / dragon silhouettes (used by Story scene 3 AND the Theater)
  Hotspot.tsx                 invisible >=44px <button> placed by SVG coordinates (real keyboard + screen-reader target)
  burst.ts                    DOM pixel-confetti (WAAPI, auto-removed, skipped on reduced motion)
  kit.module.css
src/features/story/
  index.tsx                   <section id="story-slot">, scroll tracking, dots, scroll-snap
  data.ts                     the 5 scenes, copy verbatim
  scenes.tsx                  5 illustrations + their interactions
  story.module.css
src/features/projects/
  index.tsx                   <section id="projects-slot">, header, tab strip, panel switching (hash deep links)
  ShadowPuppetTheater.tsx
  KnockItOffTable.tsx
  BlanketFortBlueprints.tsx
  VoidReport.tsx
  projects.module.css
src/audio/engine.ts           + click, thud, swat, flap, chirp, puff, stamp
src/app/story/page.tsx        drops the Pixel Snow canvas (scenes paint their own sky; saves a WebGL context)
```
Also touched: `globals.css` `.page-in` lost its `both` fill-mode. The lingering identity transform made it the containing block for `position: fixed`, which pushed the progress dots 2000px down the page (found while testing).

## 2. Design rules

- Colors: `--ink` outlines (3px), flat fills, `--paper` cards (`.paper`), `--berry`, `--butter`, `--eye` (lime) for anything glowing. Sticker colors for blueprint/puppet accents.
- Type: Gochi Hand 1.25-1.35rem body, Nanum Pen 1.5-2rem for hints/quotes/sticky notes. Pixelation only in shapes (`.px`, `.px-btn`, `PixelStar` sprites, pixel-square confetti).
- Everything interactive is a real `<button>` (or role=switch/radio), min 44x44, `:focus-visible` ring from globals (lime).
- Reduced motion: no flights, no flips, no confetti; state changes are 200ms fades. Sound still plays.
- Sound: only through `useAudio().play()`; buttons marked `data-sfx="off"` when they play their own sound so the global "tap" note does not double up.

## 3. Story (`/story`)

### Layout
- Slot is full-bleed (`100vw`) and pulls up under the page padding, so scene 1 starts at the very top. Each scene is `min-height: 100svh`.
- Laptop (>=1024px): two columns. Left 1.15fr: illustration (4:3, capped so it never exceeds the viewport height). Right 1fr: paper card with title + text. Top padding 7rem clears the taped nav strip.
- Phone: illustration on top (full width, 4:3), card below. Top padding 5.5rem (toggles), bottom 7.5rem (dock).
- Page scroll only (no nested scroller). `scroll-snap-type: y proximity` set on `<html>` while the story is mounted, removed on unmount.
- Mood arc, one gradient per scene: 1 deepest night -> 2 rainy blue -> 3 warm-dark wall -> 4 dusk with a lit window -> 5 warm cream room. The dark literally becomes cozy.

### Timings (per scene, triggered when 30% is in view, once)
| t | what |
|---|---|
| 0ms | illustration fades up 24px, 500ms ease-out |
| 250ms | paper card slides in 450ms; title sticker pops (scale 0.8 -> 1, 260ms spring) |
| 700ms | text fades in |
| 1400ms | hint note fades in (Nanum Pen, gentle wobble every 5s) |
| loop | tail sway 3s, blink every ~4.6s (per scene delay), rain/lights/sparkles as the scene needs |
Reduced motion: only the fades, 200ms.

### Progress dots
5 dots, fixed. Laptop: vertical at the right edge, centered. Phone: a pill at the top-left, level with the sound/theme toggles (above the dock it covered the card text). 14px visible, 44px hit area, `aria-label="Go to scene 2: The Rain"`, `aria-current`. Click = smooth scroll (instant on reduced motion). Active scene is tracked by IntersectionObserver on the viewport centerline. Dots are only shown while the story is on screen.

### Scenes (illustration -> interaction -> sound)
1. **The Alley**: night wall with bricks, bakery window with striped awning and loaves, a streetlight whose cone stops short of the kitten, a bin, stars. Kitten sits beside the bin, eyes glowing. Tap kitten = blink + `mrrp`. Streetlight flickers softly (4s loop).
2. **The Rain**: CSS rain (18 streaks), wet ground with ripples, a cardboard box on its side with the kitten peeking from inside (head only), a flashlight lying in the box. **Flashlight hotspot**: on = beam cone grows from the lens (350ms), gold circle on the wet ground fades in (500ms), eyes widen (scale 1.25, 300ms spring), `click` sound. Tap again = off. Hint: "psst, tap the flashlight". Beam stays on after the first press until toggled.
3. **The Discovery**: warm-dark wall, big light circle, kitten silhouette at bottom-left with the beam, shadow butterfly in the light (wings flap, 0.9s loop). **Pointer parallax**: the shadow follows the pointer inside the scene, max +-26 units, smoothed with a spring (stiffness 120, damping 18). Touch: drifts slowly on its own (6s loop) and also follows a dragging finger. Tap the wall: butterfly -> bunny -> dragon (`pop` sound). Hint: "psst, tap the wall".
4. **The Window**: brick wall, glowing window with curtains, child silhouette (buns) waving (arm swings 1.2s loop), kitten below looking up, tail swaying. **Wave back** hotspot: tail wags fast for 1.4s, child holds up the COME IN sign (pop-in 300ms), `chime`. Hint: "psst, wave back".
5. **The Home**: warm room, floor lamp with glow, blanket-fort tent with twinkling fairy lights, pillow, kitten on the pillow with the tail clearly visible. **Tail x5** (taps within the session, counter resets after the burst): each tap wiggles the tail + `pop`; on the 5th: pixel-confetti (berry / lime / paper), purr for 1.8s, speech bubble "you found my secret. i was never scary. just cozy." for 4.5s. Only hint: a barely visible tiny "psst" (opacity 0.35) beside the tail. Closing line under the card in Nanum Pen, no italics.

Easter-egg note: this is the story's own secret. The site-wide easter egg slot is untouched.

## 4. Projects (`/projects`)

### Shell
- Header: "Void's Projects" + a Nanum Pen line ("four very serious experiments").
- Tab strip (radio-style tabs): Puppets, Table, Forts, Report. Laptop = a row of paper tabs; phone = one row of four icon-over-label tabs (64px tall) so the stage starts higher. Selected tab is butter-colored and hops. Panels switch with a 220ms fade/slide. `#puppets` etc. in the URL for deep links. Sound: global tap.
- Each panel: title (Gochi), subtitle (Nanum Pen), the stage, a caption. `min-height` so the stage fills the viewport on laptop; stacks on phone.

### 4.1 Shadow Puppet Theater
- Laptop layout: wall on the left, controls column on the right (Void says, 2x2 puppet buttons, Reset light) so everything fits one screen. Phone: stacked.
- Wall: rounded dark panel with a soft glowing border, lamp icon in the corner. Radial warm light follows the pointer (CSS vars `--lx/--ly`), puppet is centered on the light.
- Mouse: follows hover. Touch: follows while the finger is down (`touch-action: none` only on the wall, page still scrolls elsewhere). Quick tap (<350ms, <8px) = act. Pointer capture on press.
- Puppets (radio buttons): Butterfly, Bunny, Bird, Dragon. Selecting = 300ms bounce.
- Acts (900ms): butterfly flaps `flap`; bunny hops twice `boing`; bird flaps + flies a short arc `chirp`; dragon puffs a sparkle burst `puff`.
- "Void says": Butterfly "Her name is Brenda." / Bunny "He's very serious about carrots." / Bird "Technically a pigeon." / Dragon "Excellent hair." (swaps with a 150ms fade).
- Keyboard: wall is focusable; arrow keys move the light 4%, Enter/Space acts. "Reset light" button re-centers (spring 300ms).

### 4.2 Knock-It-Off Table
- 420x260 SVG: wooden table (side view), floor, six objects (mug, plant, clock, book, globe, mystery vase), a black paw+arm resting at the left.
- Tap/Enter an object: paw slides to it (180ms), swats (`swat`), the object tumbles off the front edge with rotation (700ms gravity ease, `thud` on landing + dust puff), quip bubble for 2s. Counter "Gravity checks: X / 6".
- Quips: mug "Gravity still works. Noted." / plant "Redecorating." / clock "Time is a flat circle. Now also on the floor." / book "I read the first page. It was heavy." / globe "The world is on the floor now." / vase "That one was on purpose."
- 6/6: "Experiment complete! Void is very proud." + confetti + "Put it all back" (objects rise back in reverse, staggered 80ms).
- Reduced motion: objects fade out, counter still updates.

### 4.3 Blanket Fort Architecture
- 2x2 grid on laptop, 1 column on phone. Cards = deep-blue blueprint paper (dashed white grid), hand-drawn white line art, a cream "APPROVED" stamp that drops in (`stamp` sound) when the card first scrolls into view.
- Front: title, drawing, three stats; Stability bar animates to its value (700ms) on first view. Back: Materials, "Void's Notes", tiny cat silhouette. Tap/Enter/Space flips (fade + scale 0.96 -> 1, 260ms). `aria-pressed`, the hidden side is `aria-hidden`.
- Cards: Classic Couch Fort 7/10, 3 snacks, High / Table Tent 8/10, 5, Very high / Pillow Fortress 4/10 (collapses when sneezed on), 1, Maximum / Grand Cardboard Palace 9/10, 8, Legendary. Notes: "Do not sneeze near the pillow fortress." and one for each of the others.
- Lines draw once on view (pathLength + dashoffset, 1.2s); on laptop hover replays it.

### 4.4 The Void Report
- Cream paper card, slight rotation + paper shadow. Title "Why Do Cats Stare at Walls? A Longitudinal Study of Nothing", author line, abstract (verbatim), Introduction / Methods / Results / Conclusion, "Funded by: snacks."
- Figure 1 (inline SVG bars, scales to container): wall 14 min, napping 240, knocking things off tables 3, judging you = infinite (bar runs off the edge with an arrow and the infinity sign). Bars grow in on scroll (900ms, staggered 120ms).
- Peer review switch (`role="switch"`, `aria-checked`): sticky notes appear beside paragraphs on laptop, below them on phone, each pops in with a 120ms stagger.

## 5. Audio additions (all synthesized, 400Hz-3kHz so phone speakers can play them)
`click` flashlight (two short square ticks) / `thud` (110->60Hz sine + soft noise sweep) / `swat` (fast noise sweep) / `flap` (3 short noise flutters) / `chirp` (3 gliding sines) / `puff` (noise sweep + 3 sparkle notes) / `stamp` (triangle thump + noise). Purr uses the existing `purr(on)`.

## 6. Performance + safety
No new WebGL, no new dependencies. Rain/lights are CSS transforms. Observers are disconnected on unmount. `scroll-snap` on `<html>` is removed on unmount. All sounds go through the engine (no context before a gesture). DOM confetti caps at 24 particles and removes itself.

## 7. Acceptance checklist (I run these before handing over)
1. `tsc --noEmit`, `next build`, `verify:fx` all pass; zero console errors on /story and /projects.
2. 1440x900 and 390x844 screenshots of every scene and every project, no overlap with nav strip / dock / toggles.
3. Every interaction exercised by script: flashlight on/off, shadow tap cycle, wave back, tail x5, dots jump, puppet select + act, all 6 objects + reset, card flips, review switch.
4. Keyboard path works (Tab to every hotspot, Enter/Space triggers).
5. Reduced-motion run shows no flights/flips and the counters still work.

## 8. Known flags
- Pronouns: the story copy says "he"; `CHARACTER_SHEET` in `config.ts` says "her". I kept your story verbatim; fix one of them when you rewrite About.
- The story calls Void a "Junior Darkness Designer"; the current About says Wish Keeper. Same note, resolve when About is rewritten.
