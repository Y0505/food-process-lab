import { describe, expect, it } from "vitest";
import { runMultiStreamProcess } from "@/domain/multi-stream-simulation";
import { illustrativeSugarcaneFeed } from "./sugarcane-material";
import {
  sugarcaneMultiStreamProcess,
  sugarcaneMultiStreamTransformations,
} from "./sugarcane-multi-stream-simulation";

describe("sugarcane multi-stream process", () => {
  it("runs the complete process from cane to dried sugar", () => {
    const result = runMultiStreamProcess(
      sugarcaneMultiStreamProcess,
      [illustrativeSugarcaneFeed],
      sugarcaneMultiStreamTransformations,
    );

    expect(result.steps).toHaveLength(8);
    expect(result.steps.map((step) => step.stepId)).toEqual([
      "preparation",
      "shredding",
      "extraction",
      "clarification",
      "evaporation",
      "crystallization",
      "centrifugation",
      "drying",
    ]);
    expect(result.steps[2].output.map((stream) => stream.id)).toEqual([
      "extracted-juice",
      "bagasse",
    ]);
    expect(result.steps[3].output.map((stream) => stream.id)).toEqual([
      "clarified-juice",
      "clarification-solids",
    ]);
    expect(result.steps[4].output.map((stream) => stream.id)).toEqual([
      "concentrated-syrup",
      "evaporated-water",
    ]);
    expect(result.steps[6].output.map((stream) => stream.id)).toEqual([
      "wet-sugar",
      "mother-liquor",
    ]);
    expect(result.finalStreams.map((stream) => stream.id)).toEqual([
      "dried-sugar",
      "drying-vapor",
    ]);

    const driedSugar = result.finalStreams[0];
    const sucrose = driedSugar.components.find((component) => component.id === "sucrose");

    expect(sucrose?.massFraction).toBeGreaterThan(0);
    expect(driedSugar.moisturePercent).toBeCloseTo(0.1, 8);
    expect(driedSugar.massFlowKgPerHour).toBeGreaterThan(0);
  });

  it("conserves mass at every active multi-output stage", () => {
    const result = runMultiStreamProcess(
      sugarcaneMultiStreamProcess,
      [illustrativeSugarcaneFeed],
      sugarcaneMultiStreamTransformations,
    );

    for (const step of result.steps) {
      if (step.stepId === "extraction") {
        expect(step.output.reduce((sum, stream) => sum + stream.massFlowKgPerHour, 0))
          .toBeCloseTo(step.input[0].massFlowKgPerHour, 8);
      }

      if (["clarification", "evaporation", "centrifugation", "drying"].includes(step.stepId)) {
        const activeIds = [
          "extracted-juice",
          "clarified-juice",
          "concentrated-syrup",
          "crystal-magma",
          "wet-sugar",
        ];
        const activeInput = step.input.filter((stream) => activeIds.includes(stream.id));
        expect(step.output.reduce((sum, stream) => sum + stream.massFlowKgPerHour, 0))
          .toBeCloseTo(activeInput.reduce((sum, stream) => sum + stream.massFlowKgPerHour, 0), 8);
      }
    }
  });
});
