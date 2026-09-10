import type { MaterialComponent, MaterialStream } from "./material";
import { componentMassFlow } from "./material";

export interface MultiStreamTransformationContext {
  readonly stepId: string;
  readonly parameters: ReadonlyMap<string, number>;
}

export interface MultiStreamTransformationResult {
  readonly outputs: readonly MaterialStream[];
}

export type MultiStreamTransformation = (
  input: readonly MaterialStream[],
  context: MultiStreamTransformationContext,
) => MultiStreamTransformationResult;

export class MultiStreamTransformationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MultiStreamTransformationError";
  }
}

export function splitStreamByMassFraction(
  input: MaterialStream,
  outputIds: readonly string[],
  fractions: readonly number[],
): readonly MaterialStream[] {
  if (outputIds.length !== fractions.length || outputIds.length === 0) {
    throw new MultiStreamTransformationError(
      "Output IDs and split fractions must have the same non-zero length.",
    );
  }

  if (fractions.some((fraction) => !Number.isFinite(fraction) || fraction < 0)) {
    throw new MultiStreamTransformationError("Split fractions must be finite and non-negative.");
  }

  const fractionSum = fractions.reduce((sum, fraction) => sum + fraction, 0);
  if (Math.abs(fractionSum - 1) > 1e-9) {
    throw new MultiStreamTransformationError("Split fractions must sum to 1.");
  }

  return outputIds.map((id, index) => ({
    ...input,
    id,
    massFlowKgPerHour: input.massFlowKgPerHour * fractions[index],
  }));
}

/**
 * Splits a stream into two outputs using explicit component recovery fractions.
 * The recovery value describes the fraction of each component sent to output 0;
 * the remainder is sent to output 1. Component mass is conserved exactly apart
 * from floating-point rounding.
 */
export function splitStreamByComponentRecovery(
  input: MaterialStream,
  outputIds: readonly [string, string],
  recoveryToFirstOutput: ReadonlyMap<string, number>,
): readonly [MaterialStream, MaterialStream] {
  if (outputIds[0] === outputIds[1]) {
    throw new MultiStreamTransformationError("Output stream IDs must be unique.");
  }

  const firstMassByComponent = new Map<string, number>();
  const secondMassByComponent = new Map<string, number>();

  for (const component of input.components) {
    const recovery = recoveryToFirstOutput.get(component.id);
    if (recovery === undefined) {
      throw new MultiStreamTransformationError(
        `Missing component recovery for: ${component.id}`,
      );
    }
    if (!Number.isFinite(recovery) || recovery < 0 || recovery > 1) {
      throw new MultiStreamTransformationError(
        `Component recovery must be between 0 and 1: ${component.id}`,
      );
    }

    const componentMass = componentMassFlow(input, component.id);
    firstMassByComponent.set(component.id, componentMass * recovery);
    secondMassByComponent.set(component.id, componentMass * (1 - recovery));
  }

  const firstMass = sumMapValues(firstMassByComponent);
  const secondMass = sumMapValues(secondMassByComponent);
  const expectedMass = input.massFlowKgPerHour;
  if (Math.abs(firstMass + secondMass - expectedMass) > 1e-9) {
    throw new MultiStreamTransformationError("Component allocation failed mass balance.");
  }

  return [
    buildComponentStream(input, outputIds[0], firstMass, input.components),
    buildComponentStream(input, outputIds[1], secondMass, input.components),
  ];
}

function sumMapValues(values: ReadonlyMap<string, number>): number {
  let total = 0;
  for (const value of values.values()) total += value;
  return total;
}

function buildComponentStream(
  input: MaterialStream,
  id: string,
  componentMasses: ReadonlyMap<string, number>,
  sourceComponents: readonly MaterialComponent[],
): MaterialStream {
  const massFlowKgPerHour = sumMapValues(componentMasses);
  const components = sourceComponents.map((component) => ({
    ...component,
    massFraction:
      massFlowKgPerHour === 0
        ? 0
        : (componentMasses.get(component.id) ?? 0) / massFlowKgPerHour,
  }));

  return {
    ...input,
    id,
    massFlowKgPerHour,
    components,
  };
}

export function totalMassFlow(streams: readonly MaterialStream[]): number {
  return streams.reduce((sum, stream) => sum + stream.massFlowKgPerHour, 0);
}

export function assertMassBalance(
  input: readonly MaterialStream[],
  output: readonly MaterialStream[],
  toleranceKgPerHour = 1e-9,
): void {
  const inputMass = totalMassFlow(input);
  const outputMass = totalMassFlow(output);

  if (Math.abs(inputMass - outputMass) > toleranceKgPerHour) {
    throw new MultiStreamTransformationError(
      `Mass balance failed: input=${inputMass} kg/h, output=${outputMass} kg/h.`,
    );
  }
}
