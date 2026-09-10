export interface MaterialComponent {
  readonly id: string;
  readonly name: string;
  /** Mass fraction in the material stream, from 0 to 1. */
  readonly massFraction: number;
}

export interface MaterialStream {
  readonly id: string;
  readonly materialId: string;
  readonly massFlowKgPerHour: number;
  readonly temperatureC: number;
  readonly pressureBar?: number;
  readonly moisturePercent?: number;
  readonly components: readonly MaterialComponent[];
}

export function componentMassFlow(
  stream: MaterialStream,
  componentId: string,
): number {
  const component = stream.components.find((item) => item.id === componentId);
  if (!component) return 0;
  return stream.massFlowKgPerHour * component.massFraction;
}

export function componentFractionsSum(
  components: readonly MaterialComponent[],
): number {
  return components.reduce((sum, component) => sum + component.massFraction, 0);
}
