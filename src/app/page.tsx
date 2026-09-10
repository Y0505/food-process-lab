import ProcessLineOverview from "@/components/process-line-overview";
import ProcessExplorer from "@/components/process-explorer";
import ProcessExplorerStyles from "@/components/process-explorer-styles";

export default function HomePage() {
  return (
    <main>
      <ProcessExplorerStyles />
      <style dangerouslySetInnerHTML={{ __html: `
        .process-line-overview{margin:0 0 34px;border:1px solid rgba(169,204,209,.16);border-radius:26px;background:linear-gradient(180deg,#071216 0%,#050c10 100%);overflow:hidden;box-shadow:0 28px 90px rgba(0,0,0,.28)}
        .process-line-heading{display:flex;justify-content:space-between;gap:34px;align-items:flex-end;padding:27px 28px 24px;border-bottom:1px solid rgba(181,218,223,.1);background:linear-gradient(90deg,rgba(69,150,148,.07),transparent 48%)}
        .process-line-heading span{font-size:9px;letter-spacing:2px;color:#82c2c8;font-weight:700}.process-line-heading h2{margin:8px 0 0;font-size:27px;letter-spacing:-.7px}.process-line-heading p{max-width:470px;margin:0;color:rgba(232,240,242,.56);font-size:12px;line-height:1.75}
        .process-line-canvas{height:470px;background:radial-gradient(circle at 50% 46%,rgba(65,146,151,.15),transparent 48%),linear-gradient(180deg,rgba(255,255,255,.01),transparent)}.process-line-canvas canvas{width:100%;height:100%;display:block}
        .process-line-stages{display:grid;grid-template-columns:repeat(8,1fr);gap:7px;padding:11px;border-top:1px solid rgba(181,218,223,.08);background:#071216}
        .process-line-stage{position:relative;min-height:82px;padding:11px;border:1px solid rgba(255,255,255,.04);border-radius:11px;background:rgba(255,255,255,.018);color:#c9d9db;text-align:left;cursor:pointer;transition:transform .18s ease,border-color .18s ease,background .18s ease}.process-line-stage:hover{transform:translateY(-2px);border-color:rgba(116,213,193,.28);background:rgba(66,151,148,.07)}.process-line-stage.active{border-color:rgba(116,213,193,.58);background:linear-gradient(180deg,rgba(66,151,148,.16),rgba(66,151,148,.06));box-shadow:inset 0 1px 0 rgba(145,231,210,.1)}.process-line-stage.active:after{content:"";position:absolute;left:11px;right:11px;bottom:6px;height:2px;border-radius:2px;background:rgba(112,205,189,.72)}.process-line-stage strong{display:block;color:#70cdbd;font-size:9px;letter-spacing:1px}.process-line-stage span{display:block;margin:7px 0 4px;font-size:9px;font-weight:800;letter-spacing:.15px}.process-line-stage small{display:block;color:rgba(232,240,242,.4);font-size:8px;line-height:1.35}
        .process-line-selected{display:flex;align-items:center;gap:15px;padding:15px 19px;color:rgba(232,240,242,.5);font-size:10px;border-top:1px solid rgba(181,218,223,.06)}.process-line-selected span{font-size:8px;letter-spacing:1.4px;color:#72c9c2}.process-line-selected strong{color:#dceced;letter-spacing:.4px}.process-line-selected p{margin:0;line-height:1.5}
        @media(max-width:1050px){.process-line-stages{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:900px){.process-line-heading{align-items:flex-start;flex-direction:column}.process-line-canvas{height:410px}}
        @media(max-width:600px){.process-line-canvas{height:330px}.process-line-stages{grid-template-columns:repeat(2,1fr)}.process-line-heading{padding:19px}.process-line-heading h2{font-size:22px}.process-line-selected{align-items:flex-start;flex-direction:column;gap:5px}}
      ` }} />
      <header style={{ padding: "30px 28px 20px", maxWidth: 1040, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", opacity: 0.58 }}>
          FoodProcessLab · Interactive Process Lab
        </p>
        <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: -1.8 }}>
          Sugarcane → Sugar
        </h1>
        <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.65, opacity: 0.68, fontSize: 15 }}>
          Start with the complete factory, follow the material path, then travel into an individual unit to understand the transformation happening inside.
        </p>
      </header>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <ProcessLineOverview />
        <ProcessExplorer />
      </div>
    </main>
  );
}
