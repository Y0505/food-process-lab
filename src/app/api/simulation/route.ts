import { NextResponse } from "next/server";
import type { MaterialState } from "@/domain/process";
import { runProcess } from "@/domain/simulation";
import { sugarcaneToSugar } from "@/processes/sugarcane";
import { sugarcaneTransformations } from "@/processes/sugarcane-simulation";

const initialState: MaterialState = {
  materialId: "sugarcane-feed",
  massFlowKgPerHour: 1000,
  temperatureC: 25,
  moisturePercent: 70,
};

export function GET() {
  const result = runProcess(
    sugarcaneToSugar,
    initialState,
    sugarcaneTransformations,
  );

  return NextResponse.json({
    processId: sugarcaneToSugar.id,
    input: initialState,
    result,
  });
}
