import type { ReactNode } from "react";

const metrics = [
  ["PROCESS PATH", "8 units"],
  ["MATERIAL FLOW", "LIVE"],
  ["VIEW", "PLANT / 3D"],
] as const;

export default function FactoryOverviewFrame({ children }: { children: ReactNode }) {
  return (
    <section className="factory-frame">
      <div className="factory-frame-glow factory-frame-glow-a" />
      <div className="factory-frame-glow factory-frame-glow-b" />
      <div className="factory-frame-grid" />
      <div className="factory-frame-topline">
        <div className="factory-frame-brand">
          <span className="factory-frame-dot" />
          <span>PROCESS FLOOR · LIVE MODEL</span>
        </div>
        <div className="factory-frame-metrics">
          {metrics.map(([label, value]) => (
            <span key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="factory-frame-content">{children}</div>
      <div className="factory-frame-legend" aria-hidden="true">
        <span><i className="legend-flow" /> Material</span>
        <span><i className="legend-utility" /> Utility</span>
        <span><i className="legend-unit" /> Process unit</span>
      </div>
    </section>
  );
}
