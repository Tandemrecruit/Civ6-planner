# Civ 6 Strategic Planner

A desktop planning tool for Civilization 6 that helps optimize tile usage, build orders, research paths, and more.

## Features (v0.1)

- **Hex Map Editor**: Build your map tile by tile as you explore in-game. Supports all terrain types (grassland, plains, desert, tundra, snow, coast, ocean), modifiers (hills, mountains), features (woods, rainforest, marsh, floodplains, and more), and resource tracking (luxury, strategic, bonus resources with tech-based reveals).

- **Tile Timeline Planning**: Create multi-step plans for each tile with flexible triggers:
  - **Immediate**: Execute right away
  - **Tech-based**: Trigger when a specific technology is researched
  - **Civic-based**: Trigger when a specific civic is completed
  - **Turn-based**: Schedule for a specific turn number
  - **Population-based**: Wait until a city reaches a certain population
  - **Manual**: User decides when to execute

- **District & Improvement Tracking**: Full support for all 19 district types (Campus, Holy Site, Theater Square, Commercial Hub, Harbor, Industrial Zone, Encampment, Entertainment Complex, Water Park, Aerodrome, Spaceport, Government Plaza, Diplomatic Quarter, Neighborhood, Aqueduct, Dam, Canal, Preserve, City Center) and 15 improvement types (Farm, Mine, Quarry, Plantation, Camp, Pasture, Fishing Boats, Lumber Mill, Oil Well, Offshore Platform, Seaside Resort, Ski Resort, Fort, Airstrip, Missile Silo).

- **Civilization Database**: Complete database of 50+ civilizations with all leaders from base game through Leader Pass, including unique abilities for both civs and leaders.

- **Turn Tracking**: Keep your planner synchronized with your actual game by updating the turn counter. Auto-save ensures your progress is never lost.

## Setup

### Prerequisites

- Node.js 20.19+
- npm or yarn

### Installation

```bash
# Clone or download this project
cd civ6-planner

# Install dependencies
npm install

# Start the app in development mode
npm start
```

### Common Commands

```bash
# Lint TypeScript/TSX
npm run lint

# Typecheck
npm run typecheck

# Format all files
npm run format

# Check formatting (CI uses this)
npm run format:check

# Run unit tests (CI uses this)
npm test

# Run tests with coverage
npm run coverage
```

### Building for Distribution

```bash
# Package for your current platform
npm run package

# Create distributable installers
npm run make
```

## Contributing

- **Target `development`** for all feature, fix, and chore PRs (not `main`).
- **PR titles must use Conventional Commits** (we squash-merge feature PRs, and the PR title becomes the merge commit message).
- See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, hooks, branching model, and workflow.

## CI/CD

### Pull Requests

CI runs on PRs targeting **`development`** (normal workflow) and **`main`** (release PRs and hotfixes):

- Formatting check (`npm run format:check`)
- Lint (`npm run lint`)
- Typecheck (`npm run typecheck`)
- Unit tests (`npm test`)
- Packaging smoke build (`npm run package`)

It also uploads a **Windows packaged build artifact** from `out/**` so reviewers can download and test.

### Releases (Windows)

Releases are automated with **release-please** and are cut from `main`:

- Merges to `main` (typically from release PRs originating in `development`) keep a release PR up-to-date (version bump + changelog)
- Merging the release PR creates a tag + GitHub Release and uploads Windows installer artifacts from `out/make/**`

## Tech Stack

- **Electron 28**: Desktop application runtime with native file system access
- **React 18**: Modern component-based UI framework with hooks
- **TypeScript 5.3**: Type-safe development with full IDE support
- **Zustand 4.4**: Lightweight state management with minimal boilerplate
- **Vite 7**: Fast development and build tooling via Electron Forge plugin
- **SVG-based Rendering**: Custom hex grid implementation for responsive, zoomable maps

## Usage

1. **Start a new game**: Select your civ, leader, victory type, and game speed
2. **Add tiles**: Click on the hex grid to add tiles as you explore in-game
3. **Plan districts**: Click a tile and use the inspector to plan future states
4. **Track turns**: Click the turn counter to advance and keep the planner in sync

### Controls

- **Scroll**: Zoom in/out
- **Shift + Drag** or **Middle Mouse**: Pan the map
- **Click**: Select a tile or add a new one

## Project Structure

```
src/
  main/           # Electron main process
    main.ts       # App window, IPC handlers
    preload.ts    # Secure bridge to renderer
  renderer/       # React frontend
    components/   # UI components
    data/         # Static data (civs, etc.)
    utils/        # Hex math, persistence
    store.ts      # Zustand state management
  types/          # TypeScript type definitions
    model.ts      # Core data model
```

## Data Model Overview

The planner uses a strongly-typed data model defined in `src/types/model.ts`:

- **`Tile`**: Represents a single hex on the map with static properties (terrain, features, resources, river edges) and dynamic state (improvements, districts, ownership). Each tile can have multiple `TilePlannedState` entries for future changes.

- **`City`**: Tracks a city's population, housing, amenities, owned/worked tiles, built districts with buildings, build queue, specialty focus, and planned districts with triggers.

- **`GameState`**: The root state object containing:
  - Game setup (civ, leader, victory type, speed, DLC settings)
  - Map data (tiles stored in a Map keyed by coordinates)
  - Player state (cities, gold, faith, strategic resources)
  - Research/civic progress (completed techs/civics as Sets, current research, queues)
  - Government (policy loadout)
  - AI civilizations (diplomatic status, threat levels, known cities)

- **`TilePlannedState`**: Timeline entries defining future actions on tiles, with flexible trigger conditions (immediate, tech, civic, turn, population, manual) and action types (place district, add improvement, remove feature, harvest resource).

For detailed architecture information, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Roadmap

- [ ] Build queue management
- [ ] Research/civic queue with Eureka tracking
- [ ] Policy swap recommendations
- [x] District adjacency calculator
- [ ] Conflict detection for tile plans

## License

MIT
