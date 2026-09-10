import type { ProcessDefinition } from "@/domain/process";

const parameter = (
  id: string,
  name: string,
  unit: "kg/h" | "°C" | "bar" | "%" | "kg",
  value: number,
) => ({ id, name, unit, value });

export const sugarcaneToSugar: ProcessDefinition = {
  id: "sugarcane-to-sugar",
  name: "Sugarcane to Sugar",
  steps: [
    {
      id: "preparation",
      name: "Preparation",
      equipmentId: "preparation-unit",
      description: "Prepares incoming sugarcane for size reduction and extraction.",
      parameters: [],
    },
    {
      id: "shredding",
      name: "Size Reduction / Shredding",
      equipmentId: "shredder",
      description: "Reduces cane structure to improve juice extraction.",
      parameters: [parameter("material-loss", "Illustrative preparation material loss", "%", 2)],
    },
    {
      id: "extraction",
      name: "Juice Extraction",
      equipmentId: "extraction-unit",
      description: "Separates juice from fibrous bagasse using explicit component recovery assumptions.",
      parameters: [
        parameter("juice-yield", "Illustrative juice yield", "%", 70),
        parameter("water-to-juice-percent", "Illustrative water recovery to juice", "%", 75),
        parameter("sucrose-to-juice-percent", "Illustrative sucrose recovery to juice", "%", 90),
        parameter("fiber-to-juice-percent", "Illustrative fiber recovery to juice", "%", 30),
        parameter("other-solids-to-juice-percent", "Illustrative other-solids recovery to juice", "%", 32.5),
      ],
    },
    {
      id: "clarification",
      name: "Juice Clarification",
      equipmentId: "clarifier",
      description: "Removes a simplified representation of suspended solids from extracted juice.",
      parameters: [parameter("solids-removal", "Illustrative fraction of non-dissolved solids removed", "%", 5)],
    },
    {
      id: "evaporation",
      name: "Evaporation",
      equipmentId: "evaporator",
      description: "Concentrates clarified juice by removing a configurable fraction of its water component.",
      parameters: [
        parameter("target-temperature", "Illustrative target temperature", "°C", 105),
        parameter("water-removal", "Illustrative water removal from clarified juice", "%", 35),
      ],
    },
    {
      id: "crystallization",
      name: "Crystallization",
      equipmentId: "crystallizer",
      description: "Represents the crystallization stage while preserving the material composition model for later separation.",
      parameters: [parameter("target-temperature", "Illustrative target temperature", "°C", 65)],
    },
    {
      id: "centrifugation",
      name: "Centrifugation",
      equipmentId: "centrifuge",
      description: "Uses explicit component recovery assumptions to separate a sugar-rich stream from mother liquor.",
      parameters: [
        parameter("mother-liquor-removal", "Illustrative non-sugar recovery to product", "%", 25),
        parameter("sucrose-crystal-recovery", "Illustrative sucrose recovery to product", "%", 90),
      ],
    },
    {
      id: "drying",
      name: "Drying",
      equipmentId: "dryer",
      description: "Removes enough water to reach the configured illustrative target moisture.",
      parameters: [
        parameter("target-temperature", "Illustrative target temperature", "°C", 60),
        parameter("target-moisture", "Illustrative target moisture", "%", 0.1),
      ],
    },
  ],
  connections: [
    { fromStepId: "preparation", toStepId: "shredding" },
    { fromStepId: "shredding", toStepId: "extraction" },
    { fromStepId: "extraction", toStepId: "clarification" },
    { fromStepId: "clarification", toStepId: "evaporation" },
    { fromStepId: "evaporation", toStepId: "crystallization" },
    { fromStepId: "crystallization", toStepId: "centrifugation" },
    { fromStepId: "centrifugation", toStepId: "drying" },
  ],
};
