import { describe, expect, it } from "vitest";
import type { ProcessDefinition } from "./process";
import { runMultiStreamProcess } from "./multi-stream-simulation";
import type { MaterialStream } from "./material";

const process: ProcessDefinition = {
  id: "test-process",
  name: "Test process",
  steps: [
    {
      id: "split",
      name: "Split",
      equipmentId: "splitter",
      description: "Splits a stream.",
      parameters: [],
    },
    {
      id: "pass-through",
      name: "Pass-through",
      equipmentId: "unit",
      description: "Keeps streams unchanged.",
      parameters: [],
    },
  ],
  connections: [{ fromStepId: "split", toStepId: "pass-through" }],
};

const feed: MaterialStream = {
  id: "feed",
  materialId: "sugarcane",
  massFlowKgPerHour: 100,
  temperatureC: 25,
  components: [{ id: "water", name: "Water", massFraction: 1 }],
};

describe("multi-stream process runner", () => {
  it("passes outputs from one step into the next", () => {
    const result = runMultiStreamProcess(process, [feed], new Map([
      ["split", (input) => ({
        outputs: [
          { ...input[0], id: "a", massFlowKgPerHour: 60 },
          { ...input[0], id: "b", massFlowKgPerHour: 40 },
        ],
      })],
      ["pass-through", (input) => ({ outputs: input })],
    ]));

    expect(result.steps).toHaveLength(2);
    expect(result.steps[1].input.map((stream) => stream.id)).toEqual(["a", "b"]);
    expect(result.finalStreams).toHaveLength(2);
    expect(result.finalStreams[0].massFlowKgPerHour).toBe(60);
    expect(result.finalStreams[1].massFlowKgPerHour).toBe(40);
  });

  it("rejects an unregistered process step", () => {
    expect(() => runMultiStreamProcess(process, [feed], new Map())).toThrow(
      "No multi-stream transformation registered for step: split",
    );
  });
});
