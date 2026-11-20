# GENESIS · Architecture

## World identity and generation

A text seed and two 14-bit coordinates identify a stellar system. The address space contains 268,435,456 systems. The galaxy catalog is an integer hash, a seeded xorshift generator and domain-separated streams for stars, worlds, satellites, ecology, cultures and local sites. Navigation wraps at both grid edges. Visiting worlds in a different order preserves their immutable geography.

Natural planets use stable local indices. Constructed planets use indices 8–19. A planetary surface is a 1024-unit torus. The same height function drives travel conditions, biome sampling, surface textures, atlas cartography and the planet disc in orbit. The founding tidal basin and its dry nursery shore form an explicit geographic constraint on every planetary seed. Weather, atmospheric density, temperature, elevation, aether variation and anomalies are procedural. Star systems carry cultures and a bounded political history used to calculate current trade conditions.

## Simulation

| Module | Responsibility |
|---|---|
| `kernel.js`, `terrain.js` | Hashing, coordinate system, toroidal spatial bins, seed catalogs, climate, field samples and texture baking |
| `ecology.js` | Inheritance, metabolic costs, local animal policies, population growth, isolation and speciation |
| `catalog.js` | Material properties, experiment thresholds, anatomy, construction and production data |
| `world.js` | Authoritative state, fixed steps, economic catch-up, resource collection, movement, physiology and landing |
| `actions.js` | Validated game commands, atomic costs, epoch gates, politics, engineering and interstellar travel |
| `persistence.js` | Seed-relative encoding, checksum, structural validation, local slots and recovery |
| `survey.js` | Regional star survey and ecological forecast kernels shared with the worker |
| `art.js`, `renderer.js`, `maps.js`, `effects.js` | Original procedural geometry, Canvas 2D, map interactions and optional instanced WebGPU particles |
| `audio.js` | Web Audio score and seeded sound effects |
| `interface.js`, `panels.js`, `client.js`, `words.js` | HTML controls, input, bilingual text, independent render loop and user feedback |
| `shell.html`, `style.css` | Offline application shell and responsive layout |

The authoritative simulation advances in 125 ms steps. Commands and input vectors mutate one world state. Epoch changes unlock controls and capabilities. Location addresses, kin, genes, material discoveries, diplomacy and buildings keep their identities. Rendering quality never changes the fixed step. The client caps catch-up per frame, pauses according to visibility and modal state, and permits explicit time acceleration.

Near actors use detailed movement and a spatial grid for neighbourhood queries. Twenty-eight initial animals share a pool with up to eight representatives of nearby descendant or engineered populations. Species further away evolve as numerical cohorts. The active world settles its economic and ecological cycles every four local seconds. A remote world catches up on return. Long gaps batch production and bound detailed selection to 160 cycles per catch-up. Distant civilizations evolve by seed and political season. Closed or hidden gameplay does not accrue real-world elapsed time.

## Rendering and budgets

The original 2D view combines cached terrain, finite sprite caches, procedural anatomy, seed-derived buildings, weather, orbiting satellites and a dynamic soundscape. Cells and their organelles are layered geometry. The music selects a root and evolving note pattern from the seed, epoch, field level and danger. Oscillators disconnect after each note.

The HTML includes the shared simulation kernels once. A Blob worker uses the same source to bake terrain, survey 49 systems, and forecast eight ecological cycles from a cloned snapshot. Full terrain is returned as a transferable RGBA buffer. The renderer uses a coarser texture while a bake is pending. Requests carry identifiers so delayed surveys cannot replace a newer atlas selection. A synchronous path supplies the same deterministic outputs when the worker is unavailable.

The renderer bounds its texture and sprite caches, culls offscreen objects and reuses decorative particle storage. Automatic quality adjusts detail and display-pixel ratio. When WebGPU is available, a WGSL vertex and fragment pass draws the particle instances in one submission. The playfield and navigation use Canvas 2D. Device loss removes the optional effect.

## Persistence

A save contains the universe seed, current address, fixed-step clock, resource ledger, lineage, discoveries with measured evidence, civilization chronicle, investments, engineered worlds, alliances and ship state. Local cohorts and active actors store differences from their seeded baseline. The catalog and baked maps regenerate on demand. A pending navigation target is also saved, so an in-progress course can resume.

The JSON envelope has a format identifier, schema, encoding, checksum and payload. Loading verifies the checksum and the expected value ranges before accepting the reconstructed state. The checksum detects accidental corruption. Autosave and manual saving each retain a previous valid value. Browser file export and import use the same codec. Closing a page or hiding it requests an autosave.

## Evolution controller

`globalThis.GenesisEvolution.setController(controller)` attaches an optional synchronous policy. The controller receives observations containing the local actor, genes, closest known food and threat, the player position, distances and simulation time. It returns a finite two-axis movement vector. The engine applies speed, metabolic cost, defence, local limits and fixed-step integration.

```js
const policy = {
  decide(observation) {
    const { a, threat, threatDistance } = observation;
    if (threat && threatDistance < 20) {
      return { x: Math.cos(a.angle + Math.PI), y: Math.sin(a.angle + Math.PI) };
    }
    return { x: Math.cos(a.angle), y: Math.sin(a.angle) };
  }
};
GenesisEvolution.setController(policy);
GenesisEvolution.setController(null);
```

A local MultiNEAT2 adapter can normalize those observations and map its outputs to the movement vector. The included game uses its native energy-aware controller. The engine reverts to the native policy if a custom controller throws. `GenesisEvolution.status()` exposes its active state and last error.

## Rebuild and reference

`python tools/build.py` assembles the standalone HTML from the modular sources. The same source tree regenerates the same bytes. Runtime dependencies are the browser APIs. The test suite uses Node's standard test runner. The optional native raster and Playwright tests are development tools.

The procedural reference informed the choice to address systems by coordinates, synthesize content on demand and keep game rules independent of drawing. GENESIS uses original implementation, artwork, sound and world rules. [Voidstruck architecture notes](https://github.com/vitaminclaude/voidstruck)
