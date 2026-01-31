# Civ 6 Strategic Planner — Design Document

## Overview

### What is this?

A desktop planning tool for Civilization 6 that helps optimize tile usage, build orders, research paths, civic timing, policy loadouts, and city specialization across a full game — from initial settle through victory.

### The problem it solves

Civ 6 decisions compound. A tile you chop in the Ancient Era might have been the key to a +6 adjacency Industrial Zone in the Industrial Era. A civic you research for its unlocks might complete at the wrong time for the policy swap you needed. District placement in City A affects what's possible in City B.

Existing tools (district calculators, adjacency planners) solve point-in-time optimization but don't help with:

- **Temporal planning:** What should this tile be _now_ vs what should it _become_?
- **Cross-system coordination:** How do research, civics, builds, and policies interact?
- **Adaptation:** How should plans change when the map reveals new information — without constant flip-flopping?

This tool maintains a living plan for the entire game that reacts to new information while staying stable enough to actually follow.

### How it works

1. **You play Civ 6.** Every few turns, you alt-tab to the planner and update game state: new tiles explored, builds completed, techs researched, threats detected.

2. **The tool maintains your plan.** Tile assignments, build queues, research order, policy loadouts — all tracked with explanations for why each decision was made.

3. **The engine suggests optimizations.** When state changes, it re-evaluates and surfaces recommendations: "Eureka earned — consider moving Apprenticeship up." Suggestions require meaningful improvement over existing plans to avoid churn.

4. **You stay in control.** Accept suggestions, dismiss them, or lock plans you've committed to. The tool advises; you decide.

### Key principles

- **Stability over perfection:** A plan you can follow beats a theoretically optimal plan that changes every turn.
- **Explain the reasoning:** Every recommendation comes with an explanation so you can evaluate it yourself.
- **Civ-aware:** Hardcoded knowledge of each civ's uniques means recommendations account for Brazil's rainforest bonuses, Japan's district clustering, Russia's tundra viability, etc.
- **Runs locally:** No cloud dependencies, no LLM calls, no account required. Your game data stays on your machine.

## Goals & Non-Goals

### Goals

**Primary goal:**
A desktop tool for planning and optimizing a full Civ 6 game, from first settle to victory, that adapts as the game progresses while maintaining plan stability.

**Core capabilities:**

- Plan optimal tile usage including interim states before final use
- Manage build queues across all cities with cross-city coordination
- Generate research and civic queue orderings that react to game state changes
- Plan policy loadouts with awareness of civic completion timing
- Suggest city specializations, governor assignments, and trade routes
- Recommend expansion locations and settler production
- Detect conflicts between plans and surface resolution options
- Provide threat assessments based on AI civ behavior and positioning

**User experience goals:**

- Map-centric interface with visual overlays for planning
- Quick update flow for syncing every few turns
- Recommendations that explain their reasoning at configurable depth
- Stability: avoid recommendation churn that undermines long-term planning
- Support all civs with hardcoded unique ability logic
- Support all DLC and optional modes (Gathering Storm, Rise and Fall, dramatic ages, heroes, secret societies)

**Technical goals:**

- Runs entirely locally — no cloud services, no LLM dependencies
- Single desktop application
- Fast enough for interactive use (re-evaluation completes in seconds)

### Non-Goals (v1)

**Out of scope for initial version:**

- **Save file parsing / game integration:** All data entry is manual. No reading Civ 6 save files or memory.
- **Multiplayer planning:** Designed for single-player games only. No support for coordinating with human teammates or predicting human opponents.
- **Mobile or web version:** Desktop only.
- **Multiple simultaneous playthroughs:** Tracks one game at a time. Start a new game = reset.
- **LLM-powered recommendations:** All logic is rules-based and heuristic. No calls to external AI services.
- **Pixel-perfect game overlay:** This is a companion app, not an in-game overlay. User alt-tabs between Civ 6 and the planner.
- **Automated turn detection:** User manually indicates when turns advance and what changed.
- **Historical game analysis:** No "review your past games" or statistics tracking across playthroughs.
- **Mod support:** Assumes base game + official DLC only. No custom civs, units, or mechanics.

### Future Considerations

These are not in v1 but could be added later:

- Save file import to bootstrap map state
- Multiple game tracking
- Game history and statistics
- Mod support for custom civs
- Web or mobile companion apps

## User Scenarios

### Scenario 1: Game Start — First Settle and Initial Planning

**Context:** You've just started a game as Korea (science-focused civ). You can see your starting tiles and need to plan your opening.

**Flow:**

1. Create new game in the planner: select Korea, Science victory, Standard speed, Gathering Storm enabled.
2. Add starting tiles to the map — terrain, features, resources, rivers.
3. The tool suggests: "Strong campus spot 2 tiles NE (+4 adjacency from mountains). Recommend settling on the plains-hill for +1 production."
4. Plan your capital: mark the campus tile, assign "science city" specialty.
5. Queue initial builds: Scout → Slinger → Settler. Tool notes: "Monument not queued — consider for early culture if you want Political Philosophy faster."
6. Queue initial research: Pottery → Writing (for campus unlock). Tool suggests: "Mining first enables Eureka for Apprenticeship later — consider if you want early IZ."

You've got your opening mapped out.

### Scenario 2: Early Expansion — Deciding Where to Settle City 2

**Context:** Turn 30. Your settler is ready. You've explored several potential settle locations.

**Flow:**

1. Update the map with newly explored tiles.
2. Open expansion planner — tool shows ranked settle locations:
   - Location A: River, +3 campus spot, luxury (ivory), 12 workable tiles
   - Location B: Coast, harbor potential, strategic resource (horses), but overlaps 3 tiles with capital
   - Location C: Forward settle, blocks Aztec expansion, decent but not great tiles
3. Tool notes: "Location C is risky — within Aztec loyalty pressure range. Location A is safest for science focus."
4. You choose Location A. Tool updates:
   - Marks the city center and workable range
   - Suggests specialty: "Production hub — strong hills, consider Industrial Zone focus"
   - Adds planned districts to tile planner
