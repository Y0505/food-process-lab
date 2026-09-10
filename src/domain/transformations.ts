import type {
  MaterialState,
  MaterialTransformation,
  ProcessParameter,
  TransformationContext,
} from "./process";

export class TransformationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransformationError";
  }
}

export function getParameter(
  parameters: readonly ProcessParameter[],
  id: string,
): number {
  const parameter = parameters.find((item) => item.id === id);

  if (!parameter) {
    throw new TransformationError(`Missing process parameter: ${id}`);
  }

  return parameter.value;
}

function withFlow(
  input: MaterialState,
  massFlowKgPerHour: number,
): MaterialState {
  if (!Number.isFinite(massFlowKgPerHour) || massFlowKgPerHour < 0) {
    throw new TransformationError("Mass flow must be a finite non-negative value.");
  }

  return { ...input, massFlowKgPerHour };
}

function withTemperature(
  input: MaterialState,
  temperatureC: number,
): MaterialState {
  if (!Number.isFinite(temperatureC)) {
    throw new TransformationError("Temperature must be a finite value.");
  }

  return { ...input, temperatureC };
}

export const preparation: MaterialTransformation = (input) => input;

export const shredding: MaterialTransformation = (input, context) => {
  const extractionPreparationLossPercent = getParameter(
    context.step.parameters,
    "material-loss",
  );
  const outputFlow =
    input.massFlowKgPerHour * (1 - extractionPreparationLossPercent / 100);

  return withFlow(input, outputFlow);
};

export const juiceExtraction: MaterialTransformation = (input, context) => {
  const extractionYieldPercent = getParameter(
    context.step.parameters,
    "juice-yield",
  );
  const outputFlow = input.massFlowKgPerHour * (extractionYieldPercent / 100);

  return withFlow(input, outputFlow);
};

export const clarification: MaterialTransformation = (input, context) => {
  const solidsRemovalPercent = getParameter(
    context.step.parameters,
    "solids-removal",
  );
  const outputFlow =
    input.massFlowKgPerHour * (1 - solidsRemovalPercent / 100);

  return withFlow(input, outputFlow);
};

export const evaporation: MaterialTransformation = (input, context) => {
  const targetTemperatureC = getParameter(
    context.step.parameters,
    "target-temperature",
  );

  return withTemperature(input, targetTemperatureC);
};

export const crystallization: MaterialTransformation = (input, context) => {
  const targetTemperatureC = getParameter(
    context.step.parameters,
    "target-temperature",
  );

  return withTemperature(input, targetTemperatureC);
};

export const centrifugation: MaterialTransformation = (input, context) => {
  const motherLiquorRemovalPercent = getParameter(
    context.step.parameters,
    "mother-liquor-removal",
  );
  const outputFlow =
    input.massFlowKgPerHour * (1 - motherLiquorRemovalPercent / 100);

  return withFlow(input, outputFlow);
};

export const drying: MaterialTransformation = (input, context) => {
  const targetTemperatureC = getParameter(
    context.step.parameters,
    "target-temperature",
  );
  const targetMoisturePercent = getParameter(
    context.step.parameters,
    "target-moisture",
  );

  return {
    ...withTemperature(input, targetTemperatureC),
    moisturePercent: targetMoisturePercent,
  };
};

export function applyTransformation(
  transformation: MaterialTransformation,
  input: MaterialState,
  context: TransformationContext,
): MaterialState {
  const output = transformation(input, context);

  if (output.materialId !== input.materialId) {
    throw new TransformationError("Transformations cannot change material identity yet.");
  }

  return output;
}
