# FoodProcessLab — Asset & Dependency License Policy

This document records the visual/dependency policy for the project as the quality bar increases.

## Quality policy

The project is no longer restricted to hand-written geometry when a third-party solution can materially improve the final result.

The rule is now:

> Use the best legally compatible tool or asset for the job, while keeping the implementation, process logic, and distinctive experience original.

## Approved software stack

| Component | License | Intended use | Requirement |
|---|---|---|---|
| Three.js | MIT | Core WebGL renderer, geometry, loaders and post-processing addons | Keep the required MIT notice in repository-level notices when distributing the project |
| React Three Fiber | MIT | Optional declarative 3D architecture for components where it improves maintainability | Add only when migration/use is justified |
| drei | MIT | Optional R3F helpers | Add only when a helper materially improves the experience |
| postprocessing | Zlib | Optional advanced post-processing | Preserve its license notice if added |
| glTF-Transform | MIT | Offline optimization of approved GLB/glTF assets | Use as a build/asset pipeline tool, not as a source of copied models |
| Next.js | MIT | Application framework | Existing approved dependency |
| Vitest | MIT | Domain test runner | Existing approved dependency |

## Visual assets

### Preferred: original project-specific assets

- Process-specific equipment remains original and purpose-built for this project.
- Distinctive educational cutaways, material-flow animations, interaction patterns and visual composition are original implementation work.

### Preferred external asset source: Poly Haven

Poly Haven states that its HDRIs, textures and 3D models are released under CC0 and may be used commercially without required attribution.

Source: https://polyhaven.com/license

When Poly Haven assets are used:

- Record the exact asset name and source URL in this file.
- Prefer self-hosting the selected asset instead of runtime CDN dependency.
- Do not copy the site's surrounding branding, preview compositions or distinctive presentation.
- Do not claim the original CC0 asset was created by FoodProcessLab.

### Other sources

No model, texture, HDRI, sound, icon set or image from another source may enter the repository until its exact license has been verified.

"Free download" is not considered a license.

## Current external visual assets

| Asset | Source | License | Status |
|---|---|---|---|
| None | — | — | Current benchmark is procedural/original |

## License-review rule for future additions

Before adding an external asset or dependency, verify:

1. Exact license, not only the marketplace/site's "free" label.
2. Commercial-use permission if the project may later generate revenue.
3. Redistribution/bundling permission for repository or deployed assets.
4. Attribution/notice requirements.
5. Whether the license imposes share-alike or source-disclosure obligations.
6. Whether the asset includes third-party components with a different license.
7. Whether the asset can be self-hosted without violating its terms.

If any point is unclear, do not ship the asset until the license is resolved.
