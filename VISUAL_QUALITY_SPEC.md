# FoodProcessLab — Visual Quality Specification

The project is being built as a portfolio-grade interactive 3D learning environment, not as a collection of placeholder primitives.

## Target quality bar

A viewer should be able to understand the main physical transformation from the 3D scene before reading the explanatory text.

### Equipment

Every important machine should have, where relevant:

- recognisable industrial proportions
- structural frame and load-bearing parts
- shafts, bearings and couplings
- guards or cutaway windows that reveal the learning-critical mechanism
- pipes, flanges, valves and outlets where they explain flow
- fasteners, seams, ribs, supports or maintenance details where they improve scale/readability
- material-specific surfaces rather than one flat material for everything
- lighting and shadows that make depth and contact points obvious

### Process visualization

The model must show the transformation itself:

- input material enters visibly
- the relevant physical interaction occurs inside the machine
- intermediate material states are visible
- output streams leave through distinct paths
- animation speed is tied to the educational goal, not merely decorative motion

### Materials

Use a restrained PBR-oriented material hierarchy:

- painted/aged industrial steel
- polished shafts
- rubber/contact surfaces
- brass/bronze service components
- process-specific food material
- transparent guards only where the transparency teaches something

External CC0 PBR textures may be introduced when procedural materials stop being convincing. The asset and license must be recorded before shipping.

### Rendering

The visual stack may use:

- Three.js addons already shipped with the approved Three.js dependency
- React Three Fiber / drei when a declarative architecture materially improves the scene
- postprocessing when subtle effects improve depth, contrast or emissive process signals
- self-hosted, license-verified HDRIs/PBR assets
- glTF/glb assets after license review and optimization

Effects must remain subordinate to the educational model. Bloom, fog, glow and cinematic grading must never hide geometry or make a process ambiguous.

## Current benchmark

`ExtractionMillV3` is the current visual benchmark.

It introduces:

- rounded industrial geometry rather than only sharp boxes
- detailed three-roll compression assembly
- bearing housings and service fittings
- visible gear train and motor/fan assembly
- cutaway guard
- flanged product outlet
- separate juice and bagasse paths
- segmented sugarcane input
- compressed fiber output
- visible juice droplets/jets
- subtle post-processing bloom
- interactive orbit inspection
- pause and slow-motion inspection

## What comes next

The benchmark is not the final factory. Once visually verified, its quality principles should be propagated selectively to the other process units.

The goal is not to make every machine equally dense. The goal is to spend geometry and rendering budget where it increases process understanding.

## Originality rule

External technical references and open assets may inform implementation, but FoodProcessLab must not copy another product's distinctive machine design, interface, animation choreography or visual identity.
