# Style guide

Reference: the app itself (its own design is the reference; no external film copied).

| | Value | Source |
|---|---|---|
| Palette | deep space `#05070c`, starlight `#ffffff`, signal red `#e8283c`; per-planet tints come from the app | MEASURED (index.html, bodies.js) |
| Type | Montserrat 600 for captions, 800 for the end line; sentence case | DECISION (app type) |
| Composition | app full-frame 16:9; captions bottom-left at 6% inset, above the app's own footer; nothing within 5% of the edges | DECISION |
| Pacing | a new interaction every 4–5 s; holds of ≥ 1.2 s after each result so it reads | DECISION |
| Motion | cursor: eased glides (ease-in-out, 0.5–0.9 s), never teleports; clicks get one 14-frame ring; the app supplies all other motion | DECISION |
| Captions | one short line per beat, fade 8 frames in / 8 out, white 92% with a soft shadow; max 6 words | DECISION |
| Texture | none: the app's own rendering, captured at 1.5× device pixels and encoded once | DECISION |
| Sound | none: the film always plays muted in the portfolio | DECISION |

## Motion rules
- **Cursor** is the only hand-made motion: quick and precise, no overshoot.
- **Camera:** none. The app's own transitions (expand, zoom-in, descent) are the camera moves.
- **Captions:** strong but quiet: fade in when the interaction starts, hold, fade before the next.

## Banned here
Big centred title on a gradient at the start · whoosh/zoom punches · fake HUD borders, corner timecodes · tracked all-caps eyebrow captions · any number not produced by the app on capture day.
