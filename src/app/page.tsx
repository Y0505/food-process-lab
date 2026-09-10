import ProcessExplorer from "@/components/process-explorer";

export default function HomePage() {
  return (
    <main>
      <header style={{ padding: "30px 28px 20px", maxWidth: 1040, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", opacity: 0.58 }}>
          FoodProcessLab · Interactive Process Lab
        </p>
        <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: -1.8 }}>
          Sugarcane → Sugar
        </h1>
        <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.65, opacity: 0.68, fontSize: 15 }}>
          Explore the process as an engineer: select a unit, enter the equipment, and inspect the mechanism and material transformation inside.
        </p>
      </header>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <ProcessExplorer />
      </div>
    </main>
  );
}
