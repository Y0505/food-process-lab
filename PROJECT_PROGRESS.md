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

**Phase:** 2 — Process Engine Vertical Slice

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

### In Progress

- Local verification of the complete sugarcane multi-stream process.
- Review of the simplified educational assumptions before connecting the process state to the 3D visualization.

### Not Yet Implemented

- Complete engineering parameter dataset.
- Equipment-specific original visual representations.
- Internal/cutaway inspection.
- Simulation timeline.
- Engineering validation beyond domain-level checks.
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
- [x] Original primitive equipment representations
- [x] Connect equipment to process data
- [ ] Equipment selection
- [ ] Material-flow visualization
- [ ] Parameter display
- [ ] Simulation state visualization

### Inspection

- [ ] Identify equipment requiring internal visibility
- [ ] Original internal representations
- [ ] Cutaway/inspection interaction
- [ ] Educational component highlighting

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

For important engineering parameters, record parameter name, value/range, unit, process context, assumptions, source, and date checked when useful.

If a reliable value is not yet established, mark it as unknown, configurable, or illustrative.

## Dependency Decision Log

| Dependency | Version | Purpose | License | Free? | Visible attribution required? | Decision |
|---|---|---|---|---|---|---|
| Next.js | 16.3.4 | Application framework | MIT | Yes | None identified in initial review | Approved |
| React | 19.2.8 | UI runtime | MIT | Yes | None identified in initial review | Approved |
| React DOM | 19.2.8 | Web renderer | MIT | Yes | None identified in initial review | Approved |
| Three.js | 0.186.0 | 3D rendering | MIT | Yes | None identified in initial review | Approved |
| TypeScript | 7.0.2 | Type system/compiler | Apache-2.0 | Yes | None identified in initial review | Approved |
| Vitest | 4.1.11 | Domain test runner | MIT | Yes | None identified in initial review | Approved |
| Vite | 6.4.1 | Vitest integration/build support | MIT | Yes | None identified in initial review | Approved |

Vitest is used only for development tests and does not affect user-facing application output. Vite is a development dependency used to support the Vitest setup; it is not the application's production bundler.

No additional dependency should be added without a corresponding license decision.

## Agent Handoff Protocol

### Before Editing

1. Read this file.
2. Inspect the current repository state.
3. Check whether the requested task is already complete.
4. Preserve existing architecture unless there is a documented reason to change it.
5. Make the smallest coherent change that advances the project.

### After Editing

1. Update the checklist.
2. Record important architecture decisions.
3. Record new dependencies and their license checks.
4. Record blockers and unresolved engineering questions.
5. Do not claim completion until the result has been checked.

## Current Next Task

**Verification gate:** pull the latest commits and run `npm test`. If the complete sugarcane multi-stream tests pass, the next slice is to connect the resulting process state to the existing Three.js equipment/flow visualization. If it fails, fix the domain issue before adding UI work.

## Change Log

### 2026-09-10

- Added multi-component material stream model and validation.
- Added explicitly illustrative sugarcane feed composition.
- Added multi-stream transformation contract and mass-balance helpers.
- Added Vitest and the first executable domain tests.
- Corrected the test setup to Vitest 4.1.11 + Vite 6.4.1 for the project's Node 20 environment.
- Added component-aware stream allocation with explicit per-component recovery inputs.
- Updated sugarcane extraction to use component recoveries and verify configured juice yield.
- Added a multi-stream process runner that validates each step's streams and records simulation history.
- Added runner tests for step-to-step stream propagation and missing transformations.
- Added end-to-end sugarcane multi-stream transformations for clarification, evaporation, crystallization state, centrifugation, and drying.
- Added complete-process tests and stage mass-balance checks.
