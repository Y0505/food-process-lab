import type { MaterialStream } from "@/domain/material";
import {
  assertMassBalance,
  type MultiStreamTransformation,
  splitStreamByComponentRecovery,
} from "@/domain/multi-stream";

const getParameter = (parameters: ReadonlyMap<string, number>, id: string): number => {
  const value = parameters.get(id);
  if (value === undefined) throw new Error(`Missing process parameter: ${id}`);
  return value;
};

/**
 * Educational extraction model. Component recovery values are explicit model
 * inputs rather than claims about industrial extraction performance.
 */
export const sugarcaneExtractionMultiStream: MultiStreamTransformation = (
  input,
  context,
) => {
  if (input.length !== 1) throw new Error("Sugarcane extraction expects one input stream.");

  const juiceYieldPercent = getParameter(context.parameters, "juice-yield");
  if (juiceYieldPercent < 0 || juiceYieldPercent > 100) {
    throw new Error("Juice yield must be between 0 and 100%.");
  }

  const waterRecoveryPercent = getParameter(context.parameters, "water-to-juice-percent");
  const sucroseRecoveryPercent = getParameter(context.parameters, "sucrose-to-juice-percent");
  const fiberRecoveryPercent = getParameter(context.parameters, "fiber-to-juice-percent");
  const otherSolidsRecoveryPercent = getParameter(
    context.parameters,
    "other-solids-to-juice-percent",
  );

  const recovery = new Map([
    ["water", waterRecoveryPercent / 100],
    ["sucrose", sucroseRecoveryPercent / 100],
    ["fiber", fiberRecoveryPercent / 100],
    ["other-solids", otherSolidsRecoveryPercent / 100],
  ]);

  // The yield parameter controls total juice flow; component recoveries are
  // independently configurable so the model does not imply identical
  // composition in juice and bagasse. The default configuration is validated
  // against this yield when the process definition supplies it.
  const [juice, bagasse] = splitStreamByComponentRecovery(
    input[0],
    ["extracted-juice", "bagasse"],
    recovery,
  );

  const expectedJuiceMass = input[0].massFlowKgPerHour * (juiceYieldPercent / 100);
  if (Math.abs(juice.massFlowKgPerHour - expectedJuiceMass) > 1e-9) {
    throw new Error(
      `Component recoveries produce ${juice.massFlowKgPerHour} kg/h juice; expected ${expectedJuiceMass} kg/h from juice-yield.`,
    );
  }

  const outputs: readonly MaterialStream[] = [juice, bagasse];
  assertMassBalance(input, outputs);
  return { outputs };
};
