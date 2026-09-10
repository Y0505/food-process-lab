export type ParameterUnit = "kg/h" | "°C" | "bar" | "%" | "kg";

export interface ProcessParameter {
  readonly id: string;
  readonly name: string;
  readonly unit: ParameterUnit;
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
}

export interface MaterialState {
  readonly materialId: string;
  readonly massFlowKgPerHour: number;
  readonly temperatureC: number;
  readonly moisturePercent?: number;
}

export interface Equipment {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

export interface ProcessStep {
  readonly id: string;
  readonly name: string;
  readonly equipmentId: string;
  readonly description: string;
  readonly parameters: readonly ProcessParameter[];
}

export interface ProcessConnection {
  readonly fromStepId: string;
  readonly toStepId: string;
}

export interface ProcessDefinition {
  readonly id: string;
  readonly name: string;
  readonly steps: readonly ProcessStep[];
  readonly connections: readonly ProcessConnection[];
}

export interface TransformationContext {
  readonly step: ProcessStep;
}

export type MaterialTransformation = (
  input: MaterialState,
  context: TransformationContext,
) => MaterialState;
