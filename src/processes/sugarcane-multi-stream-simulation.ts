import type { MaterialStream } from "@/domain/material";
import {
  assertMassBalance,
  type MultiStreamTransformation,
  splitStreamByComponentRecovery,
} from "@/domain/multi-stream";
import type { MultiStreamTransformationRegistry } from "@/domain/multi-stream-simulation";
import { sugarcaneExtractionMultiStream } from "./sugarcane-multi-stream";
import { sugarcaneToSugar } from "./sugarcane";

const getParameter = (parameters: ReadonlyMap<string, number>, id: string): number => {
  const value = parameters.get(id);
  if (value === undefined) throw new Error(`Missing process parameter: ${id}`);
  return value;
};

const requirePercent = (value: number, id: string): number => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${id} must be between 0 and 100%.`);
  }
  return value;
};

const passThrough = (input: readonly MaterialStream[]): { outputs: readonly MaterialStream[] } => ({
  outputs: input,
});

const mainStream = (input: readonly MaterialStream[], id: string): MaterialStream => {
  const stream = input.find((candidate) => candidate.id === id);
  if (!stream) throw new Error(`Missing required stream: ${id}`);
  return stream;
};

const preparation: MultiStreamTransformation = (input) => passThrough(input);
const shredding: MultiStreamTransformation = (input) => passThrough(input);

const clarification: MultiStreamTransformation = (input, context) => {
  const source = mainStream(input, "extracted-juice");
  const removal = requirePercent(
    getParameter(context.parameters, "solids-removal"),
    "solids-removal",
  ) / 100;

  const recovery = new Map(
    source.components.map((component) => {
      const removesComponent = component.id === "fiber" || component.id === "other-solids";
      return [component.id, removesComponent ? 1 - removal : 1] as const;
    }),
  );

  const [clarifiedJuice, removedSolids] = splitStreamByComponentRecovery(
    source,
    ["clarified-juice", "clarification-solids"],
    recovery,
  );
  assertMassBalance([source], [clarifiedJuice, removedSolids]);
  return { outputs: [clarifiedJuice, removedSolids] };
};

const evaporation: MultiStreamTransformation = (input, context) => {
  const source = mainStream(input, "clarified-juice");
  const removal = requirePercent(
    getParameter(context.parameters, "water-removal"),
    "water-removal",
  ) / 100;
  const targetTemperature = getParameter(context.parameters, "target-temperature");

  const recovery = new Map(
    source.components.map((component) => [
      component.id,
      component.id === "water" ? 1 - removal : 1,
    ] as const),
  );

  const [syrup, vapor] = splitStreamByComponentRecovery(
    { ...source, temperatureC: targetTemperature },
    ["concentrated-syrup", "evaporated-water"],
    recovery,
  );
  assertMassBalance([source], [syrup, vapor]);
  return { outputs: [syrup, vapor] };
};

const crystallization: MultiStreamTransformation = (input, context) => {
  const source = mainStream(input, "concentrated-syrup");
  const targetTemperature = getParameter(context.parameters, "target-temperature");
  return {
    outputs: [{ ...source, id: "crystal-magma", temperatureC: targetTemperature }],
  };
};

const centrifugation: MultiStreamTransformation = (input, context) => {
  const source = mainStream(input, "crystal-magma");
  const motherLiquorRemoval = requirePercent(
    getParameter(context.parameters, "mother-liquor-removal"),
    "mother-liquor-removal",
  ) / 100;
  const nonSugarProductRecovery = 1 - motherLiquorRemoval;
  const sucroseRecovery = requirePercent(
    getParameter(context.parameters, "sucrose-crystal-recovery"),
    "sucrose-crystal-recovery",
  ) / 100;

  const recovery = new Map(
    source.components.map((component) => [
      component.id,
      component.id === "sucrose" ? sucroseRecovery : nonSugarProductRecovery,
    ] as const),
  );

  const [sugarRich, motherLiquor] = splitStreamByComponentRecovery(
    source,
    ["wet-sugar", "mother-liquor"],
    recovery,
  );
  assertMassBalance([source], [sugarRich, motherLiquor]);
  return { outputs: [sugarRich, motherLiquor] };
};

const drying: MultiStreamTransformation = (input, context) => {
  const stream = mainStream(input, "wet-sugar");
  const targetMoisture = requirePercent(
    getParameter(context.parameters, "target-moisture"),
    "target-moisture",
  );
  const targetTemperature = getParameter(context.parameters, "target-temperature");
  const waterComponent = stream.components.find((component) => component.id === "water");
  const waterMass = waterComponent ? stream.massFlowKgPerHour * waterComponent.massFraction : 0;
  const dryMass = stream.massFlowKgPerHour - waterMass;
  const targetWaterMass = dryMass * (targetMoisture / (100 - targetMoisture));
  const waterToRemove = Math.max(0, waterMass - targetWaterMass);

  if (waterToRemove <= 1e-9) {
    return {
      outputs: [{ ...stream, id: "dried-sugar", temperatureC: targetTemperature }],
    };
  }

  const waterRecovery = (waterMass - waterToRemove) / waterMass;
  const recovery = new Map(
    stream.components.map((component) => [
      component.id,
      component.id === "water" ? waterRecovery : 1,
    ] as const),
  );

  const [driedSugar, dryingVapor] = splitStreamByComponentRecovery(
    { ...stream, temperatureC: targetTemperature },
    ["dried-sugar", "drying-vapor"],
    recovery,
  );
  assertMassBalance([stream], [driedSugar, dryingVapor]);
  return { outputs: [driedSugar, dryingVapor] };
};

export const sugarcaneMultiStreamTransformations: MultiStreamTransformationRegistry = new Map([
  ["preparation", preparation],
  ["shredding", shredding],
  ["extraction", sugarcaneExtractionMultiStream],
  ["clarification", clarification],
  ["evaporation", evaporation],
  ["crystallization", crystallization],
  ["centrifugation", centrifugation],
  ["drying", drying],
]);

export const sugarcaneMultiStreamProcess = sugarcaneToSugar;
