# Void: Home + Landing "Wow" Plan

Goal: Home is the wow moment. A giant Void peeks over a ledge across the full laptop width. His eyes follow your mouse, toys sit all around him, and scrolling turns into a short, calm character film about who he is. Landing becomes a dark room you light up with a flashlight to find him.

Feel: calm, slow, warm. Every motion is scroll-scrubbed or answers you; nothing flashes or loops fast. With reduced motion, everything stays still and every interaction still works.

Rubric targets: Early-Web Soul (30%), Creativity and Surprises (20%), Functionality and Polish (35%), Clean Craft (15%). Tier 1: eye tracking, scroll story, day/night, Easter egg. Tier 2: flashlight cursor and the music box.

---

## A. Home hero: "The Peek" (first screen, 100vw × 100svh)

Reference: the black cat peeking over a wall, with only ears, head top and huge eyes showing. No red background; we use Void's own sky.

### A1. Layout

- **Full-bleed**, edge to edge. It ignores `.page` max-width and sits under the navbar.
- **Wall (top 62%):** a soft gradient from `--sky-top` to `--sky-bottom`, with a faint CSS star field at night and slow drifting clouds by day (CSS only, no WebGL).
- **Ledge (bottom 38%):** a full-width windowsill band in `--paper`, with the same soft plaster texture as the reference (SVG `feTurbulence` noise, multiply, 12% opacity) and a 6px darker lip on top.
- **Void's head:** one new hand-drawn SVG, `VoidPeek.tsx`. It's centred, `width: min(64vw, 1000px)`, and its bottom is hidden behind the ledge, so only the ears, head top and eyes show. He's flat black (`#141024`), with soft inner-ear pink, and his own green eyes (`--eye`), not amber, to stay on-model. Each eye has an iris ring, a big pupil, and two catchlights.
- **Headline:** "Hi, I'm Void." painted on the ledge front like a shop sign, at `--fs-h1`. The tagline is handwritten beneath it in Nanum Pen.

### A2. What Void does (eyes follow your mouse)

Reuse `src/hooks/useEyeTracking.ts`, which already moves `.pupil` groups and blinks `.lid` groups inside an SVG.

