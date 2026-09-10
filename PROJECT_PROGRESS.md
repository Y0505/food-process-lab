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

**Phase:** 1 — Application Skeleton

### Completed

- Repository created: `Y0505/food-process-lab`
- English-first project direction established.
- Process-first concept established.
- Originality/copyright policy established.
- Dependency policy established.
- README added to the repository.
- Project coordination/progress file added.

### In Progress

- Minimal Next.js + TypeScript application foundation.
- Minimal Three.js integration.
- Initial process-domain types.

### Not Yet Implemented

- Complete sugarcane process model.
- Equipment visualization beyond the initial proof of architecture.
- Internal/cutaway inspection.
- Simulation timeline and deterministic execution.
- Engineering validation and balances.
- Production polish/deployment.

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

A conceptual process step should be able to describe its input stream, output stream, equipment, relevant parameters, and deterministic transformation without depending on Three.js.

## Development Checklist

### Foundation

- [x] README
- [x] Project progress / agent coordination
- [x] Dependency policy
- [ ] Application scaffold

### Process Engine

- [ ] Domain types
- [ ] Material state
- [ ] Process-step contract
- [ ] Deterministic transformation interface
- [ ] Validation contract
- [ ] Unit tests

### First Process

- [ ] Sugarcane input
- [ ] Preparation
- [ ] Size reduction / shredding
- [ ] Juice extraction
- [ ] Juice clarification
- [ ] Evaporation
- [ ] Crystallization
- [ ] Centrifugation
- [ ] Drying
- [ ] Sugar output

### Visualization

- [ ] Original 3D scene
- [ ] Original equipment primitives/models
- [ ] Connect equipment to process data
- [ ] Equipment selection
- [ ] Material-flow visualization
- [ ] Parameter display

### Inspection

- [ ] Identify equipment requiring internal visibility
- [ ] Original internal representations
- [ ] Cutaway/inspection interaction
- [ ] Educational component highlighting

### Simulation

- [ ] Simulation state
- [ ] Simulation clock/timeline
- [ ] Parameter input
- [ ] Deterministic execution
- [ ] Input/output reporting
- [ ] Balance validation

### Quality

- [ ] Unit/integration tests
- [ ] Accessibility review
- [ ] Responsive UI
- [ ] Performance review
- [ ] Documentation
- [ ] Deployment

## Research Policy

Technical research may be used to understand:

- food-processing terminology;
- process stages;
- engineering equations and relationships;
- standards and safety concepts;
- realistic parameter ranges.

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
| Next.js | TBD | Application framework | TBD | TBD | TBD | Pending verification |
| TypeScript | TBD | Type system/compiler | TBD | TBD | TBD | Pending verification |
| Three.js | TBD | 3D rendering | TBD | TBD | TBD | Pending verification |

No dependency should be added until its current license and attribution requirements have been checked.

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

Build the minimal application foundation and establish the process-domain types before creating detailed 3D assets. The first implementation must prove the architecture with a small vertical slice rather than attempting the entire factory at once.

## Change Log

### 2026-09-10

- Repository write access confirmed.
- Added initial README and project coordination document.
- Ready to begin implementation of the application foundation.
