import type { MaterialStream } from "@/domain/material";

/**
 * Educational starting composition only. It is intentionally not presented
 * as an industrial design specification; values must be replaced or sourced
 * before engineering-mode simulation is introduced.
 */
export const illustrativeSugarcaneFeed: MaterialStream = {
  id: "sugarcane-feed",
  materialId: "sugarcane",
  massFlowKgPerHour: 1000,
  temperatureC: 25,
  pressureBar: 1,
  moisturePercent: 70,
  components: [
    { id: "water", name: "Water", massFraction: 0.7 },
    { id: "sucrose", name: "Sucrose", massFraction: 0.14 },
    { id: "fiber", name: "Fiber", massFraction: 0.12 },
    { id: "other-solids", name: "Other solids", massFraction: 0.04 },
  ],
};
