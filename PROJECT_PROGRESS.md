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

**Phase:** 1 — Application Skeleton / Process Vertical Slice

### Completed

- Repository created: `Y0505/food-process-lab`
- English-first project direction established.
- Process-first concept established.
- Originality/copyright policy established.
- Dependency policy established.
- README added.
- Project coordination/progress file added.
- Next.js application shell added.
- TypeScript configuration added.
- Three.js viewport added without a 3D framework wrapper.
- Initial process-domain contracts added.
- Initial sugarcane-to-sugar process definition added.
- Process definition is used as the source for the initial 3D equipment units.
- Core dependencies were license-reviewed: Next.js MIT, React MIT, Three.js MIT, TypeScript Apache-2.0. No visible attribution requirement was identified for normal application use in this initial review.

### In Progress

- Strengthening the process-domain model.
- Making material transformations executable and testable.
- Replacing placeholder visual units with process-specific original equipment representations.

### Not Yet Implemented

- Complete engineering parameter dataset.
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
- [ ] Validation contract
- [ ] Unit tests

### First Process

- [ ] Sugarcane input
- [x] Process-stage skeleton
- [ ] Preparation transformation
- [ ] Size reduction / shredding transformation
- [ ] Juice extraction transformation
- [ ] Juice clarification transformation
- [ ] Evaporation transformation
- [ ] Crystallization transformation
- [ ] Centrifugation transformation
- [ ] Drying transformation
- [ ] Sugar output

### Visualization

- [x] Original 3D scene
- [x] Original primitive equipment representations
- [x] Connect equipment to process data
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

Implement executable material transformations and validation for the first vertical slice, beginning with a deliberately small and traceable material state. Do not add invented engineering values merely to make the demo look more realistic.

## Change Log

### 2026-09-10

- Repository write access confirmed.
- Added README and project coordination document.
- Added minimal Next.js + TypeScript foundation.
- Added direct Three.js integration.
- Added process-domain contracts.
- Added initial sugarcane process definition.
- Connected process data to the initial 3D scene.
- Verified current core package versions and licenses before updating the dependency manifest.
