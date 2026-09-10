import ProcessLineOverview from "@/components/process-line-overview";
import ProcessExplorer from "@/components/process-explorer";
import ProcessExplorerStyles from "@/components/process-explorer-styles";

export default function HomePage() {
  return (
    <main>
      <ProcessExplorerStyles />
      <style dangerouslySetInnerHTML={{ __html: `
        .process-line-overview{margin:0 0 30px;border:1px solid rgba(169,204,209,.16);border-radius:24px;background:#050d11;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.25)}
        .process-line-heading{display:flex;justify-content:space-between;gap:30px;align-items:flex-end;padding:24px 26px;border-bottom:1px solid rgba(181,218,223,.1)}
        .process-line-heading span{font-size:10px;letter-spacing:1.8px;color:#82c2c8}.process-line-heading h2{margin:7px 0 0;font-size:25px}.process-line-heading p{max-width:440px;margin:0;color:rgba(232,240,242,.54);font-size:12px;line-height:1.65}
        .process-line-canvas{height:430px;background:radial-gradient(circle at 50% 50%,rgba(65,146,151,.12),transparent 52%)}.process-line-canvas canvas{width:100%;height:100%;display:block}
        .process-line-stages{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;padding:10px;border-top:1px solid rgba(181,218,223,.08);background:#071216}.process-line-stage{min-height:78px;padding:10px;border:1px solid transparent;border-radius:10px;background:rgba(255,255,255,.02);color:#c9d9db;text-align:left;cursor:pointer}.process-line-stage:hover,.process-line-stage.active{border-color:rgba(116,213,193,.45);background:rgba(66,151,148,.12)}.process-line-stage strong{display:block;color:#70cdbd;font-size:9px}.process-line-stage span{display:block;margin:6px 0 3px;font-size:10px;font-weight:700}.process-line-stage small{display:block;color:rgba(232,240,242,.38);font-size:8px;line-height:1.35}
        .process-line-selected{display:flex;align-items:center;gap:15px;padding:13px 18px;color:rgba(232,240,242,.5);font-size:10px}.process-line-selected span{font-size:8px;letter-spacing:1.2px;color:#72c9c2}.process-line-selected strong{color:#dceced}.process-line-selected p{margin:0}
        @media(max-width:900px){.process-line-heading{align-items:flex-start;flex-direction:column}.process-line-stages{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:600px){.process-line-canvas{height:330px}.process-line-stages{grid-template-columns:repeat(2,1fr)}.process-line-heading{padding:18px}.process-line-selected{align-items:flex-start;flex-direction:column;gap:5px}}
      ` }} />
      <header style={{ padding: "30px 28px 20px", maxWidth: 1040, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", opacity: 0.58 }}>
          FoodProcessLab · Interactive Process Lab
        </p>
        <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: -1.8 }}>
          Sugarcane → Sugar
        </h1>
        <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.65, opacity: 0.68, fontSize: 15 }}>
          Explore the process as an engineer: first understand the complete production line, then enter any unit to inspect the mechanism and material transformation inside.
        </p>
      </header>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <ProcessLineOverview />
        <ProcessExplorer />
      </div>
    </main>
  );
}
