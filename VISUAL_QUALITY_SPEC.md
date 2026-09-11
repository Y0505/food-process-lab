# FoodProcessLab — Visual Quality Specification

FoodProcessLab is being built as a portfolio-grade interactive 3D learning environment. The final experience should feel like entering a real sugar-processing plant, not browsing separate demo cards.

## Primary experience

The application has one dominant interaction model:

`Factory floor → select machine → camera approaches machine → enter machine → inspect internal mechanism → return to factory`

The production line is the home screen. Separate long-form machine demo sections are not the primary navigation.

## Factory floor quality bar

The first screen should immediately communicate **industrial sugar factory**:

- continuous production hall rather than isolated floating machines
- structural columns, roof trusses, catwalks and maintenance platforms
- conveyors and inter-unit process piping
- utility headers and service lines
- coherent floor, scale and spatial depth
- atmospheric lighting, contact shadows and restrained post-processing
- visible material movement connecting the units
- eight identifiable process units with meaningful silhouettes

A user should understand that the machines belong to one connected process before reading text.

## Machine interaction

Every process unit is directly selectable in the 3D scene.

Selection should:

1. highlight the chosen unit;
2. move the camera toward it;
3. expose concise input/output/process information;
4. provide an explicit **Enter Machine** action;
5. move into a closer cutaway/internal inspection;
6. preserve orbit and zoom so the user can inspect the mechanism;
7. provide a clear return to the factory.

## Internal machine quality bar

The internal view must be process-first. Primitive geometry is acceptable only when it represents a recognizable real component.

Where relevant, equipment should contain:

- load-bearing frame and casing
- shafts, bearings, couplings and drives
- rollers, rotors, blades, coils, baskets, drums or agitators appropriate to the stage
- guards and cutaway surfaces
- pipes, flanges, valves and outlets
- fasteners, ribs, supports and maintenance details where they improve scale
- distinct material states
- visible input and output paths
- animation showing the physical transformation

The viewer should be able to answer **“what is happening to the material?”** by looking at the model before reading the UI.

## Process visualization

Every stage should expose a meaningful transformation:

`input material → physical/thermal/mechanical interaction → intermediate state → output stream`

Examples:

- Preparation: stalks become prepared billets.
- Shredding: billets are opened into fibrous material.
- Extraction: rolls compress cane; liquid juice separates from fiber.
- Clarification: suspended material settles while clarified juice leaves separately.
- Evaporation: water is removed as vapor and syrup concentration rises.
- Crystallization: sucrose crystals grow inside concentrated liquor.
- Centrifugation: crystals and mother liquor separate through rotation.
- Drying: wet sugar loses moisture in a moving heated-air environment.

Engineering values that are not yet validated must remain explicitly illustrative/configurable.

## Rendering stack

The project may use:

- Three.js and its official addons already included with the approved Three.js dependency
- React Three Fiber / drei if they materially improve maintainability or interaction quality
- postprocessing for restrained bloom, tone and depth cues
- self-hosted CC0 HDRIs/PBR materials
- optimized glTF/GLB assets after exact license verification

No visual dependency is accepted merely because it is popular or free to download. License compatibility, redistribution rights, attribution requirements and commercial use must be checked first.

Poly Haven is an approved candidate for environmental HDRIs, PBR materials and selected generic industrial assets because its published assets are CC0 and may be used commercially and redistributed; exact assets still need to be recorded in `ASSET_LICENSES.md`. citehttps://polyhaven.com/license

## Current implementation direction

`ImmersiveSugarPlant` is now the primary application shell. It replaces the previous stacked-demo layout with one continuous factory experience and direct machine selection.

The current procedural machine set covers all eight stages and includes stage-specific mechanisms rather than one generic machine shape. The next visual work is to deepen these interiors, add validated/approved external PBR assets where they materially improve realism, and make camera transitions feel like physically entering the selected unit.

## Originality rule

External technical references and open assets may inform implementation, but FoodProcessLab must not copy another product's distinctive machine design, interface, animation choreography or visual identity. External assets are recorded with their exact source and license.
