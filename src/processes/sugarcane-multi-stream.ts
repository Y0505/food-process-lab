import type { MaterialStream } from "@/domain/material";
import {
  assertMassBalance,
  type MultiStreamTransformation,
  splitStreamByMassFraction,
} from "@/domain/multi-stream";

const getParameter = (parameters: ReadonlyMap<string, number>, id: string): number => {
  const value = parameters.get(id);
  if (value === undefined) throw new Error(`Missing process parameter: ${id}`);
  return value;
};

export const sugarcaneExtractionMultiStream: MultiStreamTransformation = (
  input,
  context,
) => {
  if (input.length !== 1) throw new Error("Sugarcane extraction expects one input stream.");

  const juiceYieldPercent = getParameter(context.parameters, "juice-yield");
  if (juiceYieldPercent < 0 || juiceYieldPercent > 100) {
    throw new Error("Juice yield must be between 0 and 100%.");
  }

  const [juice, bagasse] = splitStreamByMassFraction(
    input[0],
    ["extracted-juice", "bagasse"],
    [juiceYieldPercent / 100, 1 - juiceYieldPercent / 100],
  );

  const outputs: readonly MaterialStream[] = [juice, bagasse];
  assertMassBalance(input, outputs);
  return { outputs };
};
