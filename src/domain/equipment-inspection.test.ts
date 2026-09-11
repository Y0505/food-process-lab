import { describe, expect, it } from "vitest";
import { getEquipmentInspection, sugarcaneEquipmentInspections } from "./equipment-inspection";

describe("equipment inspection metadata", () => {
  it("defines one inspection contract for every sugar process stage", () => {
    expect(sugarcaneEquipmentInspections).toHaveLength(8);
    expect(sugarcaneEquipmentInspections.map((item) => item.stageId)).toEqual([
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

  it("keeps the extraction inspection focused on the actual transformation", () => {
    const inspection = getEquipmentInspection("extraction");

    expect(inspection?.components.map((component) => component.id)).toEqual([
      "feed-chute",
      "roll-1",
      "roll-2",
      "roll-3",
      "juice-pan",
      "bagasse-chute",
      "drive",
    ]);
    expect(inspection?.flows.map((flow) => flow.label)).toEqual(["Juice", "Bagasse"]);
  });

  it("does not silently invent an inspection for an unknown stage", () => {
    expect(getEquipmentInspection("unknown-stage")).toBeUndefined();
  });
});
