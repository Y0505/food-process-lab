import type { MaterialState, ProcessDefinition, ProcessStep } from "./process";
import { applyTransformation } from "./transformations";
import { validateMaterialState } from "./validate";

export interface SimulationStepResult {
  readonly stepId: string;
  readonly input: MaterialState;
  readonly output: MaterialState;
}

export interface SimulationResult {
  readonly finalState: MaterialState;
  readonly steps: readonly SimulationStepResult[];
}

export type TransformationRegistry = ReadonlyMap<
  string,
  (input: MaterialState, context: { readonly step: ProcessStep }) => MaterialState
>;

export function runProcess(
  process: ProcessDefinition,
  initialState: MaterialState,
  transformations: TransformationRegistry,
): SimulationResult {
  const initialIssues = validateMaterialState(initialState);
  if (initialIssues.length > 0) {
    throw new Error(initialIssues[0].message);
  }

  let state = initialState;
  const steps: SimulationStepResult[] = [];

  for (const step of process.steps) {
    const transformation = transformations.get(step.id);
    if (!transformation) {
      throw new Error(`No transformation registered for step: ${step.id}`);
    }

    const input = state;
    const output = applyTransformation(transformation, input, { step });
    const issues = validateMaterialState(output);

    if (issues.length > 0) {
      throw new Error(`${step.name}: ${issues[0].message}`);
    }

    state = output;
    steps.push({ stepId: step.id, input, output });
  }

  return { finalState: state, steps };
}
