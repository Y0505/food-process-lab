import type { MaterialTransformation } from "@/domain/process";
import {
  centrifugation,
  clarification,
  crystallization,
  drying,
  evaporation,
  juiceExtraction,
  preparation,
  shredding,
} from "@/domain/transformations";

export const sugarcaneTransformations: ReadonlyMap<string, MaterialTransformation> =
  new Map([
    ["preparation", preparation],
    ["shredding", shredding],
    ["extraction", juiceExtraction],
    ["clarification", clarification],
    ["evaporation", evaporation],
    ["crystallization", crystallization],
    ["centrifugation", centrifugation],
    ["drying", drying],
  ]);
