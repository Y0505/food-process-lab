import type { MaterialStream } from "@/domain/material";
import {
  runMultiStreamProcess,
  type MultiStreamSimulationResult,
} from "@/domain/multi-stream-simulation";
import { sugarcaneToSugar } from "./sugarcane";
import { sugarcaneMultiStreamTransformations } from "./sugarcane-multi-stream-simulation";
import { illustrativeSugarcaneFeed } from "./sugarcane-material";

export interface ProcessVisualizationStage {
  readonly stepId: string;
  readonly name: string;
  readonly equipmentId: string;
  readonly description: string;
  readonly parameters: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly unit: string;
    readonly value: number;
  }>;
  readonly inputStreams: readonly MaterialStream[];
  readonly outputStreams: readonly MaterialStream[];
}

export interface SugarcaneVisualizationModel {
  readonly processId: string;
  readonly stages: readonly ProcessVisualizationStage[];
  readonly simulation: MultiStreamSimulationResult;
}

export function buildSugarcaneVisualizationModel(): SugarcaneVisualizationModel {
  const simulation = runMultiStreamProcess(
    sugarcaneToSugar,
    [illustrativeSugarcaneFeed],
    sugarcaneMultiStreamTransformations,
  );

  const stages = sugarcaneToSugar.steps.map((step, index) => {
    const result = simulation.steps[index];
    if (!result) throw new Error(`Missing simulation result for step: ${step.id}`);

    return {
      stepId: step.id,
      name: step.name,
      equipmentId: step.equipmentId,
      description: step.description,
      parameters: step.parameters,
      inputStreams: result.input,
      outputStreams: result.output,
    };
  });

  return {
    processId: sugarcaneToSugar.id,
    stages,
    simulation,
  };
}
