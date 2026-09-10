import FactoryOverviewFrame from "@/components/factory-overview-frame";
import ProcessLineOverview from "@/components/process-line-overview";
import ProcessExplorer from "@/components/process-explorer";
import ExtractionMillV2 from "@/components/extraction-mill-v2";
import ProcessExplorerStyles from "@/components/process-explorer-styles";

export default function HomePage() {
  return (
    <main>
      <ProcessExplorerStyles />
      <style dangerouslySetInnerHTML={{ __html: `
        .factory-frame{position:relative;margin:0 0 40px;padding:10px 10px 14px;border:1px solid rgba(169,204,209,.13);border-radius:30px;background:radial-gradient(circle at 50% 8%,rgba(74,163,157,.1),transparent 34%),linear-gradient(180deg,#061116 0%,#03090d 100%);overflow:hidden;box-shadow:0 35px 100px rgba(0,0,0,.32)}
        .factory-frame-grid{position:absolute;inset:0;opacity:.18;background-image:linear-gradient(rgba(117,185,184,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(117,185,184,.08) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(180deg,#000,transparent 76%);pointer-events:none}
        .factory-frame-glow{position:absolute;width:360px;height:360px;border-radius:50%;filter:blur(70px);opacity:.1;pointer-events:none}.factory-frame-glow-a{top:-180px;left:16%}.factory-frame-glow-b{top:30%;right:-220px}
        .factory-frame-topline{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:10px 16px 12px;color:rgba(221,237,239,.5);font-size:8px;letter-spacing:1.5px}
        .factory-frame-brand{display:flex;align-items:center;gap:8px;font-weight:700}.factory-frame-dot{width:6px;height:6px;border-radius:50%;background:#70cdbd;box-shadow:0 0 12px rgba(112,205,189,.8);animation:factoryPulse 1.8s ease-in-out infinite}.factory-frame-metrics{display:flex;gap:18px}.factory-frame-metrics span{display:flex;gap:7px;align-items:baseline}.factory-frame-metrics small{font-size:7px;letter-spacing:1.1px;opacity:.55}.factory-frame-metrics strong{font-size:8px;color:#9edbd3;letter-spacing:1px}
        .factory-frame-content{position:relative;z-index:1}.factory-frame-content .process-line-overview{margin:0;border-color:rgba(169,204,209,.1);box-shadow:none;background:rgba(4,13,17,.52)}
        .factory-frame-legend{position:relative;z-index:2;display:flex;justify-content:flex-end;gap:18px;padding:9px 12px 0;color:rgba(220,234,236,.38);font-size:8px;letter-spacing:.6px}.factory-frame-legend span{display:flex;align-items:center;gap:6px}.factory-frame-legend i{display:inline-block;width:14px;height:3px;border-radius:3px}.legend-flow{background:#4fc09a;box-shadow:0 0 8px rgba(79,192,154,.35)}.legend-utility{background:#71898d}.legend-unit{height:7px!important;width:7px!important;border:1px solid #8ba4a7;border-radius:2px!important}
        .process-line-heading{background:linear-gradient(90deg,rgba(69,150,148,.09),rgba(69,150,148,.02) 42%,transparent 72%)}
        .process-line-overview{position:relative}
        .process-line-canvas{height:500px;background:radial-gradient(circle at 50% 48%,rgba(65,146,151,.17),transparent 43%),linear-gradient(180deg,rgba(255,255,255,.015),transparent);cursor:default}
        .process-line-canvas canvas{display:block;width:100%;height:100%}
        .process-line-stage.active{box-shadow:inset 0 1px 0 rgba(145,231,210,.1),0 8px 25px rgba(52,148,137,.08)}
        .process-line-selected{position:absolute;left:28px;right:28px;bottom:82px;z-index:5;display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:end;gap:22px;padding:17px 19px;border:1px solid rgba(116,213,193,.28);border-radius:15px;background:rgba(4,14,18,.88);box-shadow:0 16px 45px rgba(0,0,0,.32);backdrop-filter:blur(12px);pointer-events:auto}
        .process-line-selected>div:first-child{min-width:0}.process-line-selected>div:first-child>span{display:block;color:#70cdbd;font-size:8px;font-weight:800;letter-spacing:1.4px}.process-line-selected>div:first-child>strong{display:block;margin-top:5px;color:rgba(224,240,241,.42);font-size:8px;letter-spacing:1px}.process-line-selected h3{margin:2px 0 4px;font-size:18px}.process-line-selected p{margin:0;color:rgba(232,240,242,.58);font-size:11px;line-height:1.45;max-width:580px}
        .selected-flow{display:flex;flex-direction:column;gap:6px;min-width:175px}.selected-flow span{font-size:8px;letter-spacing:.6px;color:rgba(218,234,235,.5)}
        .process-line-selected .enter-equipment{white-space:nowrap;border:1px solid rgba(116,213,193,.55);border-radius:10px;background:#123b3b;color:#eafffa;padding:11px 16px;cursor:pointer;font-weight:700}.process-line-selected .enter-equipment:hover{background:#17504e}
        .extraction-mill-v2{margin:0 0 40px;border:1px solid rgba(169,204,209,.12);border-radius:24px;background:linear-gradient(180deg,rgba(7,17,21,.98),rgba(3,10,13,.98));overflow:hidden;box-shadow:0 25px 70px rgba(0,0,0,.24)}
        .extraction-mill-v2-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,420px);gap:30px;padding:22px 24px 16px;border-bottom:1px solid rgba(169,204,209,.08)}
        .extraction-mill-v2-heading span{display:block;color:#70cdbd;font-size:8px;font-weight:800;letter-spacing:1.5px}.extraction-mill-v2-heading h2{margin:5px 0 0;font-size:24px}.extraction-mill-v2-heading p{margin:0;color:rgba(232,240,242,.56);font-size:11px;line-height:1.55;align-self:end}
        .extraction-mill-v2-canvas{height:590px;background:radial-gradient(circle at 50% 44%,rgba(69,150,148,.15),transparent 48%),linear-gradient(180deg,rgba(255,255,255,.012),transparent)}.extraction-mill-v2-canvas canvas{display:block;width:100%;height:100%}
        .extraction-mill-v2-legend{display:flex;flex-wrap:wrap;gap:16px;padding:11px 20px 15px;color:rgba(220,234,236,.48);font-size:9px;letter-spacing:.5px}.extraction-mill-v2-legend span{display:flex;align-items:center;gap:6px}.extraction-mill-v2-legend i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#8fa15a;box-shadow:0 0 7px rgba(143,161,90,.35)}.extraction-mill-v2-legend span:nth-child(2) i{background:#7d8a8d}.extraction-mill-v2-legend span:nth-child(3) i{background:#5c963f}.extraction-mill-v2-legend span:nth-child(4) i{background:#987149}
        @keyframes factoryPulse{0%,100%{opacity:.5;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
        @media(max-width:900px){.process-line-selected{left:18px;right:18px;bottom:76px;grid-template-columns:1fr auto;gap:12px}.selected-flow{display:none}.process-line-selected p{max-width:none}.extraction-mill-v2-heading{grid-template-columns:1fr}}
        @media(max-width:760px){.factory-frame-topline{align-items:flex-start;flex-direction:column}.factory-frame-metrics{width:100%;justify-content:space-between;gap:8px}.factory-frame-legend{justify-content:flex-start;flex-wrap:wrap}.process-line-canvas{height:420px}.extraction-mill-v2-canvas{height:470px}}
        @media(max-width:600px){.process-line-selected{left:10px;right:10px;bottom:68px;grid-template-columns:1fr}.process-line-selected .enter-equipment{justify-self:start}.process-line-selected h3{font-size:16px}.extraction-mill-v2-heading{padding:18px 16px 14px}.extraction-mill-v2-canvas{height:390px}}
      ` }} />
      <header style={{ padding: "30px 28px 20px", maxWidth: 1040, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", opacity: 0.58 }}>FoodProcessLab · Interactive Process Lab</p>
        <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: -1.8 }}>Sugarcane → Sugar</h1>
        <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.65, opacity: 0.68, fontSize: 15 }}>Start with the complete factory, select a unit, understand its role, then travel inside that unit to see the transformation.</p>
      </header>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FactoryOverviewFrame>
          <ProcessLineOverview />
        </FactoryOverviewFrame>
        <ExtractionMillV2 />
        <ProcessExplorer />
      </div>
    </main>
  );
}
