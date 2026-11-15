# Solar System Explorer

An educational, interactive tour in one page, in three acts:

1. **The story of everything.** The page opens on the universe. Scrub through nine chapters from the Big Bang to Today, each with a one-line caption and a short explanation. Every scroll, drag or hover throws time; the stars streak and the surface smears, then land on the next chapter.
2. **The solar system.** When the story reaches Today, the cosmic web rushes past and the solar system grows out of it: the Sun in the centre, eight planets on their orbits at their real positions for the date shown. Time runs slowly; drag or scroll to move it. Hover a planet for its tagline, click to open it. "← The Universe" in the header folds it back into act one. Three views: **Not to scale** (the readable default), **True distances** (real orbit spacing; every world becomes a dot, and the note explains why), **True sizes** (the planets in a row at their real relative sizes, with the Sun as a giant disc off the left edge).
3. **A world.** The clicked planet swells into its detail page. Step one: the planet with its major moons orbiting it, an about panel (what it is, diameter, distance, moons, year), drag to spin. **Click a moon** and it leaves its orbit, comes forward and the panel switches to that moon: what it is, diameter, orbit period, who found it and when; "Back to the planet" or Escape returns it. Step two: the featured region lights up, four sites with photo cards and notes. Step three: the descent to the site, with facts and a "Next site" control. Every rocky-world site now lands on a real photograph (NASA mission imagery for Mercury, Venus and Mars; Commons photographs for Earth); gas giants descend through a procedural cloud deck.

**Take the tour** (header) plays the whole thing unattended: the nine chapters, the expansion, a fast lap of the hub through all three scale views, Earth and its Moon, the Himalaya, Everest, then back to the hub. Any tap, scroll or key stops it.

**Touch.** Drag scrubs time in act one and the hub, drag spins a world, a quick swipe up or down steps through a world, taps pick planets, sites and moons. On phones the about panel becomes a bottom sheet and the step dots stay visible.

Run locally: `python -m http.server 8765` in this folder, then open `http://localhost:8765/`. The pages use ES modules and an import map, so they need a server (not `file://`).

## Pages and modules

| File | What it is |
|---|---|
| `index.html` | The app, all three acts. Deep links: `?view=hub` skips the universe (`&scale=distances` or `sizes` picks a view); `?body=earth` opens a world; `?body=earth&site=0&step=2` lands on a site; `?body=jupiter&moon=1` opens on a moon; `?tour` starts the tour. `&debug` writes state into the tab title. |
| `sun-timeline.html` | The Life of the Sun. Ten stages from nebula to white dwarf. Linked from the hub and from the universe's "Sun is born" chapter. |
| `universe-timeline.html` | The universe story as a standalone page, with a tenth chapter (the last stars). `?stage=N` opens on a chapter. |
| `explorer.html` | Redirects into `index.html` so old links keep working. |
| `bodies.js` | One config per planet (maps, palette, shader knobs, rings, clouds, night map, region and sites with real coordinates and photos, landing type, facts), plus `ORBITS`, `DUST`, `ABOUT`, `MOONS` and `RADIUS_KM`. **Edit this to add or tune a world.** |
| `universe.js` | The universe chapters, their looks and the fragment shader. Shared by the app and the standalone page. |
| `engine.js` | Shared maths, planet shader (relief, region highlight, night lights, ring shadow), atmosphere, cloud layer, rings, map loading with seam fix and pole pinch, procedural stand-in maps generated in a worker. |

## Imagery and credits

Everything the pages need is in the folder, so it can be copied or hosted anywhere. Only Three.js still comes from a CDN; the fonts (Montserrat, Inter; SIL Open Font License) are in `fonts/`.

- **Planet maps** (`maps/1k_*.jpg`, plus the Moon, Earth's clouds and Saturn's ring strips): James Hastings-Trew's planet maps, fetched from the threex.planets repo. Credit required; check his terms for commercial use. If a file fails to load a procedural stand-in is drawn. To use other maps, replace the files or edit `map` in `bodies.js`.
- **Earth extras**: `maps/1k_earth_spec.jpg` (ocean mask for the sun glint) and `maps/1k_earth_bump.jpg` (height map for relief) are from the same James Hastings-Trew set. Earth is lit from where the Sun really is at the moment you open it (`liveSun` in `bodies.js`), easing back to studio light for the region and landing steps. Its four extra sites (Amazon, Antarctica, Vatnajökull, Mount Fuji) use Wikimedia Commons photographs (CC BY 3.0 / 4.0, CC BY-SA 2.0 / 2.5), credited on screen.
- **Countries** (`data/countries.json`): Natural Earth 1:110m country borders (public domain), reduced to names, continents and rounded outlines. Pointing at Earth names the country and continent and draws its border; on touch screens it names whatever is under the centre of the globe. Borders are Natural Earth's de facto boundaries.
- **Earth through time** (`maps/paleo/`): eleven reconstructions from 750 million to 20,000 years ago, from C. R. Scotese's PALEOMAP PaleoAtlas for GPlates (CC BY 4.0, Zenodo record 10251792), resized to 1k and credited on screen while shown. The eras and their captions are the `history` list on Earth in `bodies.js`.
- **Earth's night lights** (`maps/1k_earth_night.jpg`): the city-lights texture from the three.js examples (`earth_lights_2048.png`), resized to 1k.
- **Site photographs** (`photos/`): Earth's four are Wikimedia Commons photographs (CC BY 4.0 / CC BY-SA 2.0, 2.5, 4.0); Mercury, Venus and Mars sites are NASA mission imagery (MESSENGER, Magellan, Viking, Curiosity, Perseverance; public domain), fetched from Commons. Each shows its credit on the landing step. `photos/mars-*.webp` are generated images used for the Mars cards and landing layers. Add a `photo` and `credit` to any site in `bodies.js` to change a picture.

## Known rough edges

- Gas-giant storm longitudes are approximate; nudge `lon` in `bodies.js` until the pin sits on the feature.
- Moons other than Earth's use a procedural grey surface; real moon maps can be added per moon with a `map` entry in `MOONS`.
- Venus "photos" are Magellan radar reconstructions with exaggerated heights, which the credit line says.
- The Sun timeline is still a separate page load.
- Three.js loads from a CDN.

Icons: Lucide (ISC licence), inlined as SVG.

Components: the buttons, the scale switcher, the about panel and the Earth time slider are Web Awesome 3.14 (MIT) web components. `vendor/webawesome.js` and `vendor/webawesome.css` are a prebuilt bundle of just `wa-button`, `wa-radio-group`, `wa-radio`, `wa-card`, `wa-slider` and the default theme, so the app still has no build step. To add a component, rebundle with esbuild from `@awesome.me/webawesome`.
