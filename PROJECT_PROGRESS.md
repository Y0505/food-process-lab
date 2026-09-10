# FoodProcessLab — Project Progress

This file is the shared source of truth for project progress, architectural decisions, constraints, and agent handoffs.

## Non-Negotiable Rules

1. Build the project independently.
2. Do not copy source code from repositories, tutorials, demos, articles, or products.
3. Do not copy distinctive UI, visual design, 3D assets, textures, illustrations, or product-specific workflows.
4. General technical research is allowed for facts, terminology, equations, standards, and engineering understanding. Implementation must remain original.
5. No paid libraries or services for the core project.
6. Prefer zero/minimal dependencies.
7. Every dependency must be free and license-compatible.
8. No dependency may require visible attribution, branding, watermark, logo, or credit in the application's user-facing output.
9. Repository-level license and notice obligations must still be respected.
10. Do not invent engineering values. Important parameters must be traceable to a reliable source or explicitly labeled as configurable/illustrative.
11. Do not replace completed architecture without documenting the reason.
12. Do not modify another agent's active work unless necessary; if this happens, document why.

## Architectural Principle

**The 3D scene is a view of the process model, not the process model itself.**

Process logic must remain testable without a renderer.

## Current Status

**Phase:** 4 — Process visualization integration / immersive plant presentation / station inspection

### Completed

- Repository and documentation foundation.
- Next.js + TypeScript application foundation.
- Direct Three.js viewport.
- Initial process-domain contracts.
- Sugarcane-to-sugar process definition.
- Deterministic transformation and validation foundation.
- Multi-component material stream model.
- Material-stream composition validation.
- Explicitly illustrative sugarcane feed stream.
- Multi-stream transformation contract.
- Mass-balance helpers.
- Component-aware stream allocation primitive with explicit per-component recovery inputs.
- Sugarcane extraction with explicit component recovery assumptions.
- Multi-stream process runner foundation.
- Complete sugarcane multi-stream transformation registry covering all eight process stages.
- Stage-level mass-balance assertions for active split operations.
- End-to-end multi-stream process test covering cane through dried sugar.
- Fixed derived-stream moisture to use output water composition.
- Added an AI-oriented `AGENTS.md` handoff file.
- Added a pure visualization-model adapter that maps deterministic simulation state to process stages.
- Added tests for visualization-model mapping and stream-state exposure.
- Connected the deterministic visualization model to the Three.js viewport.
- Added animated material-flow markers whose speed is derived from simulated mass flow.
- Added active-stage highlighting and a live process-state overlay.
- Replaced uniform equipment boxes with original procedural equipment forms tailored to the eight process stages.
- Added procedural labels, industrial floor/grid, shadows, fog, lighting, particles, and tone mapping for a richer learning-oriented scene.
- Replaced deprecated `THREE.Clock` usage with `THREE.Timer`.
- Added denser procedural equipment detail: supports, flanges, valve wheels, stems, gauges, internal shafts, coils, transfer pipe runs, and stage-specific subassemblies.
- Added clickable equipment/stage selection from the viewport and stage strip.
- Added process-stage controls, process legend, and visible station parameters.
- Added differentiated animated material particles in process lanes.
- Added a complete production-line overview that presents all eight units as one connected factory path.
- Added an original equipment inspection experience with stage-specific internal procedural views and educational observation/output panels.
- Added an immersive factory-overview frame with industrial grid, ambient glow, live-model HUD, process metrics, and visual legend around the production line.

### In Progress

- Manual browser verification of the immersive plant presentation and station interaction.
- Improve equipment-specific material-flow behavior after visual review.
- Build true camera travel from the plant overview into selected equipment.
- Replace the current dedicated internal inspection transition with a more spatial cutaway experience where useful.
- Review simplified educational assumptions before presenting them as UI data.

### Not Yet Implemented

- True camera travel / focus transition through the plant.
- True cutaway interaction integrated with the main plant view.
- Complete engineering parameter dataset.
- Engineering validation beyond domain-level checks.
- Simulation timeline controls.
- Parameter editing.
- Production polish/deployment.

## Initial Process

`Sugarcane → Preparation → Size Reduction / Shredding → Juice Extraction → Juice Clarification → Evaporation → Crystallization → Centrifugation → Drying → Sugar`

## Domain Model Direction

Core concepts:

- `Process`
- `ProcessStep`
- `Equipment`
- `MaterialState`
- `MaterialStream`
- `MaterialComponent`
- `Parameter`
- `Transformation`
- `ProcessConnection`

Material streams support component composition so later stages can represent juice, fiber/bagasse, water, sucrose, and other components without making the renderer the source of truth.

## Development Checklist

### Foundation

- [x] README
- [x] Project progress / agent coordination
- [x] AI agent handoff guide
- [x] Dependency policy
- [x] Application scaffold

### Process Engine

- [x] Domain types
- [x] Material state
- [x] Material stream composition
- [x] Process-step contract
- [x] Deterministic transformation interface
- [x] Basic validation contract
- [x] Multi-stream transformation contract
- [x] Mass-balance validation helper
- [x] Unit tests with an approved test runner
- [x] Component-aware two-output allocation
- [x] Multi-stream process runner foundation
- [x] End-to-end sugarcane multi-stream execution

### First Process

- [x] Sugarcane process-stage skeleton
- [x] Illustrative sugarcane input stream
- [x] Preparation transformation — structural pass-through pending engineering parameterization
- [x] Size reduction / shredding transformation — structural pass-through pending engineering parameterization
- [x] Juice extraction transformation — component-aware educational slice
- [x] Juice clarification transformation — simplified suspended-solids split
- [x] Evaporation transformation — configurable water split
- [x] Crystallization transformation — temperature/state transition only; phase-specific model remains future work
- [x] Centrifugation transformation — explicit component recovery split
- [x] Drying transformation — target-moisture water removal
- [x] Sugar output stream

### Visualization

- [x] Original 3D scene
- [x] Original procedural equipment representations
- [x] Connect equipment to process data
- [x] Pure visualization-model adapter for simulation state
- [x] Animated material-flow markers
- [x] Active stage highlighting
- [x] Live process-state overlay
- [x] Procedural visual polish (lighting, shadows, grid, fog, particles, labels)
- [x] Dense stage-specific procedural equipment detail
- [x] Equipment/stage selection
- [x] Visible stage parameters
- [x] Process legend / interaction guidance
- [x] Complete production-line overview
- [x] Immersive factory presentation frame
- [ ] True camera focus/travel
- [ ] Equipment-specific flow visualization refinement
- [ ] Simulation state timeline visualization

### Inspection

- [x] Identify the eight process units for inspection
- [x] Original internal procedural representations
- [x] Dedicated equipment inspection interaction
- [ ] Cutaway integrated into main plant camera experience
- [ ] Educational component highlighting inside equipment

### Simulation

- [x] Deterministic execution foundation
- [x] Multi-stream simulation state foundation
- [ ] Simulation clock/timeline
- [ ] Parameter input
- [ ] Input/output reporting for multi-stream state
- [x] Mass balance validation helper
- [ ] Energy balance validation

### Quality

- [x] First domain-level test suite added
- [ ] Accessibility review
- [ ] Responsive UI
- [ ] Performance review
- [ ] Documentation
- [ ] Deployment

## Research Policy

Technical research may be used to understand food-processing terminology, process stages, engineering equations and relationships, standards, safety concepts, and realistic parameter ranges.

Research must not be used as a source for copying implementation, distinctive interface design, assets, or product-specific workflows.
