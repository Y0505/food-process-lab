import type { ProcessDefinition } from "@/domain/process";

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
      parameters: [],
    },
    {
      id: "extraction",
      name: "Juice Extraction",
      equipmentId: "extraction-unit",
      description: "Separates juice from fibrous bagasse.",
      parameters: [],
    },
    {
      id: "clarification",
      name: "Juice Clarification",
      equipmentId: "clarifier",
      description: "Removes suspended and dissolved impurities from extracted juice.",
      parameters: [],
    },
    {
      id: "evaporation",
      name: "Evaporation",
      equipmentId: "evaporator",
      description: "Concentrates clarified juice by removing water.",
      parameters: [],
    },
    {
      id: "crystallization",
      name: "Crystallization",
      equipmentId: "crystallizer",
      description: "Promotes formation of sugar crystals from concentrated syrup.",
      parameters: [],
    },
    {
      id: "centrifugation",
      name: "Centrifugation",
      equipmentId: "centrifuge",
      description: "Separates sugar crystals from the remaining mother liquor.",
      parameters: [],
    },
    {
      id: "drying",
      name: "Drying",
      equipmentId: "dryer",
      description: "Reduces moisture in separated sugar crystals.",
      parameters: [],
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
