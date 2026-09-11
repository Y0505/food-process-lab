"use client";

import { useMemo, useState } from "react";
import { getEquipmentInspection, sugarcaneEquipmentInspections } from "@/domain/equipment-inspection";

const stageLabels: Record<string, string> = {
  preparation: "Cane preparation",
  shredding: "Shredding",
  extraction: "Juice extraction",
  clarification: "Clarification",
  evaporation: "Evaporation",
  crystallization: "Crystallization",
  centrifugation: "Centrifugation",
  drying: "Sugar drying",
};

export function EquipmentInspectionRail() {
  const [stageId, setStageId] = useState(sugarcaneEquipmentInspections[0].stageId);
  const definition = useMemo(() => getEquipmentInspection(stageId)!, [stageId]);

  return (
    <section className="inspection-rail" aria-label="Equipment inspection blueprint">
      <div className="inspection-rail-head">
        <div>
          <span className="inspection-kicker">EQUIPMENT INSPECTION · CUTAWAY BLUEPRINT</span>
          <h2>What is actually happening inside the machine?</h2>
        </div>
        <p>Each unit exposes its working parts and material path. The blueprint is derived from the same inspection model used by the 3D experience.</p>
      </div>

      <div className="inspection-tabs" role="tablist" aria-label="Process units">
        {sugarcaneEquipmentInspections.map((item, index) => (
          <button
            key={item.stageId}
            type="button"
            role="tab"
            aria-selected={item.stageId === stageId}
            className={item.stageId === stageId ? "active" : ""}
            onClick={() => setStageId(item.stageId)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {stageLabels[item.stageId]}
          </button>
        ))}
      </div>

      <div className="inspection-body">
        <div className="inspection-machine-card">
          <div className="inspection-machine-glow" />
          <span className="inspection-kind">{definition.visualKind.toUpperCase()} CUTAWAY</span>
          <strong>{stageLabels[definition.stageId]}</strong>
          <small>{definition.cutawayPurpose}</small>
          <div className="inspection-schematic" aria-hidden="true">
            {definition.components.map((component, index) => (
              <div className="inspection-node" key={component.id} style={{ "--node": index } as React.CSSProperties}>
                <i />
                <span>{component.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="inspection-details">
          <div className="inspection-detail-block">
            <span>WORKING COMPONENTS</span>
            <div className="component-list">
              {definition.components.map((component) => (
                <div key={component.id}>
                  <b>{component.label}</b>
                  <small>{component.role}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="inspection-detail-block">
            <span>MATERIAL PATH</span>
            <div className="flow-list">
              {definition.flows.map((flow) => (
                <div key={flow.label} className="flow-row">
                  <b>{flow.label}</b>
                  <span>{flow.from}</span>
                  <i>→</i>
                  <span>{flow.to}</span>
                  <small>{flow.visual}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
