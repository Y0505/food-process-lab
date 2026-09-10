# FoodProcessLab

An original, interactive 3D learning environment for understanding food-processing processes.

## Vision

FoodProcessLab is a process-first digital learning lab. Instead of treating a factory as a collection of detailed CAD objects, it connects a simplified 3D representation to an explicit process model so users can understand what enters a process, what changes, which parameters matter, and what leaves it.

## Initial Process

The first complete learning process is sugarcane-to-sugar:

`Sugarcane → Preparation → Size Reduction / Shredding → Juice Extraction → Juice Clarification → Evaporation → Crystallization → Centrifugation → Drying → Sugar`

The first version will use simplified, traceable process logic. Engineering values will not be invented; important parameters will be documented with their context, assumptions, and technical sources.

## Core Experience

- Navigate an original 3D process line.
- Select equipment and inspect its role in the process.
- Follow material flow through the line.
- View important process parameters such as temperature, pressure, flow rate, moisture, and material state when applicable.
- Enter an internal/cutaway inspection view only where it improves process understanding.
- Compare input and output states.
- Progress toward a deterministic simulation and validation layer.

## Architecture

The core principle is:

> The 3D scene is a view of the process model, not the process model itself.

```text
Application UI
     |
     +-- 3D Visualization
     |      +-- Scene
     |      +-- Equipment
     |      +-- Material Flow
     |      +-- Camera / Interaction
     |
     +-- Process Engine
     |      +-- Process Stages
     |      +-- Material State
     |      +-- Parameters
     |      +-- Transformations
     |      +-- Validation
     |
     +-- Educational Data
            +-- Explanations
            +-- Equipment Information
            +-- Technical References
```

The domain model is intended to remain usable without Three.js so process logic can be tested independently from rendering.

## Technical Direction

- Next.js + TypeScript for the application shell.
- Three.js for the 3D visualization layer.
- Data-driven process definitions.
- Minimal dependencies.
- Deterministic process transformations before any AI features.
- Original geometry built from primitives initially; more detailed self-authored assets may be introduced later.

AI is not part of the core v1 simulation. It may become an optional educational layer in a later phase.

## Originality and Copyright Policy

This project is independently designed and implemented.

We do **not** copy or adapt:

- source code from other repositories, tutorials, demos, or products;
- distinctive user interfaces or visual designs;
- 3D models, textures, icons, illustrations, or other assets;
- proprietary educational content;
- distinctive workflows or product-specific implementations.

Public availability or an open-source license of another project is not treated as permission to copy its distinctive implementation or design.

External projects may be researched for factual technical concepts, terminology, equations, standards, or general engineering understanding. Those references are not implementation templates.

## Dependency Policy

Every dependency must be reviewed before adoption.

Requirements:

- Free to use for this project.
- License compatible with the repository's licensing plan.
- No paid plan required for the core application.
- No mandatory visible attribution, branding, logo, credit badge, or watermark in application output.
- Repository-level license and notice obligations must still be respected.
- Avoid dependencies when the capability can reasonably be implemented with platform APIs or project code.

## Development Principles

1. Process logic comes before visual complexity.
2. Every important engineering parameter must be traceable.
3. Visualization must not become the source of truth for simulation state.
4. Small vertical slices are preferred over large disconnected feature sets.
5. Completed architecture is changed only for a documented reason.
6. Tests should cover process logic independently of rendering.
7. Unknown or illustrative engineering values must be clearly labeled rather than presented as authoritative.

## Roadmap

### Phase 0 — Foundation
- Repository and project rules
- Documentation and agent coordination
- Dependency policy

### Phase 1 — Application Skeleton
- Next.js application
- TypeScript configuration
- Minimal 3D scene
- Basic application layout

### Phase 2 — Process Domain Model
- Process and process-step types
- Material state
- Parameters
- Deterministic transformations
- Validation contracts
- Unit tests

### Phase 3 — Sugarcane Process
- Define the first process data model
- Connect each stage to inputs and outputs
- Document educational and engineering context

### Phase 4 — 3D Equipment Visualization
- Original equipment representations
- Equipment selection
- Material-flow visualization
- Parameter display

### Phase 5 — Internal Inspection
- Identify equipment where internal visibility is educationally useful
- Original cutaway/inspection representations
- Component highlighting

### Phase 6 — Simulation and Validation
- Simulation state and clock
- Parameter inputs
- Deterministic execution
- Input/output reporting
- Mass/energy balance validation where appropriate

### Phase 7 — Presentation Quality
- Interaction polish
- Accessibility
- Responsive UI
- Performance
- Documentation and deployment

### Phase 8 — Additional Food Processes
- Add additional process lines only after the first vertical slice is robust.

## Status

The repository is in the foundation stage. The next implementation target is a minimal application skeleton followed by the process-domain model and a small end-to-end vertical slice.

See [`PROJECT_PROGRESS.md`](./PROJECT_PROGRESS.md) for the authoritative project status, decisions, and agent handoff notes.

## License

The project's own license will be selected and documented before the first distributable release. Third-party dependency licenses will be recorded separately as dependencies are introduced.