5. Capital's build queue updates: "Settler complete. Suggested next: Builder (improve tiles for new city) or Monument (culture for civics)."

### Scenario 3: Mid-Game — The Chop-or-Preserve Decision

**Context:** Turn 85. You're planning an Industrial Zone in City B. The best adjacency spot has woods that would give +1 appeal to nearby tiles (relevant for a planned National Park in City C).

**Flow:**

1. Select the woods tile. Tool shows:
   - Current: Woods on plains, unimproved
   - Option 1: Chop now → +45 production toward current build, lose appeal contribution
   - Option 2: Lumber mill → production while preserving woods, delays IZ
   - Option 3: Plan IZ here at Industrialization → chop at that point, keep appeal until then
2. Tool recommends Option 3 (medium confidence): "Woods provide +1 appeal to 3 tiles in City C's national park zone. Preserving until Industrialization lets you benefit from appeal now and still get the IZ. Chopping now gains 45 production but costs 2 appeal on park tiles."
3. You accept. Tile timeline updated:
   - Now: Unimproved (preserving woods)
   - At Industrialization: Remove woods, place Industrial Zone
4. Conflict check passes — no other plans affected.

### Scenario 4: Civic Completion — Policy Swap Decision

**Context:** Turn 102. Political Philosophy is about to complete. You have campuses coming online and want Rationalism, but it's not unlocked yet.

**Flow:**

1. Civic completes. Notification: "Policy swap available. Recommended changes:"
   - Military: Keep Agoge (still building units)
   - Economic: Swap Urban Planning → Natural Philosophy (+100% campus adjacency while building campuses)
   - Note: "Rationalism unlocks at The Enlightenment — 3 civics away. Natural Philosophy is the best option until then."
2. Tool shows civic queue with policy unlock markers — you can see when Rationalism becomes available.
3. You accept the swap. Policy planner updates current loadout.
4. Build queue reprioritizes: "Campus adjacency bonus active — consider prioritizing library builds to maximize value."

### Scenario 5: Threat Detection — Responding to Aggressive Neighbor

**Context:** Turn 120. You notice Aztec units massing near your border.

**Flow:**

1. Update AI civ info: change Aztec threat level from "neutral" to "high."
2. Engine re-evaluates. Notification sidebar shows:
   - Alert: "Threat level increased. Recommended adjustments:"
   - Build queue: "Add walls to City B (border city), prioritize 2 archers"
   - Research queue: "Consider moving Military Engineering up for Niter access"
   - Policy planner: "Swap to Limes (+100% wall production) until walls complete"
   - Governor: "Consider Victor in City B for garrison combat bonus"
3. Changes are _suggestions_, not auto-applied. You review and accept what makes sense.
4. Your science victory plan isn't abandoned — just temporarily adjusted for defense. Tool notes: "These changes delay campus completion by ~8 turns. Recommend returning to science focus once threat neutralized."

### Scenario 6: Late Game — Coordinating Victory Push

**Context:** Turn 250. Science victory in sight. You need to complete spaceport projects across multiple cities.

**Flow:**

1. Build queue shows all cities with spaceports and their queued projects.
2. Tool coordinates: "City A should build Launch Earth Satellite (fastest). City B should build Launch Moon Landing simultaneously. City C should queue Mars modules."
3. Policy planner: "Swap to Integrated Space Cell (+15% space project production) — you have 3 spaceports now."
4. Research queue: "Remaining techs needed: Robotics, Nanotechnology. Current order is optimal."
5. Tile planner: "City A has 2 mines not yet improved — improving them adds +4 production toward space projects."
6. You execute the coordinated plan, monitoring progress in the global build queue view.

### Scenario 7: Quick Update Session

**Context:** You played 10 turns without updating the planner. Now you're syncing up.

**Flow:**

1. Open app. Prompt: "Last update: Turn 140. Current turn?"
2. Enter: Turn 150.
3. Quick update wizard:
   - "Builds due around this time: Library (City A), Granary (City C). Completed?" → Check the ones that finished.
   - "Techs due: Education. Completed?" → Yes. Mark any Eurekas earned.
   - "Civics due: Medieval Faires. Completed?" → Yes. Tool prompts for policy swap.
   - "New tiles explored?" → Click to add on map.
   - "Any cities founded or lost?" → Add new city.
4. Engine re-evaluates. Change summary:
   - "Minor: Apprenticeship moved up (Eureka earned)"
   - "Minor: City A build queue reordered (library complete, university next)"
   - "No changes to tile plans"
5. You're synced. Review any significant changes, then alt-tab back to Civ 6.

## Data Model

The data model represents the game state at a point in time, plus planned future states and the dependencies between them.

### Tiles

Tiles are the atomic unit of the map. Each tile is identified by axial hex coordinates (q, r).

