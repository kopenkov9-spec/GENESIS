# GENESIS · Beyond Matter

An offline evolution sandbox set on a persistent homeworld. Start as a cell in a tidal pool. Establish a land population, meet neighbouring houses and build a civilization. Your ship can return to the settlement and biological lineage you left behind.

## Play

1. Extract the ZIP.
2. Double-click `START_GAME.bat` on Windows or open `GENESIS_Beyond_Matter.html` in desktop Edge or Chrome.
3. Select **EN** for English, enter a world seed and choose **Begin a new life**.

The standalone HTML contains the entire game. JavaScript and Canvas 2D handle the baseline experience. The browser synthesizes sound after a user gesture. All assets and worker code are local. The page's content policy blocks network connections.

## First steps

Choose **Nutrient bloom** in **Field** three times. In **Anatomy**, grow a flagellum or another organ, then choose **Divide**. Return to **Field** and enter **Evolution**. Grow an air sac and an antenna, reach **Dry shore** and found a land population. Objective rows link to the relevant panel.

Use **Lab** to combine materials, a stimulus and an intensity. The notebook contains hypotheses. An aether spring restores charge and supplies brine. After launch, **Atlas** lets you select a neighbouring star, jump, approach a planet and land. **Home star** selects your birthplace. After Transcendence, the same save continues in the open sandbox.

## Controls

| Input | Action |
|---|---|
| WASD or arrow keys | Swim, walk or thrust |
| Shift while moving | Boost |
| Click or tap the scene | Travel to a position or approach a marked site |
| Field target buttons | Navigate and gather when you arrive |
| E | Gather a nearby sample or land within range |
| Space on the playfield | Emit a defensive aether pulse |
| X or Brake | Apply orbital braking thrusters |
| M | Open or close Atlas |
| P, Ⅱ | Pause the world clock |
| ×1, ×3, ×8 | Change simulation speed |
| Esc or GENESIS wordmark | Return to the main menu |

On narrow screens the panel sits below the playfield. Graphics quality, volume, WebGPU motes and diagnostics are available in **Settings**. The diagnostics display live FPS, simulation and drawing costs, agent count and JS heap size when the browser exposes it.

## Saves

Autosaves run about every 15 seconds and on important transitions. Use **Saves → Save manually** for a separate slot. Each slot keeps its previous valid save. **Export file** creates a portable `.genesis` file. **Import file** validates the checksum and state before resuming. Export before changing browser profiles or moving the game HTML. File export also works when browser storage is restricted.

## Source and QA

| Location | Contents |
|---|---|
| `src/` | Simulation, procedural catalogs, rendering, audio, localization and UI |
| `tools/build.py` | Reproducible, dependency-free Python build |
| `tests/rules.test.cjs` | Simulation, persistence, worker and packaging assertions |
| `tests/journey.cjs`, `tests/seed_sweep.cjs` | Ordinary-command campaigns, interstellar return and postgame |
| `tests/ui_scenario.js` | Shared player-control itinerary |
| `tests/ui_host.cjs` | Node event fixture and native Skia raster integration |
| `tests/browser_ui.py` | Offline Playwright scenario for an installed desktop browser |
| `docs/` | Rules, architecture, controller contract and implemented features |
| `reports/` | Measured performance, coverage and test output |

From the project folder in Windows CMD:

```bat
py tools\build.py
node --test tests\rules.test.cjs
node tests\journey.cjs PELAGOS
node tests\seed_sweep.cjs 96
node tests\bench.cjs
```

The core suite uses Node.js 20+ and its standard library. The optional UI fixture and raster benchmark use the development dependency listed in `package.json`. The optional browser test uses Python Playwright and a locally installed Chromium, Chrome or Edge executable. These tools are for development. A player needs only the HTML and a browser.

Българското упътване е в `README_BG.md`.
