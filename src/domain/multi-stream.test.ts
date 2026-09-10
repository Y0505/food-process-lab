import { describe, expect, it } from "vitest";
import { componentMassFlow, componentFractionsSum, type MaterialStream } from "./material";
import { assertMassBalance, splitStreamByMassFraction } from "./multi-stream";
import { sugarcaneExtractionMultiStream } from "../processes/sugarcane-multi-stream";

const feed: MaterialStream = {
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

describe("material stream model", () => {
  it("keeps component fractions normalized", () => {
    expect(componentFractionsSum(feed.components)).toBeCloseTo(1);
    expect(componentMassFlow(feed, "sucrose")).toBeCloseTo(140);
  });
});

describe("multi-stream transformations", () => {
  it("splits a stream while preserving total mass", () => {
    const outputs = splitStreamByMassFraction(feed, ["a", "b"], [0.7, 0.3]);

    expect(outputs[0].massFlowKgPerHour).toBeCloseTo(700);
    expect(outputs[1].massFlowKgPerHour).toBeCloseTo(300);
    expect(() => assertMassBalance([feed], outputs)).not.toThrow();
  });

  it("models extraction as juice plus bagasse without losing mass", () => {
    const result = sugarcaneExtractionMultiStream([feed], {
      stepId: "extraction",
      parameters: new Map([["juice-yield", 70]]),
    });

    expect(result.outputs).toHaveLength(2);
    expect(result.outputs[0].id).toBe("extracted-juice");
    expect(result.outputs[1].id).toBe("bagasse");
    expect(result.outputs[0].massFlowKgPerHour).toBeCloseTo(700);
    expect(result.outputs[1].massFlowKgPerHour).toBeCloseTo(300);
    expect(() => assertMassBalance([feed], result.outputs)).not.toThrow();
  });
});
