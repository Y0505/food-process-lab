import { describe, expect, it } from "vitest";
import { buildSugarcaneVisualizationModel } from "./sugarcane-visualization-model";

describe("sugarcane visualization model", () => {
  it("maps every process step to its deterministic simulation result", () => {
    const model = buildSugarcaneVisualizationModel();

    expect(model.processId).toBe("sugarcane-to-sugar");
    expect(model.stages).toHaveLength(8);
    expect(model.stages.map((stage) => stage.stepId)).toEqual([
      "preparation",
      "shredding",
      "extraction",
      "clarification",
      "evaporation",
      "crystallization",
      "centrifugation",
      "drying",
    ]);
  });

  it("exposes real stream state for the visualization", () => {
    const model = buildSugarcaneVisualizationModel();
    const extraction = model.stages.find((stage) => stage.stepId === "extraction");
    const drying = model.stages.find((stage) => stage.stepId === "drying");

    expect(extraction?.outputStreams.map((stream) => stream.id)).toEqual([
      "extracted-juice",
      "bagasse",
    ]);
    expect(drying?.outputStreams.map((stream) => stream.id)).toEqual([
      "dried-sugar",
      "drying-vapor",
    ]);

    const driedSugar = drying?.outputStreams.find((stream) => stream.id === "dried-sugar");
    expect(driedSugar?.moisturePercent).toBeCloseTo(0.1, 8);
    expect(driedSugar?.massFlowKgPerHour).toBeGreaterThan(0);
  });
});
