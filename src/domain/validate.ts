import type { MaterialState, ProcessDefinition } from "./process";

export interface ValidationIssue {
  readonly code: "NEGATIVE_FLOW" | "INVALID_TEMPERATURE" | "INVALID_MOISTURE";
  readonly message: string;
}

export function validateMaterialState(state: MaterialState): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Number.isFinite(state.massFlowKgPerHour) || state.massFlowKgPerHour < 0) {
    issues.push({
      code: "NEGATIVE_FLOW",
      message: "Mass flow must be a finite non-negative value.",
    });
  }

  if (!Number.isFinite(state.temperatureC)) {
    issues.push({
      code: "INVALID_TEMPERATURE",
      message: "Temperature must be a finite value.",
    });
  }

  if (
    state.moisturePercent !== undefined &&
    (!Number.isFinite(state.moisturePercent) ||
      state.moisturePercent < 0 ||
      state.moisturePercent > 100)
  ) {
    issues.push({
      code: "INVALID_MOISTURE",
      message: "Moisture must be between 0 and 100 percent.",
    });
  }

  return issues;
}

export function validateProcessDefinition(
  process: ProcessDefinition,
): readonly string[] {
  const issues: string[] = [];
  const stepIds = new Set(process.steps.map((step) => step.id));

  for (const connection of process.connections) {
    if (!stepIds.has(connection.fromStepId)) {
      issues.push(`Connection references unknown source step: ${connection.fromStepId}`);
    }
    if (!stepIds.has(connection.toStepId)) {
      issues.push(`Connection references unknown target step: ${connection.toStepId}`);
    }
  }

  return issues;
}
