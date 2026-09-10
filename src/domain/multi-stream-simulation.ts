import type { MaterialStream } from "./material";
import type { ProcessDefinition, ProcessStep } from "./process";
import { validateMaterialStream } from "./material-validation";
import type { MultiStreamTransformation } from "./multi-stream";

export interface MultiStreamSimulationStepResult {
  readonly stepId: string;
  readonly input: readonly MaterialStream[];
  readonly output: readonly MaterialStream[];
}

export interface MultiStreamSimulationResult {
  readonly finalStreams: readonly MaterialStream[];
  readonly steps: readonly MultiStreamSimulationStepResult[];
}

export type MultiStreamTransformationRegistry = ReadonlyMap<
  string,
  MultiStreamTransformation
>;

export function runMultiStreamProcess(
  process: ProcessDefinition,
  initialStreams: readonly MaterialStream[],
  transformations: MultiStreamTransformationRegistry,
): MultiStreamSimulationResult {
  validateStreams(initialStreams, "Initial stream");

  let streams = initialStreams;
  const steps: MultiStreamSimulationStepResult[] = [];

  for (const step of process.steps) {
    const transformation = transformations.get(step.id);
    if (!transformation) {
      throw new Error(`No multi-stream transformation registered for step: ${step.id}`);
    }

    const input = streams;
    const parameters = new Map(step.parameters.map((parameter) => [parameter.id, parameter.value]));
    const result = transformation(input, { stepId: step.id, parameters });

    validateStreams(result.outputs, step.name);
    streams = result.outputs;
    steps.push({ stepId: step.id, input, output: result.outputs });
  }

  return { finalStreams: streams, steps };
}

function validateStreams(streams: readonly MaterialStream[], label: string): void {
  for (const stream of streams) {
    const issues = validateMaterialStream(stream);
    if (issues.length > 0) {
      throw new Error(`${label} ${stream.id}: ${issues[0].message}`);
    }
  }
}

export function stepById(
  process: ProcessDefinition,
  stepId: string,
): ProcessStep {
  const step = process.steps.find((candidate) => candidate.id === stepId);
  if (!step) throw new Error(`Unknown process step: ${stepId}`);
  return step;
}
