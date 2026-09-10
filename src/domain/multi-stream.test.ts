import { describe, expect, it } from "vitest";
import { componentMassFlow, componentFractionsSum, type MaterialStream } from "./material";
import {
  assertMassBalance,
  splitStreamByComponentRecovery,
  splitStreamByMassFraction,
} from "./multi-stream";
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

  it("allocates each component between juice and bagasse while conserving component mass", () => {
    const [juice, bagasse] = splitStreamByComponentRecovery(
      feed,
      ["juice", "bagasse"],
      new Map([
        ["water", 0.75],
        ["sucrose", 0.9],
        ["fiber", 0.3],
        ["other-solids", 0.325],
      ]),
    );

    expect(juice.massFlowKgPerHour).toBeCloseTo(700);
    expect(bagasse.massFlowKgPerHour).toBeCloseTo(300);
    expect(componentMassFlow(juice, "sucrose")).toBeCloseTo(126);
    expect(componentMassFlow(bagasse, "sucrose")).toBeCloseTo(14);
    expect(componentFractionsSum(juice.components)).toBeCloseTo(1);
    expect(componentFractionsSum(bagasse.components)).toBeCloseTo(1);

    for (const component of feed.components) {
      const outputMass =
        componentMassFlow(juice, component.id) + componentMassFlow(bagasse, component.id);
      expect(outputMass).toBeCloseTo(componentMassFlow(feed, component.id));
    }
  });

  it("models extraction with different juice and bagasse composition", () => {
    const result = sugarcaneExtractionMultiStream([feed], {
      stepId: "extraction",
      parameters: new Map([
        ["juice-yield", 70],
        ["water-to-juice-percent", 75],
        ["sucrose-to-juice-percent", 90],
        ["fiber-to-juice-percent", 30],
        ["other-solids-to-juice-percent", 32.5],
      ]),
    });

    const [juice, bagasse] = result.outputs;
    expect(juice.massFlowKgPerHour).toBeCloseTo(700);
    expect(bagasse.massFlowKgPerHour).toBeCloseTo(300);
    expect(componentMassFlow(juice, "fiber")).toBeCloseTo(36);
    expect(componentMassFlow(bagasse, "fiber")).toBeCloseTo(84);
    expect(() => assertMassBalance([feed], result.outputs)).not.toThrow();
  });
});
