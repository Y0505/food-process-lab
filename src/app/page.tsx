import ImmersiveSugarPlant from "@/components/immersive-sugar-plant";

export default function HomePage() {
  return (
    <main className="food-process-app">
      <style dangerouslySetInnerHTML={{ __html: `
        :root{background:#02080b;color:#e9f4f2}
        *{box-sizing:border-box}
        html,body{margin:0;min-height:100%;background:#02080b}
        body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        button{font:inherit}
        .food-process-app{min-height:100vh;background:radial-gradient(circle at 50% -10%,rgba(65,154,145,.13),transparent 32%),#02080b;overflow:hidden}
        .immersive-plant{position:relative;max-width:1500px;margin:0 auto;padding:28px 22px 38px}
        .immersive-plant-top{display:flex;justify-content:space-between;align-items:flex-end;gap:28px;padding:8px 12px 18px}
        .eyebrow{display:block;color:#70d0bd;font-size:9px;font-weight:800;letter-spacing:2px}
        .immersive-plant h1{margin:8px 0 7px;font-size:clamp(30px,4vw,52px);letter-spacing:-1.9px;line-height:1}
        .immersive-plant-top p{max-width:690px;margin:0;color:rgba(228,240,239,.54);font-size:13px;line-height:1.55}
        .plant-status{display:flex;align-items:center;gap:9px;white-space:nowrap;color:rgba(225,239,237,.46);font-size:8px;letter-spacing:1.3px}
        .plant-status i{width:7px;height:7px;border-radius:50%;background:#6ed1bc;box-shadow:0 0 15px rgba(110,209,188,.9);animation:plantPulse 1.8s ease-in-out infinite}
        .plant-status b{margin-left:9px;color:#a3dcd3;font-size:8px}
        .plant-viewport{position:relative;height:min(74vh,760px);min-height:560px;border:1px solid rgba(157,202,201,.13);border-radius:26px;background:#030a0d;overflow:hidden;box-shadow:0 35px 100px rgba(0,0,0,.42),inset 0 0 80px rgba(40,117,111,.08)}
        .plant-viewport canvas{display:block;width:100%;height:100%;touch-action:none}
        .plant-hint{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:10px;color:rgba(225,239,238,.3);font-size:8px;letter-spacing:1.2px}
        .plant-hint b{color:#68cdb9;font-size:12px}
        .plant-intro-card{position:absolute;left:42px;bottom:88px;width:310px;padding:16px 18px;border:1px solid rgba(112,208,190,.22);border-radius:14px;background:rgba(3,13,16,.82);backdrop-filter:blur(13px);box-shadow:0 18px 50px rgba(0,0,0,.28);pointer-events:none}
        .plant-intro-card span{display:block;color:#70d0bd;font-size:8px;font-weight:800;letter-spacing:1.6px}.plant-intro-card strong{display:block;margin-top:7px;font-size:18px}.plant-intro-card p{margin:6px 0 0;color:rgba(226,239,238,.48);font-size:10px;line-height:1.5}
        .unit-panel{position:absolute;right:42px;bottom:88px;width:min(420px,calc(100% - 84px));padding:18px 19px;border:1px solid rgba(112,208,190,.34);border-radius:16px;background:rgba(3,13,16,.9);backdrop-filter:blur(16px);box-shadow:0 24px 70px rgba(0,0,0,.42);z-index:5}
        .unit-panel-kicker{color:#70d0bd;font-size:8px;font-weight:800;letter-spacing:1.5px}.unit-panel h2{margin:6px 0 5px;font-size:23px}.unit-panel p{margin:0;color:rgba(226,239,238,.5);font-size:10px;line-height:1.55}
        .unit-flow{display:grid;grid-template-columns:1fr 22px 1fr;align-items:center;gap:8px;margin:14px 0}.unit-flow div{min-width:0;padding:9px;border:1px solid rgba(157,202,201,.1);border-radius:9px;background:rgba(255,255,255,.025)}.unit-flow small{display:block;color:rgba(225,239,238,.32);font-size:7px;letter-spacing:1px}.unit-flow strong{display:block;margin-top:4px;color:rgba(235,246,244,.78);font-size:9px;line-height:1.3}.unit-flow>span{text-align:center;color:#6fd0bc}
        .unit-panel button{width:100%;border:1px solid rgba(112,208,190,.55);border-radius:9px;padding:11px 13px;background:#11433f;color:#eafff9;cursor:pointer;font-size:9px;font-weight:800;letter-spacing:.7px}.unit-panel button:hover{background:#175951}.unit-panel button.secondary{background:rgba(255,255,255,.035);border-color:rgba(157,202,201,.2)}
        .inside-badge{position:absolute;left:42px;top:104px;padding:12px 15px;border:1px solid rgba(112,208,190,.27);border-radius:11px;background:rgba(3,13,16,.72);backdrop-filter:blur(10px);pointer-events:none;z-index:4}.inside-badge span{display:block;color:#70d0bd;font-size:7px;letter-spacing:1.5px;font-weight:800}.inside-badge strong{display:block;margin-top:4px;font-size:15px}.inside-badge small{display:block;margin-top:4px;color:rgba(225,239,238,.38);font-size:8px}
        @keyframes plantPulse{0%,100%{opacity:.45;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        @media(max-width:850px){.immersive-plant-top{align-items:flex-start;flex-direction:column}.plant-status{margin-top:0}.plant-viewport{height:680px;min-height:0}.plant-intro-card{left:18px;bottom:72px;width:290px}.unit-panel{right:18px;bottom:72px;width:calc(100% - 36px)}.inside-badge{left:18px;top:92px}}
        @media(max-width:560px){.immersive-plant{padding:18px 10px 28px}.immersive-plant-top{padding:6px 7px 14px}.immersive-plant h1{font-size:34px}.immersive-plant-top p{font-size:11px}.plant-viewport{height:590px;border-radius:19px}.plant-hint{gap:6px;font-size:7px;letter-spacing:.7px}.plant-hint b{font-size:10px}.plant-intro-card{display:none}.unit-panel{right:10px;bottom:56px;width:calc(100% - 20px);padding:14px}.unit-panel h2{font-size:19px}.unit-flow{margin:10px 0}.inside-badge{left:10px;top:72px;max-width:calc(100% - 20px)}}
      ` }} />
      <ImmersiveSugarPlant />
    </main>
  );
}
