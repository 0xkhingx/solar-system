# Firstlight · product film · brief

**One sentence:** one page carries you from the Big Bang to a live Earth, and you drive every step yourself.

- **Audience:** prospective clients browsing the Kynigma portfolio (home card, /work showcase, /work/firstlight case page). Desktop first; also seen small on phones.
- **Duration:** 36 s (1080 frames @ 30 fps), seamless loop.
- **Format:** 16:9, 1920×1080 master, 1280×720 web export to replace `enigma/public/media/web-solar-system.mp4` (+ `.jpg` poster). Plays **muted, looped, no controls** (`components/LoopVideo.tsx`), so the film carries no sound: every idea must read silently.
- **Replaces:** a 14.8 s mostly static walkthrough of the old "Solar System" build (see `reviews/old-video-contact.png`).

## Assets (real only)
- The live app itself, captured frame by frame from `index.html` served locally: real UI, real shaders, real data on capture day (USGS quakes, CelesTrak ISS orbit, Open-Meteo weather).
- Logo: the Firstlight mark as used in the app header (white half-planet, three `#e8283c` dots).
- Type: Montserrat (the app's own `fonts/montserrat.woff2`).
- Tagline: "From the first light to here." (the cover's line).

## Product facts the film may show (all visible in the app)
Big Bang → 9 universe chapters → the solar system grows out of the cosmic web · planets at their real positions for the date · 8 worlds + moons · Earth lit from where the Sun is right now, city lights on the night side · today's earthquakes (USGS) · the ISS at its real height with its next orbit · tap anywhere: country, local time, weather, sunrise · Earth through time: 11 eras back 750 million years · sites and a landing on a real photograph.

## Visual rules
- Keep: the app full-frame, never inside a fake browser chrome; one visible cursor that does real things.
- Avoid: invented UI, numbers or claims; zoom-punches on everything; a logo only at the end.
- Never: show anything the app does not actually do.

## Deliverables
`shotlist.md` · stills · contact sheet · `out/firstlight-film-1080.mp4` · `out/web-firstlight.mp4` (720p) · poster `.jpg` · source in `src/`.

## Render (re-shoot with today's live data)
1. In the repo root: `python3 -m http.server 8765`
2. `cd film/src && node film.mjs` → 1080 frames in `film/frames/` (~5 min; `--stills 60,470` for a quick check)
3. `ffmpeg -framerate 30 -i film/frames/%05d.jpg -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart film/out/firstlight-film-1080.mp4`
4. Web: scale to 1280×720, `-crf 24 -an` → `out/web-firstlight.mp4`; poster from `frames/00470.jpg` → `out/web-firstlight.jpg`; copy both to `enigma/public/media/`.
The app runs on a virtual clock (`film.mjs`), so every frame is exact however slow the GPU; quakes, the ISS and weather are whatever is live at capture time.