| You do | Void does |
|---|---|
| Move the mouse | Pupils follow it, smoothed. Head tilts up to ±4° toward the cursor. |
| Bring the cursor close to his face | Pupils dilate (scale 1.3). Ears turn toward you. |
| Hold still on his head for 2.5s | **Slow blink** (a cat's "I love you"). A small note appears: "he slow-blinked at you. that means he trusts you." |
| Move the mouse fast toward him | He **ducks** below the ledge (shy). He peeks back up after 1.2s, eyes first. |
| Click his head | Squish, `mrrp`, and three pixel hearts. |
| Hold on his head | Eyes half-close and he purrs (existing `purr`). |
| Cursor leaves the window | He watches the exit spot. After 6s, his eyes close and slow "z"s rise. |
| Scroll down | His eyes look down, following you. |
| Touch devices | Pupils follow the last tap. A gentle wander when idle. |

Every 3–6s he blinks on his own. Every 9s an ear twitches.

### A3. Big interactables around him (fill the whole width)

All sit on the ledge or the wall, so the screen has no empty band. Each one is a real button or draggable with a keyboard path.

1. **Ball of yarn (ledge, left).** Drag it or flick it and it rolls along the ledge with spring physics (`motion` drag plus inertia). Void's eyes lock onto it. If it rolls under his nose, a **paw swipes up** from behind the ledge and bats it back. `swat` and `thud` sounds.
2. **Feather toy on a string (hanging from the top, right of centre).** The cursor can grab and swing it on a spring. His pupils go huge, his head bobs, and his paw reaches for it if it swings low.
3. **The wish jar (ledge, right).** It glows softly and shows the live count (`countWishes`, read-only). Tap it: a star flies out of the jar into the sky and stays there for the visit. The jar links to `/wishes`.
4. **Fireflies (wall, 6 of them).** They drift slowly (`icon-sparkle` Lottie). Tap one and it lands on Void's nose; he goes cross-eyed for 1s, then it floats off.
5. **Window frame (top left).** The moon or sun Lottie sits in a small window. Clicking it toggles day/night, mirroring the toggle.
6. **Polaroids (wall, pinned with tape, left and right edges).** "Story" (TV still) and "Projects" (puppet still). They tilt to the cursor in 3D and link to their pages.
7. **Hidden paw.** Hover the very edge of the ledge for 3s and a paw slides up and pats your cursor. It isn't explained anywhere, so it's a small extra surprise.

On phone, the head is 92vw and the ledge holds the yarn and the jar; the feather, fireflies and polaroids move into the scroll sections below.

### A4. Scroll cue

At the bottom of the ledge is a small handwritten note: "scroll. he'll follow you." It has a bobbing arrow, and his eyes glance at it every 10s.

---

## B. Scroll film: "Getting to know Void"

Built with `motion/react` `useScroll` + `useTransform`. Each chapter is a `sticky` section about 200vh tall, so scroll scrubs it smoothly forward and back. Nothing autoplays.

### B1. He climbs over (0 → 1 screen)

As you scroll, the head rises, his paws grab the ledge, and he hops up to **sit on the ledge**, full body and tail. The ledge then slides away, leaving him sitting in the middle of the page. This is the turn from "peeking" to "meeting".

### B2. "What he is": the field-guide page

Pinned. Void sits in the centre in profile. As you scroll, **hand-drawn callout lines draw themselves** (SVG `pathLength` scrubbed by scroll) from each feature to a handwritten label:

- **Eyes:** "enormous. green. see in the dark, mostly see snacks."
- **Star charm:** "from the first wish he ever caught."
- **Ears:** "radar for crinkly bags."
- **Tail:** "60% of his feelings live here."
- **Paws:** "softer than they look."
- **Species stamp:** "Felis catus nocturnus · age: baby · size: one loaf."

These lines come from `CHARACTER_SHEET` plus new quirks. Paper texture, blueprint grid, and a rubber stamp "FIELD NOTES" that thumps in (`stamp` sound).

### B3. "His moods": a horizontal strip

Pinned section where vertical scroll moves a row of **five mood cards sideways** (translateX scrubbed). Each card has a big Void face and one interaction:

- **Sleepy:** tap and he yawns.
- **Curious:** his eyes follow the cursor inside the card.
- **Startled:** a butterfly crosses and his fur puffs.
- **Purring:** hold the card and it vibrates gently with the purr sound.
- **Mysterious:** only his eyes show in the dark, and they blink at you.

Each card carries one matching Lottie. The cards are paper, tilted, and taped, with the 90s scrapbook feel.

### B4. "What he does": the Wish Keeper

The page darkens into night as you scroll. Paper wishes (sample notes, plus real ones if any) **float up from the bottom** and, as they reach the top, fold into stars. When the chapter ends, the stars have drawn a **constellation that spells VOID**. The Odometer counts wishes caught. Call to action: "Whisper one" → `/wishes`.

### B5. "His voice": soundboard

A row of big round buttons, styled like 90s toy keys: **mrrp**, **purr**, **chirp at birds**, **tiny sneeze**, **hum the lullaby** (the music box). Each plays an existing engine sound and shows a speech bubble ("mrrp?" / "prrrrrr" / "ek ek ek"). This covers the PS's "voice" ask directly. It respects mute.

### B6. Doorways

Three full-width panels, one per row, with parallax on scroll. Each is an object that opens:

- **Story:** a little CRT TV whose screen flickers on as it scrolls into view.
- **Projects:** a toy box whose lid lifts.
- **Wishes:** the jar, lid off, stars spilling.

Hover tilts each panel. Click goes to the page.

### B7. Goodnight (page end)

As you reach the bottom, the sky dims and Void **curls up** on a cushion with his tail over his nose. One line: "you scrolled all the way down. he's proud of you." Two small links: "Hum a lullaby" and "psst… try typing hush" (a hint for the Easter egg). Then the footer.

---

## C. Landing: "Lights out"

The page before Home. Today it's a sky and a sleeping Void. New concept: **you walk into a dark room with a flashlight.**

1. **Black screen.** After 0.8s, **two green eyes blink open** in the dark, follow the cursor, and blink.
2. **Your cursor is a soft flashlight** (Tier 2): a CSS `mask-image: radial-gradient(...)` follows the pointer and reveals a cozy hidden room under the darkness. It contains the wordmark painted on the wall, a bookshelf, a sleeping-bag fort, fairy lights, and Void himself somewhere in the room. On touch, you drag to move the light, and it slowly sweeps on its own until the first touch.
3. **Find him.** Shine the light on Void: he squints at the beam, sneezes ("ek!"), and his eyes glow brighter. A note appears: "found you."
4. **Pull the light cord.** A string with a bead hangs from the top. Drag it down (spring physics, real "click" sound) and the **room lights fade in warmly** over 900ms. The fairy lights flicker on one by one, the wordmark lights up, and Void stretches and waves his tail.
5. **"Come in"** appears on a door sign. Click it and the existing **iris transition** opens straight into Home, with the peek waiting.
6. **Skip:** any key or a "lights on" link in the corner skips to step 4. With reduced motion, the lights start on.

Retro extras on Landing:

- A tiny **"you are visitor #N" hit counter odometer** on a paper tag. This is the +1 bonus. It counts this browser's visits with `localStorage`, and the tag says "this browser has visited N times", so it doesn't pretend to be a global count. No Supabase change.
- A **guestbook link** sticker pointing to Wishes (the live wall is the guestbook, +2 bonus).
- A blinking "under construction"-style sign: **"cozy zone: whisper only"**.

---

## D. Build notes

### New files

| File | What |
|---|---|
| `src/components/void/VoidPeek.tsx` | Giant peeking head SVG: `.pupil`, `.lid` and ear groups for `useEyeTracking`, plus a `duck()` / `peek()` handle |
| `src/views/home/PeekHero.tsx` | Section A: wall, ledge, head, interactables |
| `src/views/home/Toys.tsx` | Yarn, feather, fireflies, jar, hidden paw |
| `src/views/home/FieldGuide.tsx` | B2 |
| `src/views/home/Moods.tsx` | B3 |
| `src/views/home/WishKeeper.tsx` | B4 |
| `src/views/home/Voice.tsx` | B5 |
| `src/views/home/Doorways.tsx` | B6 + B7 |
| `src/views/landing/DarkRoom.tsx` | Section C flashlight room, light cord, hit counter |
| `src/views/home/home.module.css` | All Home styles |

### Changed files

- `src/views/HomeView.tsx`: becomes the chapters, top to bottom.
- `src/views/LandingView.tsx`: wraps the dark room. It keeps the iris to `/home`.
- `src/audio/engine.ts`: two new tiny synth sounds, `sneeze` and `cord` (click).

### What leaves Home

- The 3D `Void3D` moves off Home. It already lives on the Story TV, where it's the Tier 3 piece. That keeps Home at zero WebGL (except the cursor trail), so it stays fast. The hero is SVG, which is crisper at full width anyway.
- The current stats cards fold into chapters B4 and B6, and the character card becomes B2.

### Calm rules

- Easing `--ease-soft` everywhere, nothing faster than 220ms, and no idle loop faster than 3s.
- Scroll chapters are scrubbed, so the visitor controls the speed.
- With reduced motion, chapters show their final state, there are no parallax or flights, and every interaction still works.

### Order of build

1. `VoidPeek` + eye tracking + duck, slow blink and purr (the core wow).
2. Ledge, wall and the four main toys (yarn, feather, jar, fireflies).
3. B1 climb-over and B2 field guide.
4. B3 moods and B4 wish keeper.
5. B5 voice, B6 doorways, B7 goodnight.
6. Landing dark room, flashlight, light cord, hit counter.
7. Phone pass at 390px, then the reduced-motion pass.

If time runs short, cut from the bottom of this list up to step 4. Steps 1–3 plus the Landing are the wow.
