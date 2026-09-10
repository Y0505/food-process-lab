import { describe, expect, it } from "vitest";
import { runProcess } from "./simulation";
import { sugarcaneToSugar } from "@/processes/sugarcane";
import { sugarcaneTransformations } from "@/processes/sugarcane-simulation";

describe("sugarcane process", () => {
  it("runs the complete deterministic process", () => {
    const result = runProcess(
      sugarcaneToSugar,
      {
        materialId: "sugarcane-feed",
        massFlowKgPerHour: 1000,
        temperatureC: 25,
        moisturePercent: 70,
      },
      sugarcaneTransformations,
    );

    expect(result.steps).toHaveLength(8);
    expect(result.finalState.massFlowKgPerHour).toBe(442.75);
    expect(result.finalState.temperatureC).toBe(60);
    expect(result.finalState.moisturePercent).toBe(0.1);
  });

  it("rejects invalid material flow", () => {
    expect(() =>
      runProcess(
        sugarcaneToSugar,
        {
          materialId: "sugarcane-feed",
          massFlowKgPerHour: -1,
          temperatureC: 25,
        },
        sugarcaneTransformations,
      ),
    ).toThrow("Mass flow must be a finite non-negative value.");
  });
});
