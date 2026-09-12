import { ImmersiveSugarPlant } from "@/components/immersive-sugar-plant-v3";

const processMap = [
  ["01", "Cane preparation", "Whole cane", "Prepared billets", "Cut & align"],
  ["02", "Shredding", "Billets", "Opened fiber", "Break cell structure"],
  ["03", "Juice extraction", "Shredded cane", "Juice + bagasse", "Press & separate"],
  ["04", "Clarification", "Raw juice", "Clarified juice", "Settle solids"],
  ["05", "Evaporation", "Clarified juice", "Syrup", "Remove water"],
  ["06", "Crystallization", "Syrup", "Massecuite", "Grow crystals"],
  ["07", "Centrifugation", "Massecuite", "Sugar + molasses", "Separate phases"],
  ["08", "Sugar drying", "Wet sugar", "Dry sugar", "Reduce moisture"],
] as const;

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#02080b", color: "#e9f4f2", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1500, margin: "0 auto", padding: "28px 22px 50px" }}>
        <header style={{ padding: "8px 12px 20px" }}>
          <div style={{ color: "#70d0bd", fontSize: 10, fontWeight: 800, letterSpacing: 2.5 }}>FOODPROCESSLAB · SUGARCANE FACTORY</div>
          <h1 style={{ margin: "8px 0", fontSize: "clamp(32px, 4vw, 54px)", lineHeight: 1, letterSpacing: -2 }}>Walk through the process.</h1>
          <p style={{ maxWidth: 720, margin: 0, color: "rgba(228,240,239,.58)", fontSize: 13, lineHeight: 1.6 }}>
            Select a machine on the production floor. The selected unit becomes the focus, then enter its cutaway to inspect what happens to the material inside.
          </p>
        </header>
        <ImmersiveSugarPlant />
        <div style={{ marginTop: 12, textAlign: "center", color: "rgba(225,239,238,.38)", fontSize: 9, letterSpacing: 1.2 }}>SELECT A UNIT · ENTER CUTAWAY · DRAG TO ORBIT · SCROLL TO ZOOM</div>
        <section style={{ marginTop: 30, padding: 24, border: "1px solid rgba(157,202,201,.1)", borderRadius: 20, background: "rgba(9,24,27,.72)" }}>
          <div style={{ color: "#70d0bd", fontSize: 9, fontWeight: 800, letterSpacing: 2 }}>PROCESS TRACE · 08 STAGES</div>
          <h2 style={{ margin: "8px 0 18px", fontSize: 24 }}>From cane to sugar</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(130px, 1fr))", gap: 8, overflowX: "auto" }}>
            {processMap.map(([no, name, input, output, transform]) => (
              <article key={no} style={{ minWidth: 130, padding: 13, border: "1px solid rgba(157,202,201,.09)", borderRadius: 12, background: "rgba(255,255,255,.025)" }}>
                <div style={{ color: "#70d0bd", fontSize: 8, fontWeight: 800 }}>{no}</div>
                <strong style={{ display: "block", marginTop: 8, fontSize: 11 }}>{name}</strong>
                <div style={{ marginTop: 8, color: "#9ddbd0", fontSize: 8 }}>{transform}</div>
                <div style={{ marginTop: 10, color: "rgba(226,239,238,.42)", fontSize: 8, lineHeight: 1.5 }}>IN · {input}<br />OUT · {output}</div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
