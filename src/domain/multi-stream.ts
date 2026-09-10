import type { MaterialStream } from "./material";

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
