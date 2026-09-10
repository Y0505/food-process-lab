import { componentFractionsSum, type MaterialStream } from "./material";

export interface MaterialStreamIssue {
  readonly code:
    | "NEGATIVE_FLOW"
    | "INVALID_TEMPERATURE"
    | "INVALID_PRESSURE"
    | "INVALID_MOISTURE"
    | "INVALID_COMPONENT_FRACTION";
  readonly message: string;
}

export function validateMaterialStream(
  stream: MaterialStream,
): readonly MaterialStreamIssue[] {
  const issues: MaterialStreamIssue[] = [];

  if (!Number.isFinite(stream.massFlowKgPerHour) || stream.massFlowKgPerHour < 0) {
    issues.push({ code: "NEGATIVE_FLOW", message: "Mass flow must be finite and non-negative." });
  }

  if (!Number.isFinite(stream.temperatureC)) {
    issues.push({ code: "INVALID_TEMPERATURE", message: "Temperature must be finite." });
  }

  if (
    stream.pressureBar !== undefined &&
    (!Number.isFinite(stream.pressureBar) || stream.pressureBar < 0)
  ) {
    issues.push({ code: "INVALID_PRESSURE", message: "Pressure must be finite and non-negative." });
  }

  if (
    stream.moisturePercent !== undefined &&
    (!Number.isFinite(stream.moisturePercent) ||
      stream.moisturePercent < 0 ||
      stream.moisturePercent > 100)
  ) {
    issues.push({ code: "INVALID_MOISTURE", message: "Moisture must be between 0 and 100 percent." });
  }

  for (const component of stream.components) {
    if (!Number.isFinite(component.massFraction) || component.massFraction < 0 || component.massFraction > 1) {
      issues.push({
        code: "INVALID_COMPONENT_FRACTION",
        message: `Component fraction must be between 0 and 1: ${component.id}`,
      });
    }
  }

  const sum = componentFractionsSum(stream.components);
  if (stream.components.length > 0 && Math.abs(sum - 1) > 1e-9) {
    issues.push({
      code: "INVALID_COMPONENT_FRACTION",
      message: `Component fractions must sum to 1; received ${sum}.`,
    });
  }

  return issues;
}
