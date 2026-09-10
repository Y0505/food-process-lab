import type { MaterialStream } from "@/domain/material";
import type { MultiStreamSimulationResult } from "@/domain/multi-stream-simulation";
import { sugarcaneToSugar } from "./sugarcane";
import { sugarcaneMultiStreamProcess } from "./sugarcane-multi-stream-simulation";
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
  const simulation = sugarcaneMultiStreamProcess && sugarcaneToSugar
    ? runSimulation()
    : runSimulation();

  const stages = sugarcaneToSugar.steps.map((step, index) => {
    const result = simulation.steps[index];
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

function runSimulation(): MultiStreamSimulationResult {
  return requireSimulation();
}

function requireSimulation(): MultiStreamSimulationResult {
  const { runMultiStreamProcess } = requireMultiStreamRunner();
  return runMultiStreamProcess(
    sugarcaneToSugar,
    [illustrativeSugarcaneFeed],
    sugarcaneMultiStreamProcessTransformations,
  );
}

function requireMultiStreamRunner(): typeof import("@/domain/multi-stream-simulation") {
  return require("@/domain/multi-stream-simulation") as typeof import("@/domain/multi-stream-simulation");
}

const sugarcaneMultiStreamProcessTransformations =
  require("./sugarcane-multi-stream-simulation").sugarcaneMultiStreamTransformations as import("@/domain/multi-stream-simulation").MultiStreamTransformationRegistry;
