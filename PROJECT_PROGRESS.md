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

```text
UI
 ├── 3D Visualization
 │   ├── Scene
 │   ├── Equipment
 │   ├── Material Flow
 │   └── Interaction
 ├── Process Engine
 │   ├── Process Steps
 │   ├── Material State
 │   ├── Parameters
 │   ├── Transformations
 │   └── Validation
 └── Educational Data
     ├── Explanations
     ├── Equipment Information
     └── Technical References
```

## Current Status

**Phase:** 2 — Process Engine Vertical Slice

### Completed

- Repository created: `Y0505/food-process-lab`
- English-first project direction established.
- Process-first concept established.
- Originality/copyright policy established.
- Dependency policy established.
- README and project coordination file added.
- Next.js + TypeScript application foundation added.
- Direct Three.js viewport added without a 3D framework wrapper.
- Initial process-domain contracts added.
- Sugarcane-to-sugar process definition added.
- Process definition drives the initial visual equipment units.
- Deterministic material transformation primitives added.
- Material-state validation added.
- Deterministic process runner added.
- Sugarcane transformation registry added.
- A simulation API endpoint now executes the complete process path.
- No extra test runner dependency was introduced merely for tests; a temporary Vitest test was removed because Vitest is not installed.

### In Progress

- Replace illustrative transformation values with researched, explicitly sourced engineering parameters.
- Improve material composition/state representation so mass is not incorrectly treated as a single homogeneous stream.
- Connect simulation results to the 3D experience.

### Not Yet Implemented

- Complete engineering parameter dataset.
- Equipment-specific original visual representations.
- Equipment selection and parameter panels.
- Internal/cutaway inspection.
- Simulation timeline and user-controlled parameters.
- Rigorous mass/energy balances.
- Production polish/deployment.

## Important Modeling Note

The current transformations are intentionally educational placeholders. They demonstrate the architecture and deterministic execution path; their illustrative percentages must not be interpreted as plant design values or validated process yields.

In particular, the current runner preserves a single `materialId` and applies simplified flow changes. A future material model must represent multiple streams/components before claiming engineering-grade mass balance behavior.

## Initial Process

`Sugarcane → Preparation → Size Reduction / Shredding → Juice Extraction → Juice Clarification → Evaporation → Crystallization → Centrifugation → Drying → Sugar`

The first implementation should not attempt to model every machine component. Detail is added only when it improves understanding of the process.

## Domain Model Direction

Core concepts:

- `Process`
- `ProcessStep`
- `Equipment`
- `MaterialState`
- `Parameter`
- `Transformation`
- `ProcessConnection`

A process step must be able to describe its input stream, output stream, equipment, relevant parameters, and deterministic transformation without depending on Three.js.

## Development Checklist

### Foundation

- [x] README
- [x] Project progress / agent coordination
- [x] Dependency policy
- [x] Application scaffold

### Process Engine

- [x] Domain types
- [x] Material state
- [x] Process-step contract
- [x] Deterministic transformation interface
- [x] Validation contract
- [ ] Unit tests with an approved test runner
- [x] Deterministic process runner

### First Process

- [x] Sugarcane process-stage skeleton
- [x] Initial sugarcane input state
- [x] Preparation transformation contract
- [x] Size reduction / shredding transformation
- [x] Juice extraction transformation
- [x] Juice clarification transformation
- [x] Evaporation transformation
- [x] Crystallization transformation
- [x] Centrifugation transformation
- [x] Drying transformation
- [ ] Engineering-grade sugar output calculation

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

- [x] Deterministic execution
- [ ] Simulation state model beyond a single stream
- [ ] Simulation clock/timeline
- [ ] Parameter input
- [x] Input/output reporting endpoint
- [ ] Mass balance validation
- [ ] Energy balance validation

### Quality

- [ ] Unit/integration tests
- [ ] Accessibility review
- [ ] Responsive UI
- [ ] Performance review
- [ ] Documentation
- [ ] Deployment

## Research Policy

Technical research may be used to understand food-processing terminology, process stages, engineering equations and relationships, standards, safety concepts, and realistic parameter ranges.

Research must not be used as a source for copying implementation, distinctive interface design, assets, or product-specific workflows.

For important engineering parameters, record:

- parameter name;
- value or range;
- unit;
- process context;
- assumptions;
- source;
- date checked when useful.

If a reliable value is not yet established, mark it as unknown, configurable, or illustrative.

## Dependency Decision Log

| Dependency | Version | Purpose | License | Free? | Visible attribution required? | Decision |
|---|---|---|---|---|---|---|
| Next.js | 16.3.4 | Application framework | MIT | Yes | None identified in initial review | Approved |
| React | 19.2.8 | UI runtime | MIT | Yes | None identified in initial review | Approved |
| React DOM | 19.2.8 | Web renderer | MIT | Yes | None identified in initial review | Approved |
| Three.js | 0.186.0 | 3D rendering | MIT | Yes | None identified in initial review | Approved |
| TypeScript | 7.0.2 | Type system/compiler | Apache-2.0 | Yes | None identified in initial review | Approved |

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
5. Verify the result before claiming completion.

## Current Next Task

Research and formalize the material-state model before adding more process realism. The next model should distinguish at least the major conceptual streams/components needed for sugarcane extraction and concentration, while keeping the simulation deterministic and independently testable.

## Change Log

### 2026-09-10

- Confirmed repository write access.
- Added and verified foundation documentation.
- Added executable deterministic transformations.
- Added material-state validation.
- Added deterministic process runner.
- Added sugarcane transformation registry.
- Added a simulation API endpoint.
- Removed a temporary test file rather than introducing an unapproved test dependency.
- Updated project status to Phase 2.
