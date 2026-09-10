# FoodProcessLab — AI Agent Handoff

This file is a compact handoff for any AI agent working on this repository. `PROJECT_PROGRESS.md` is the authoritative detailed source of truth; read it before editing.

## Project goal

FoodProcessLab is an original, process-first 3D learning environment for understanding food-processing processes. The first process is sugarcane-to-sugar.

## Non-negotiable rules

- Do not copy source code, distinctive UI, 3D assets, textures, illustrations, workflows, or product-specific implementations from other projects.
- General technical research is allowed for factual engineering knowledge, terminology, equations, standards, and realistic parameter ranges.
- Important engineering values must be sourced or explicitly marked configurable/illustrative. Never invent authoritative-looking values.
- Prefer minimal dependencies. Every new dependency requires a license/free-use review and must not require visible attribution, branding, watermark, logo, or credit in user-facing output.
- Keep process logic independent from Three.js. The 3D scene is a view of the process model, not the process model itself.
- Preserve completed architecture unless a documented reason requires change.

## Current state

Phase 2 — Process Engine Vertical Slice.

Completed:
- Next.js + TypeScript application foundation.
- Direct Three.js viewport with original primitive equipment representations.
- Sugarcane process definition with eight stages.
- Multi-component material streams and validation.
- Deterministic multi-stream transformation contract and runner.
- Sugarcane extraction, clarification, evaporation, crystallization, centrifugation, and drying educational transformations.
- Mass-balance assertions and end-to-end tests.
- Derived stream moisture is calculated from output water composition.
- Vitest 4.1.11 + Vite 6.4.1 test setup for Node 20.

Current verified test state (2026-09-10): 3 test files, 8 tests, all passing locally.

## Immediate implementation target

Connect the deterministic multi-stream simulation state to the existing Three.js visualization.

The visualization slice should:
1. Execute the existing sugarcane multi-stream process in the browser.
2. Represent equipment from the existing process definition.
3. Show the currently selected/active process stage.
4. Show material-flow information derived from simulation state, including output stream names and mass flow.
5. Keep rendering code as a view/adapter; do not move process logic into Three.js.
6. Add pure tests for any new mapping/adapter logic before relying on UI behavior.

## Known future work

- Equipment selection and richer original equipment models.
- Animated material flow.
- Parameter display and parameter input.
- Simulation clock/timeline.
- Internal/cutaway inspection.
- Engineering parameter dataset with traceable sources.
- Energy-balance validation.
- Accessibility, responsive polish, performance, documentation, deployment.

## Testing protocol

When a coherent domain or UI integration slice reaches a real verification gate, tell the user exactly what to run. Do not ask for testing prematurely.

Typical local command:

```bash
npm test
```

For browser/UI verification, use the repository's normal Next.js development command after the domain tests pass.

## Agent workflow

1. Read `PROJECT_PROGRESS.md` and this file.
2. Inspect the current files before editing them.
3. Make the smallest coherent change.
4. Add/update tests for domain behavior.
5. Update `PROJECT_PROGRESS.md` and this file when project status changes.
6. Commit changes to GitHub with a clear message.
7. Only then declare the next testing gate.