**Static attributes** (don't change during a game):

- Base terrain: grassland, plains, desert, tundra, snow, coast, ocean, mountain, hills (modifier)
- Features: woods, rainforest, marsh, floodplains (by river type), reef, geothermal fissure, volcanic soil, oasis, cliffs
- Resource: strategic/luxury/bonus, plus whether it's revealed (some require tech)
- River edges: which tile edges have river adjacency

**Dynamic attributes** (change as the game progresses):

- Improvement: farm, mine, plantation, etc. (nullable)
- District or wonder: placed district/wonder (nullable)
- Owning city: which city works this tile (nullable)
- Owning civ: player, AI civ, or unclaimed
- Pillaged state: whether the improvement/district is pillaged

**Calculated attributes** (derived from surroundings):

- Appeal: calculated from adjacent tiles, features, improvements, wonders
- District adjacency bonuses: calculated based on what's adjacent

**Planned states:**
Each tile can have a planned final state and zero or more intermediate states. A state includes:

- Target improvement, district, or wonder
- Trigger condition: "at Apprenticeship", "when population reaches 7", "immediately"
- Rationale: why this is the plan (for user reference)

Example: Tile (3, -1) is currently woods on plains with no improvement.

- Immediate: build lumber mill (provides production while preserving woods)
- Intermediate: remove at Industrialization for +3 production toward factory
- Final: place Industrial Zone

### Cities

Cities own tiles and are the unit of production.

- Name and location (center tile coordinate)
- Population, housing cap, amenity balance
- Owned tiles: set of tile coordinates in workable range
- Worked tiles: subset of owned tiles currently being worked by citizens
- Districts: built districts with their tile locations
- Buildings: constructed buildings within each district
- Current production: what's being built and turns remaining
- Production queue: ordered list of planned builds
- Governor: assigned governor and their promotion level (nullable)
- Specialty designation: label indicating city role (science city, production hub, generalist, wonder factory, etc.). Can be user-assigned or suggested by the tool based on tile potential and adjacency opportunities.
- Planned districts: which districts will be built and on which tiles

### Civs

Both the player and AI civs are tracked, though with different levels of detail.

**Player civ:**

- Leader and civ: determines unique abilities, units, buildings, and infrastructure
- All city data (full detail)
- All explored tile data

**AI civs:**

- Leader and civ: for understanding their uniques and agenda
- Known cities: cities the player has discovered
- Claimed tiles: tiles owned by their cities (defines expansion boundaries)
- Diplomatic stance: friendly, neutral, unfriendly, denounced, at war, allied
- Threat assessment: user-assigned priority for military response

### Game State

Global state that affects decisions across all cities.

- Current turn and era
- Unlocked techs and civics (set of IDs)
- Tech in progress: which tech, accumulated science, turns remaining
- Civic in progress: which civic, accumulated culture, turns remaining
- Government: current government type and slot configuration
- Slotted policies: which policies are active in which slots
- Resources: stockpiled gold, faith, diplomatic favor, strategic resources
- Great person progress: points accumulated toward each great person type

### Plans & Queues

Cross-cutting plans that span multiple cities and systems.

**Research queue:**

- Strictly ordered list of techs
- Target techs: key unlocks the player is working toward (e.g., "need Apprenticeship for IZ adjacency")
- Reactive: the queue re-evaluates when the user updates game state (new discovery, city settled, Eureka earned, threat level changed). Re-evaluation can reorder existing items or suggest new techs to add.

**Civic queue:**

- Strictly ordered list of civics
- Policy timing constraints: "want to complete Political Philosophy when ready to switch government"
- Key civic targets for policy unlocks
- Reactive: reorders or suggests new civics based on policy needs, government timing, inspiration progress, and game state changes

**Global build priorities:**

- Cross-city coordination: "next campus goes to city with best adjacency"
- Wonder assignments: which city builds which wonder
- Project coordination: space race parts, carbon recapture, etc.

### Dependencies

Dependencies determine what enables or enhances an action.

**Hard dependencies** (must be satisfied before action is possible):

- Tech/civic prerequisites: campus requires Writing, theater square requires Drama and Poetry
- Population requirements: each district beyond the first requires additional population (4, 7, 10...)
- Placement rules: campus cannot be on certain terrains, aqueduct must be adjacent to city center and fresh water
- Resource requirements: some buildings/units require strategic resources
- Government requirements: certain policies require specific government types

**Soft dependencies** (affect value but don't block):

- Adjacency contributors: aqueduct provides +2 adjacency to adjacent Industrial Zone, but IZ functions without it
- Policy synergies: +100% campus adjacency card makes campuses more valuable, but isn't required
- Feature preservation: woods provide +1 appeal to adjacent tiles; chopping affects nearby appeal calculations
- Build order efficiency: completing a monument before settler means the settler benefits from the culture, but isn't required

The recommendations engine treats hard dependencies as constraints and soft dependencies as factors in optimization scoring.

## Core Features

### Tile Planner

The tile planner manages what each tile should be doing now, what it should become, and the transitions between.

**Tile entry:**

- User clicks on the visual hex grid to create a new tile
- A form appears with dropdowns for terrain, features, resources, and river edges
- Adjacent tiles auto-populate shared edges (river on east edge of tile A means river on west edge of tile B)

**Planning a tile's use:**
When the user selects a tile, the tool presents ranked options based on:

- Current game state (what's unlocked, what resources are available)
- Future potential (what becomes possible with planned techs/civics)
- Adjacency impact (how this choice affects neighboring tiles and planned districts)

For district placement, options are limited to the best 2-3 locations per district type within each city's workable range. Rankings account for:

- Current adjacency bonus
- Potential adjacency bonus (if planned improvements/districts are built)
- Opportunity cost (does this block a better use?)
- Soft dependencies (would building X first make this better?)

**State timeline:**
Each tile has a timeline of planned states:

- Current state: what's on the tile right now
- Planned states: ordered list of (trigger, target state) pairs

Example timeline for a plains-woods tile:
| Turn/Trigger | State | Rationale |
|--------------|-------|-----------|
| Now | Unimproved | Preserving woods for appeal |
| Apprenticeship | Lumber mill | Production while keeping woods |
| Turn 150 | Remove woods, place Industrial Zone | Final use, woods no longer needed |

Triggers can be:

- Immediate ("do this now")
- Tech/civic unlock ("at Apprenticeship")
- Turn number ("around turn 150")
- Game event ("when population reaches 10", "when aqueduct is built")

**Conflict detection:**
The tool actively detects and warns about conflicts:

- Two districts planned for the same tile
- Chopping a feature that another plan depends on for adjacency
- Planning an improvement that blocks a better future use
- Resource harvest that removes a luxury/strategic you may need

Warnings are loud and prominent. When a conflict is detected:

1. The conflicting plans are highlighted
2. The tool explains the conflict
3. Options to resolve are presented (change tile A's plan, change tile B's plan, accept the trade-off with acknowledgment)

The user must explicitly resolve or acknowledge conflicts before proceeding.

**Bulk operations:**
For efficiency, the tool supports bulk actions:

- "Mark all rainforest tiles in City X for chop"
- "Plan farms on all unassigned flatland tiles"
- "Set all coastal tiles to fishing boats when Celestial Navigation unlocks"

Bulk operations still run through conflict detection — if any tile in the batch has a conflict, the tool surfaces it before applying.

### Build Queue

The build queue manages what each city is producing and suggests optimal ordering based on current needs and long-term plans.

**Global view:**
All city queues are visible in a single view, organized as columns (one per city) or rows. This allows:

- Quick comparison of what each city is working on
- Easy drag-and-drop to reassign builds between cities
- At-a-glance view of empire-wide production priorities

**Queue contents:**
Each city's queue contains ordered items, which can be:

- Districts
- Buildings (within districts)
- Wonders
- Units (military, civilian, religious)
- Projects (campus research grants, city-state envoy projects, carbon recapture, etc.)

**User control with suggestions:**
The user owns the queue order. The tool suggests optimizations but doesn't auto-sort. Suggestions appear as:

- "Consider moving X above Y because..."
- "City A would complete this faster than City B"
- "This wonder is at risk — another civ may beat you"

Suggestions can be accepted (one click to apply) or dismissed.

**Priority factors:**
The tool evaluates queue ordering based on:

_Victory path alignment:_

- Science victory: prioritize campuses, libraries, research labs, spaceport projects
- Culture victory: prioritize theater squares, wonders with tourism, national parks setup
- Domination: prioritize encampments, unit production, strategic resource improvements
- Religious: prioritize holy sites, faith buildings, missionaries/apostles

_Immediate deficits:_

- Low amenities → suggest entertainment complex or water park
- Housing cap approaching → suggest aqueduct, neighborhood, or granary
- No production → suggest industrial zone or trade route capacity

_Synergy timing:_

- Builder before growth (to improve tiles new citizens will work)
- Settler before builder (if expansion is higher priority than improvement)
- Trader when commercial hub completes (to use the trade route slot)

_Wonder races:_

- If a wonder is planned and another civ might contest it, flag urgency
- Suggest production boosts (chop, policy swap, Liang governor)

_Threat response:_

- Hostile neighbor → walls, encampment, military units
- War declared → emergency military production, shift other cities to support

_Soft dependency timing:_

- "Build aqueduct before industrial zone for +2 adjacency"
- "Complete theater square before finishing the art museum for theming"

**Cross-city coordination:**
When multiple cities could build the same thing, the tool recommends which city should take it:

- "City B has better campus adjacency — build it there instead"
- "City A has higher production — assign the wonder here to finish faster"
- "City C already has a theater square — build the amphitheater there for culture"

**Relationship to other planners:**

- Tile Planner: district placements in the build queue reference planned tile assignments
- Research/Civic Queue: some builds are gated by tech/civic; the tool warns if you're queuing something you can't build yet
- Policy Planner: suggests policy swaps to boost current production priorities

### Research & Civic Queue

Two separate linear queues—one for technologies, one for civics—each reactive to game state changes.

**Research Queue (Technologies):**

_Structure:_

- Linear ordered list of techs to research
- Current tech highlighted with progress indicator (turns remaining, science per turn)
- Upcoming techs shown with estimated completion turns

_Eureka tracking:_
The tool tracks Eureka progress and factors it into ordering:

- Shows Eureka requirements for each tech ("build 2 galleys: 1/2 complete")
- If a Eureka is close (1-2 actions away), suggests delaying that tech until Eureka is earned
- Recalculates queue when Eurekas are marked complete
- Warns if you're about to research past an easy Eureka ("you're 1 mine from the Apprenticeship Eureka")

_Beeline vs breadth suggestions:_
The tool suggests ordering based on current circumstances:

- **Beeline** when: a key unlock is urgent (need walls, neighbor is aggressive), wonder race requires specific tech, victory path demands it
- **Breadth** when: cheap techs available that unlock Eurekas for expensive techs, era score needed to avoid dark age, multiple small unlocks have compounding value

Suggestions explain the reasoning: "Consider researching Sailing first—it's 4 turns and unlocks the Celestial Navigation Eureka (build 2 galleys), saving 7 turns on that tech later."

_Reactive reordering:_
When game state changes, the tool re-evaluates and suggests adjustments:

- New city settled near horses → "Consider adding Horseback Riding"
- Eureka earned → recalculate if delaying that tech is still worth it
- Threat level increased → prioritize military techs
- New strategic resource revealed → suggest tech to reveal/improve it

**Civic Queue:**

_Structure:_

- Linear ordered list of civics
- Current civic with progress indicator
- Policy unlock preview (shows which policies become available at each civic)

_Inspiration tracking:_
Same as Eureka tracking for techs:

- Shows Inspiration requirements
- Factors proximity into ordering
- Warns before researching past easy Inspirations

_Policy timing awareness:_
The tool understands that policy swaps happen (for free) when any civic completes:

- Shows "policy swap opportunity" markers in the queue
- If a valuable policy is unlocked mid-queue, suggests ordering to reach it when you need the swap
- Warns if your current policies are suboptimal and the next civic completion is far away ("you're running Conscription but not building military—consider if it's worth gold to swap")

Example: You want Rationalism (+100% campus adjacency) and your campuses are about to come online. The tool suggests ordering civics so a civic completes around the time you want to swap, minimizing dead turns with suboptimal policies.

_Government timing:_
When new governments unlock, the tool factors in:

- Legacy bonus accumulation (switching governments resets progress)
- Slot configuration changes (more wildcards, more military slots)
- Whether to delay a government switch to complete a legacy bonus tier

**Split view display:**
Research and civic queues are displayed side by side but managed independently. Cross-references are shown:

- "This civic unlocks the policy that boosts your queued campus builds"
- "This tech enables the district planned for tile (3, -1)"

Both queues update reactively when the user enters game state changes.

### Policy Planner

The policy planner recommends optimal policy loadouts based on current game state and suggests when to swap.

**Current recommended loadout:**
The tool maintains a "recommended loadout" that updates as the game progresses:

- Shows current slotted policies vs recommended policies
- Highlights mismatches with explanations ("you're running Urban Planning but all cities have monuments—consider swapping")
- Updates when game state changes (new district built, war declared, wonder started)

**Per-slot rankings:**
For each slot type (military, economic, diplomatic, wildcard), the tool ranks available policies:

_Military slots:_

- Ranks based on: active wars, unit production in queue, threat level, victory path
- Example: "1. Conscription (3 units in production), 2. Limes (walls queued in 2 cities)"

_Economic slots:_

- Ranks based on: current builds, district adjacencies, tile improvements in progress
- Example: "1. Rationalism (+100% campus adjacency, you have 4 campuses), 2. Natural Philosophy (still building campuses)"

_Diplomatic slots:_

- Ranks based on: city-state relations, diplomatic victory progress, alliance levels
- Example: "1. Charismatic Leader (3 city-states close to next envoy threshold)"

_Wildcard slots:_

- Evaluates the best policy across all types based on current priorities
- Suggests which category would benefit most: "Your wildcard is best used for an economic policy right now—Rationalism is higher value than any available military card"

**Government considerations:**
When ranking policies, the tool also evaluates government changes:

- "Switching to Merchant Republic would give you 2 more economic slots—worth considering given your campus-heavy build"
- "You'd gain more from Democracy's policy slots than staying in Theocracy, but you'd lose the legacy bonus progress"
- Shows trade-off analysis: slots gained/lost, legacy bonus impact, inherent government bonuses

**Temporary vs long-term policies:**
Policies are tagged as situational or core:

_Core policies:_ long-term value, should stay slotted most of the time

- Example: Rationalism when you have 4+ campuses, Professional Army when maintaining a standing military

_Situational policies:_ swap in temporarily for specific activities

- Example: Corvée when building multiple wonders, Veterancy when producing key units, Limes when walls are queued

The tool distinguishes these in recommendations:

- "Slot Corvée temporarily—you have Petra and Colosseum queued. Swap back to Town Charters when complete."
- "Wars of Religion is situational—only valuable during active religious combat"

**Swap timing:**
Since free swaps only happen at civic completion:

- Tool shows turns until next civic completes
- Warns if a valuable swap is needed but no civic is close ("you're starting Big Ben but no civic completes for 15 turns—Corvée swap would cost 200 gold")
- Suggests civic ordering to align swap opportunities with build plans

When a civic completes, the tool prompts:

- "Civic complete—policy swap available. Recommended changes: [list]. Accept / Modify / Skip"

**Dark age policies (optional):**
When dramatic ages mode is enabled:

- Dark age policy cards are included in rankings during dark ages
- Some are very powerful (Isolationism, Inquisition)—tool factors these into era transition planning
- "Entering a dark age would unlock Isolationism, which synergizes with your tall playstyle"

This feature is off by default and enabled in game setup options.

### Multi-City Coordination

Multi-city coordination manages how cities work together toward empire-wide goals, including specialization, trade routes, resource allocation, and governor assignments.

**City specialization:**
The tool suggests specializations based on tile potential, adjacency opportunities, and current infrastructure:

- "City A has +5 campus adjacency potential—recommend as science city"
- "City B has high production tiles and an aqueduct spot next to industrial zone—recommend as production hub"

Specializations are fluid, not locked:

- The tool re-evaluates as the game progresses
- A city's suggested role can change if circumstances shift (new tiles acquired, different district built, enemy pressure)
- User can override suggestions or mark a city as "locked" to a role if desired

Specialization informs other planners:

- Build queue prioritizes role-aligned districts and buildings
- Tile planner favors improvements that support the specialty
- Policy planner considers which cities benefit most from which policies

**Trade route optimization:**
The tool suggests trade route assignments based on current needs:

_Internal routes:_

- Production transfer: "Route from City B to City A—City A is building a wonder and needs production"
- Food transfer: "Route to City C to accelerate population growth for next district"

_External routes:_

- Gold optimization: "Route to city-state X yields +8 gold, highest available"
- Diplomatic: "Route to ally for alliance points"
- Strategic: "Route to civ Y for access to their luxury resources"

Suggestions update as priorities shift:

- Wonder started → internal production routes recommended
- War imminent → recall external routes to hostile civs
- Gold shortage → prioritize external gold routes

**Resource allocation:**
When multiple cities compete for the same strategic resource:

- Tool flags the conflict: "Both City A (Knight) and City B (Crossbowman) require iron. You have 4 iron, enough for one."
- User makes the call—tool doesn't auto-assign
- After user decides, the other item is flagged as "blocked pending resource"

The tool tracks:

- Current stockpiles
- Committed resources (queued items that will consume them)
- Projected income (improvements that will provide more)

**Governor assignments:**
The tool suggests governor placements and promotions:

_Placement suggestions:_

- Magnus in production city ("Vertical Integration bonus applies to your highest-production city")
- Pingala in science/culture city ("Grants bonus applies to your +5 adjacency campus")
- Liang in new cities or wonder cities ("builder charge bonus, wonder production boost")
- Victor in border cities or during war ("garrison bonus, loyalty pressure")

_Promotion suggestions:_

- Based on city role and current needs
- "Promote Magnus to Provision—City A is building settlers and can avoid population loss"
- "Promote Pingala to Researcher—your science victory push benefits from +15% science"

_Reassignment prompts:_

- When city roles shift: "City B is now your primary production city—consider moving Magnus"
- When threats emerge: "War declared—consider Victor in border city"
- When projects complete: "Wonder finished—Liang's bonus no longer needed here"

**Cross-city build coordination:**
Beyond the build queue's per-city suggestions, coordination handles:

- District distribution: "You have 6 cities but only 2 entertainment complexes—amenity coverage is thin"
- Wonder assignment: "Assign Ruhr Valley to City B—it has highest production and adjacent industrial zone"
- Project timing: "Start Campus Research Grants in all science cities simultaneously for era score"

### Expansion Planner

The expansion planner manages empire growth—where to settle, when to settle, and which city produces settlers.

**Settle location suggestions:**
The tool analyzes the map and suggests optimal settle locations:

_Evaluation criteria:_

- Tile yields: high-value tiles in workable range
- Fresh water: access to river, lake, or oasis for housing
- Adjacency potential: spots for +3 or better districts
- Strategic resources: access to horses, iron, niter, coal, oil, uranium, aluminum
- Luxury resources: new amenities not yet available
- Coastal access: harbors, naval units, water-based wonders
- Defensive terrain: hills, chokepoints, natural barriers

_Ranking output:_
Top 3-5 settle locations shown with explanations:

- "Location A: River, +4 campus spot, 2 luxuries, blocks Aztec expansion"
- "Location B: Coastal, strong harbor adjacency, access to oil"
- "Location C: High production tiles, mountain for observatory"

_Map visualization:_
Suggested locations highlighted on the hex grid with yield previews.

**Expansion pace guidance:**
The tool provides targets based on victory type and game speed:

_Victory-based targets:_

- Science: "Aim for 8-10 cities by turn 100—need campus and industrial zone coverage"
- Culture: "6-8 cities typically sufficient—focus on quality over quantity for tourism"
- Domination: "Expand aggressively early, capture cities mid-game—15+ cities common"
- Religious: "Wide empire helps—more holy sites, more faith, more missionaries"

_Current pace feedback:_

- "You have 4 cities at turn 65—on track for science victory"
- "You have 3 cities at turn 80—behind pace, consider prioritizing settlers"
- "Expansion opportunities closing—AI civs claiming remaining land"

**Forward settling / blocking:**
The tool factors in AI denial:

- Identifies chokepoints and contested regions
- Suggests forward settles to block aggressive civs: "Settling here denies Montezuma 5 tiles and his only nearby iron"
- Warns when AI is about to claim valuable land: "Rome's settler is heading toward the +5 campus spot—settle first or lose it"
- Evaluates loyalty pressure: "This location is forward but within your loyalty range—safe to settle"

**City spacing warnings:**
When a proposed location overlaps significantly with an existing city:

- Warning shown: "Location A shares 8 workable tiles with City B"
- Overlap tiles highlighted on map
- User can acknowledge and proceed with justification, or choose a different location

Acceptable overlap scenarios (tool recognizes these):

- Strategic denial more valuable than optimal yields
- Specific high-value tile worth sharing
- Coastal access or resource access justifies overlap

**Settler production integration:**
When a settle location is confirmed, the tool suggests which city builds the settler:

_Priority order:_

1. City with Magnus (Provision promotion)—no population loss
2. Highest production city without critical builds queued
3. City with Ancestral Hall (50% settler production if Government Plaza present)

Suggestion format:

- "Build settler in City A—Magnus with Provision assigned, 6 turns to complete"
- "Alternative: City B has higher production (4 turns) but will lose population"

If no city has Magnus with Provision:

- Tool notes this: "Consider promoting Magnus to Provision before building settlers"
- Still suggests best production city as fallback

**Expansion queue:**
A dedicated list of planned settlements:

- Ordered by priority
- Each entry: location coordinates, target turn, assigned settler-producing city, status (planned/in production/settler en route/settled)
- Integrates with build queue—settler appears in the producing city's queue

## Recommendations Engine

The recommendations engine is the intelligence layer that evaluates options, ranks them, and provides suggestions across all planners. It balances optimality with stability to support long-term planning.

### Core Principles

**Stability over perfection:**
The engine resists drastic changes to existing plans. A new recommendation must be _significantly_ better to override an existing plan—not just marginally better.

- Threshold: a change is suggested only if the improvement exceeds a configurable margin (default: 15-20% better)
- Existing plans have "weight"—the longer a plan has been in place, the higher the threshold to change it
- User can adjust sensitivity: "stable" (high threshold, rarely suggests changes) to "adaptive" (lower threshold, more reactive)

This prevents: "Move your campus" → next turn "Actually move it back" → next turn "No wait, the first spot"

**Victory path weighting:**
Recommendations skew toward the selected victory type but don't ignore fundamentals:

- Victory-aligned actions get a multiplier (e.g., 1.3x weight for science buildings when pursuing science victory)
- Fundamentals always matter: military defense, amenities, housing, production capacity
- Threat detection overrides victory focus: if an enemy is massing troops, military recommendations rise regardless of victory path

Weighting is tunable:

- "Focused" — heavy skew toward victory path
- "Balanced" — moderate skew, more attention to fundamentals
- "Flexible" — light skew, nearly equal weighting

**Civ-specific logic:**
The engine has hardcoded knowledge of each civ's unique abilities:

- Brazil: rainforest provides +1 adjacency to holy sites, campuses, commercial hubs, theater squares. Rainforest tiles valued higher; chop recommendations suppressed.
- Russia: tundra provides +1 faith and +1 production. Tundra settles viable; tiles valued differently.
- Japan: +1 adjacency for districts adjacent to other districts. District clustering recommended.
- Australia: +3 housing in coastal cities, appeal bonuses. Coastal and high-appeal settles prioritized.
- Etc.

This affects all planners: tile valuation, settle locations, district placement, build priorities.

### Confidence Levels

Each recommendation includes a confidence indicator:

**High confidence:**

- Clear best option with significant margin
- Example: "Campus at (3, -1): +5 adjacency. Next best option is +2."

**Medium confidence:**

- Best option but alternatives are competitive
- Example: "Campus at (3, -1) is slightly better than (4, 0). Both are good choices."

**Low confidence / trade-off:**

- No clear winner; depends on priorities
- Example: "Campus at (3, -1) gives +4 adjacency but blocks a +3 industrial zone. (4, 0) gives +3 campus but preserves IZ spot. Depends on whether you value science or production more."

Confidence level is shown visually (color, icon, or label) alongside each recommendation.

### Explanation Depth

User-configurable verbosity:

**Terse mode:**

- "Campus: (3, -1), +5 adjacency"
- "Research Apprenticeship next (Eureka ready)"
- "Swap to Rationalism at next civic"

**Detailed mode:**

- "Campus at (3, -1) provides +5 adjacency from 2 mountains (+2) and geothermal fissure (+2) plus one rainforest (+1 from Brazil bonus). Alternative at (4, 0) gives +3 but preserves the woods tile for a potential national park. Given your science victory focus, the +5 spot is recommended despite the appeal trade-off."

User can toggle between modes or set per-planner (e.g., detailed for tile planning, terse for research queue).

### Change Summaries

When the tool re-evaluates after a game state update, it provides a "what changed" summary:

**Format:**

```
Game state updated: Eureka earned (Apprenticeship)

Changes:
- Research Queue: Apprenticeship moved from #4 to #2 (Eureka reduces cost by 50%)
- Build Queue (City A): Industrial Zone priority increased (Apprenticeship unlocks)
- No changes to Tile Planner (existing plans still optimal)
- No changes to Policy Planner
```

**Change classification:**

- _Minor adjustment:_ reordering within a queue, small priority shifts
- _Significant change:_ new item added, recommendation reversal (shown with explanation of why threshold was exceeded)
- _Alert:_ external threat detected, time-sensitive opportunity

User can configure notification level:

- "All changes" — see everything
- "Significant only" — hide minor adjustments
- "Alerts only" — only urgent notifications

### Evaluation Factors

The engine weighs multiple factors when scoring options:

**Immediate value:**

- Direct yields, adjacency bonuses, unlocks
- Production cost vs benefit

**Future value:**

- Potential adjacency when other plans complete
- Synergy with planned techs/civics/policies
- Long-term yield curves (e.g., seaside resorts become valuable late)

**Opportunity cost:**

- What does choosing this option prevent?
- Does this tile block a better future use?
- Does this district slot prevent a more valuable district?

**Timing:**

- Is this urgent (wonder race, military threat)?
- Would waiting unlock a better option (tech about to complete)?
- Does this align with policy swap windows?

**Soft dependencies:**

- Would completing X first make this better?
- How much value is lost by doing this out of order?

### Re-evaluation Triggers

The engine re-evaluates when the user updates game state:

- New tile discovered or explored
- City founded or captured
- District/building/wonder completed
- Tech or civic completed
- Eureka or inspiration earned
- War declared or peace made
- Threat level changed
- Resource discovered or depleted
- Turn advanced

Re-evaluation is _not_ automatic for every small change. The user explicitly updates state (e.g., "mark turn complete" or "add explored tiles"), and the engine re-evaluates in batch.

### Stability Mechanisms

To prevent recommendation churn:

**Hysteresis:**
Once an option is recommended, it stays recommended until an alternative exceeds it by a meaningful margin—not just edges it out.

**Plan commitment:**
When the user accepts a recommendation, it becomes a "committed plan." Committed plans have extra weight; the engine won't suggest changing them unless the improvement is substantial.

**Lock option:**
User can explicitly lock any plan: "I've decided this, don't suggest changes." Locked plans are excluded from re-evaluation.

**Change budgets:**
The engine limits how many significant changes it suggests per re-evaluation cycle. If many things shifted, it prioritizes the most impactful changes and batches the rest as "minor adjustments you may want to review."

## UI Concepts

The interface is map-centric with supporting panels for queues, recommendations, and notifications. Designed for updating every few turns during active play.

### Primary Layout

**Main view: Full-screen hex map**

- Zoom and pan controls (scroll wheel, drag, or buttons)
- Hex grid overlaid on the map area
- Click to select tiles, right-click for context menu
- Cities shown as distinct markers with names

**Collapsible panels:**

- _Left panel:_ Tile/city inspector (details of selected element)
- _Right panel:_ Queues (research, civic, build)
- _Bottom panel:_ Timeline view (tile state transitions, build completion estimates)
- _Notifications sidebar:_ Recommendations, alerts, "what changed" summaries

Panels can be collapsed to maximize map space. Keyboard shortcuts toggle panels.

### Map Overlays

Toggle-able overlay layers to visualize different information:

**Tile state overlay:**

- Color-coded by current state (unimproved, improved, district, wonder)
- Icons for planned improvements/districts
- Hatching or border style for "interim state" vs "final state"

**Adjacency overlay:**

- Shows adjacency bonuses for a selected district type
- Heat map: brighter = higher adjacency
- Hover shows breakdown (+2 from mountains, +1 from geothermal)

**Ownership overlay:**

- Player cities and their workable ranges
- AI civ claimed tiles (different colors per civ)
- Contested/unclaimed regions highlighted

**Appeal overlay:**

- Heat map of appeal values
- Useful for national park planning, seaside resorts, neighborhoods

**Resource overlay:**

- Strategic, luxury, bonus resources highlighted
- Revealed vs unrevealed indicated
- Planned harvests marked

**Danger overlay:**

- AI civ borders and expansion direction
- Military threat indicators
- Contested settle locations

Overlays can be combined (e.g., adjacency + ownership) or shown solo.

### Tile Interaction

**Adding new tiles:**

1. Click empty hex on map
2. Dropdown form appears: terrain, feature, resource, river edges
3. Save → tile added to map with default "unplanned" state

**Planning a tile:**

1. Select existing tile
2. Left panel shows current state and attributes
3. "Plan" button opens planning interface:
   - Ranked options shown (top 2-3 for districts, more for improvements)
   - Select target state(s)
   - Set trigger (immediate, tech unlock, turn number)
   - Add rationale (optional note)
4. Timeline updates with planned transitions

**Bulk operations:**

1. Shift+click or drag-select multiple tiles
2. Context menu: "Apply to all selected"
3. Choose action (mark for chop, plan farms, etc.)
4. Conflict check runs; flagged tiles shown for review

### Queue Panels

**Research queue (right panel, tab 1):**

- Linear list of techs
- Current tech at top with progress bar
- Drag to reorder
- Click to see Eureka status and unlock details
- Suggestions highlighted with "recommended" badge

**Civic queue (right panel, tab 2):**

- Same structure as research
- Policy unlock icons shown inline
- "Policy swap opportunity" markers between civics

**Build queues (right panel, tab 3):**

- Global view: all cities as columns
- Each city shows ordered build list
- Drag items within a city to reorder
- Drag between cities to reassign
- Color coding by type (district, building, unit, wonder, project)

**Policy loadout (right panel, tab 4):**

- Current government and slot layout
- Slotted policies with "optimal?" indicator
- Click slot to see ranked alternatives
- "Suggested loadout" button to see full recommendation

### Notifications Sidebar

**Structure:**

- Collapsible panel on right edge (or floating)
- Sections: Alerts, Recommendations, Recent Changes

**Alerts (urgent):**

- Wonder race warnings
- Military threats
- Expiring opportunities ("Settler approaching your planned spot")
- Resource conflicts

**Recommendations:**

- New suggestions from the engine
- Grouped by planner (tile, build, research, policy)
- One-click accept or dismiss
- Expand for explanation (terse/detailed based on setting)

**Recent changes:**

- "What changed" summaries after re-evaluation
- Filterable by significance level
- Click to jump to affected element (tile, queue item)

**Notification preferences:**

- Badge count when collapsed
- Optional sound/visual flash for alerts
- Configurable verbosity

### Data Entry Flow

Designed for "every few turns" updates:

**Quick update mode:**

1. Open app after a few turns of play
2. Notification sidebar shows: "Last updated: Turn 45. Current turn?"
3. Enter current turn
4. Quick prompts: "Any new tiles explored?" → click to add on map
5. "Any builds completed?" → checklist of items due around this turn
6. "Any techs/civics completed?" → one-click completion
7. "Any eurekas/inspirations earned?" → checklist
8. Engine re-evaluates; changes shown in sidebar

**Full update mode:**
For larger updates (played many turns, lots changed):

- "Bulk update" wizard walks through each category
- Map editing mode for adding many tiles
- Queue sync for verifying current production matches plan

**Turn tracking:**

- App tracks "last known turn"
- Estimated completion turns shown for all queued items
- Alerts if you're past an estimated completion ("Did the campus in City A finish?")

### Inspector Panel (Left)

When a tile is selected:

- Coordinates and terrain info
- Current state (improvement, district, yield)
- Planned states (timeline)
- Adjacency contributions (what this tile provides to neighbors)
- "Edit plan" and "Lock plan" buttons

When a city is selected:

- City stats (population, housing, amenities, yields)
- Owned and worked tiles (highlighted on map)
- Current production and queue
- Districts built and planned
- Specialty designation
- Governor assignment
- "Jump to build queue" button

### Game Setup

On first launch / new game:

1. Select civ and leader
2. Select victory type (can change later)
3. Select game speed (affects turn estimates)
4. Select enabled DLC/modes (Gathering Storm, Rise and Fall, dramatic ages, heroes, secret societies)
5. Enter starting location tiles
6. App initializes with civ-specific bonuses loaded

### Settings

- Explanation verbosity (terse / detailed)
- Recommendation stability (stable / balanced / adaptive)
- Victory focus (focused / balanced / flexible)
- Notification level (all / significant / alerts only)
- Overlay defaults
- Keyboard shortcut customization

## Open Questions

### Resolved

**Data & Modeling:**

- **Civ 6 data source:** Wiki-based information (community-maintained sources like Civilopedia exports)
- **Adjacency with partial maps:** Assume worst case for unknown adjacent tiles
- **Turn timing estimates:** Reasonable precision required (not just rough estimates)
- **Great people modeling:** Out of scope — too speculative given incomplete information about AI civ progress

**Recommendations Engine:**

- **Threat assessment heuristics:** Based on unit build-up near borders, leader agenda, diplomatic status, and past actions
- **Wonder race detection:** Some competition will be unknown; user can report hints about competing civs when the game reveals them
- **Civ ability coverage:** Start with most popular civs, add others over time

**User Experience:**

- **Learning curve:** Not a concern (personal tool)
- **Data loss risk:** Auto-save every 10 minutes, maintain 3 rolling auto-save slots
- **Map entry burden:** Support base tile painting for bulk terrain entry (drag to paint grassland, plains, etc.)

**Technical:**

- **Performance targets:** Re-evaluation should complete within 3 seconds, even for large maps with 20+ cities in late game

**Scope Boundaries:**

- **DLC/mode interactions:** Limit supported combinations; baseline (no optional modes) first, then add tested configurations
- **Edge cases:** Gradual degradation with replan prompts; tiles can return to previous states (especially after war ends and territory is reclaimed)
- **AI civ intelligence:** Encode known leader agendas plus user-reported observations

**Future-Proofing:**

- **Civ 7 compatibility:** Not a consideration; this is a Civ 6-specific tool
- **Extensibility:** No mod support planned

### Still Open

**Recommendations Engine:**

1. **Stability threshold tuning:** What's the right default threshold for "significantly better"? Needs playtesting.

**Technical:** 2. **Tech stack decision:** Desktop app could be built with:

- Electron + React (easy, cross-platform, larger bundle)
- Tauri + React/Svelte (smaller, faster, Rust backend)
- Native (Qt, SwiftUI/AppKit, WPF) (best performance, more platform-specific work)
- Godot or other game engine (good for hex grids, unusual for a planning tool)

3. **Data persistence:** What format? SQLite? JSON file? How do we handle schema changes between versions?
