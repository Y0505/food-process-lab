"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { getEquipmentInspection } from "@/domain/equipment-inspection";

const STAGES = [
  { id: "preparation", no: "01", name: "Cane Preparation", short: "Cut & align", input: "Whole cane", output: "Prepared billets", x: -14 },
  { id: "shredding", no: "02", name: "Shredding", short: "Open fiber", input: "Billets", output: "Opened fiber", x: -10 },
  { id: "extraction", no: "03", name: "Juice Extraction", short: "Press & separate", input: "Shredded cane", output: "Juice + bagasse", x: -6 },
  { id: "clarification", no: "04", name: "Juice Clarification", short: "Settle solids", input: "Raw juice", output: "Clarified juice", x: -2 },
  { id: "evaporation", no: "05", name: "Evaporation", short: "Remove water", input: "Clarified juice", output: "Syrup", x: 2 },
  { id: "crystallization", no: "06", name: "Crystallization", short: "Grow crystals", input: "Syrup", output: "Massecuite", x: 6 },
  { id: "centrifugation", no: "07", name: "Centrifugation", short: "Separate phases", input: "Massecuite", output: "Sugar + molasses", x: 10 },
  { id: "drying", no: "08", name: "Sugar Drying", short: "Reduce moisture", input: "Wet sugar", output: "Dry sugar", x: 14 },
] as const;

type Stage = (typeof STAGES)[number];

const C = { steel: 0x52666a, steel2: 0x829598, dark: 0x111a1d, frame: 0x29383b, brass: 0xb38a46, cane: 0x9baf5a, fiber: 0xc5b36c, juice: 0x8b6331, syrup: 0x7c4b20, sugar: 0xf0d99b, red: 0x8f4b3f, glass: 0x72b8bd, glow: 0x6de1c5 };

function mat(color: number, metal = 0.65, rough = 0.36) { return new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough }); }
function box(scene: THREE.Group, name: string, size: [number, number, number], pos: [number, number, number], material: THREE.Material, rot?: [number, number, number]) { const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material); m.name = name; m.position.set(...pos); if (rot) m.rotation.set(...rot); scene.add(m); return m; }
function cyl(scene: THREE.Group, name: string, r: number, h: number, pos: [number, number, number], material: THREE.Material, rot?: [number, number, number], radial = 20) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radial), material); m.name = name; m.position.set(...pos); if (rot) m.rotation.set(...rot); scene.add(m); return m; }
function torus(scene: THREE.Group, r: number, tube: number, pos: [number, number, number], material: THREE.Material, rot?: [number, number, number]) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 28), material); m.position.set(...pos); if (rot) m.rotation.set(...rot); scene.add(m); return m; }
function pipe(scene: THREE.Group, a: [number, number, number], b: [number, number, number], radius: number, material: THREE.Material) { const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), d = bv.clone().sub(av); const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length, 12), material); m.position.copy(av.clone().add(bv).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); scene.add(m); return m; }

function frame(g: THREE.Group, x: number, w = 3.2, h = 4.2) {
  const fm = mat(C.frame, .8, .3);
  for (const dx of [-w / 2, w / 2]) for (const z of [-.72, .72]) box(g, "frame", [.12, h, .12], [x + dx, h / 2, z], fm);
  for (const y of [.15, h - .15]) box(g, "beam", [w + .25, .12, 1.58], [x, y, 0], fm);
}

function makeMachine(stage: Stage) {
  const g = new THREE.Group(); g.position.x = stage.x; g.userData.stageId = stage.id;
  const s = mat(C.steel), s2 = mat(C.steel2), dark = mat(C.dark), brass = mat(C.brass, .9, .24), glass = new THREE.MeshPhysicalMaterial({ color: C.glass, transmission: .38, transparent: true, opacity: .45, roughness: .18, metalness: .15 });
  frame(g, 0);
  switch (stage.id) {
    case "preparation":
      box(g, "cane conveyor", [3.1, .28, 1.35], [0, 1.15, 0], dark);
      for (let i = -6; i <= 6; i++) box(g, "cane", [.42, .18, 1.08], [i * .22, 1.38, 0], mat(C.cane, .15, .7), [0, 0, i * .11]);
      cyl(g, "cutter wheel", .9, .18, [0, 2.65, 0], brass, [Math.PI / 2, 0, 0], 28); for (let i = 0; i < 8; i++) box(g, "blade", [.08, .7, .08], [Math.cos(i * Math.PI / 4) * .52, 2.65 + Math.sin(i * Math.PI / 4) * .52, 0], s2, [0, i * Math.PI / 4, 0]);
      break;
    case "shredding":
      box(g, "housing", [2.7, 2.1, 1.45], [0, 2.0, 0], dark); for (let i = -2; i <= 2; i++) { const r = cyl(g, "rotor", .26, 1.3, [i * .42, 2, 0], brass, [Math.PI / 2, 0, 0], 16); r.rotation.z = .35; }
      box(g, "feed", [1.0, .35, 1.0], [-1.85, 2.0, 0], s2); box(g, "fiber outlet", [1.0, .35, 1.0], [1.85, 1.35, 0], mat(C.fiber, .15, .7));
      break;
    case "extraction":
      box(g, "mill housing", [3.1, 2.5, 1.65], [0, 2.0, 0], dark); for (let i = -1; i <= 1; i++) cyl(g, "extraction roll", .62, 1.55, [i * .78, 2.15, 0], s2, [Math.PI / 2, 0, 0], 32);
      box(g, "juice pan", [2.7, .35, 1.45], [0, .78, 0], mat(C.juice, .2, .55)); box(g, "bagasse chute", [1.2, .8, 1.2], [1.9, 1.35, 0], mat(C.fiber, .15, .65));
      break;
    case "clarification":
      cyl(g, "clarifier", 1.25, 3.25, [0, 2.15, 0], glass, undefined, 36); cyl(g, "sludge zone", 1.08, .42, [0, .75, 0], mat(C.red, .15, .7)); cyl(g, "juice zone", 1.08, .65, [0, 1.28, 0], mat(C.juice, .15, .65)); cyl(g, "rake shaft", .1, 3.2, [0, 2.25, 0], brass); torus(g, .82, .07, [0, 1.2, 0], brass); break;
    case "evaporation":
      for (let i = -1; i <= 1; i++) { cyl(g, "evaporator body", .88, 2.5, [i * 1.05, 2.15, 0], s2); torus(g, .88, .08, [i * 1.05, 1.05, 0], brass); cyl(g, "syrup", .72, .35, [i * 1.05, 1.02, 0], mat(C.syrup, .1, .6)); }
      pipe(g, [-1.05, 3.45, 0], [1.05, 3.45, 0], .1, s2); break;
    case "crystallization":
      cyl(g, "vacuum pan", 1.28, 2.9, [0, 2.1, 0], s2, undefined, 32); cyl(g, "massecuite", 1.1, .65, [0, 1.05, 0], mat(C.syrup, .1, .52)); cyl(g, "agitator", .12, 2.7, [0, 2.1, 0], brass); for (let i = 0; i < 10; i++) box(g, "crystal", [.09, .09, .09], [Math.sin(i * 2.3) * .8, 1.15 + (i % 3) * .12, Math.cos(i * 1.7) * .8], mat(C.sugar, .05, .35)); break;
    case "centrifugation":
      cyl(g, "centrifuge casing", 1.32, 2.5, [0, 2.0, 0], dark, undefined, 32); cyl(g, "basket", 1.05, 1.75, [0, 2.0, 0], brass, undefined, 32); torus(g, 1.05, .08, [0, 2.85, 0], s2); for (let i = 0; i < 18; i++) box(g, "sugar", [.07, .07, .22], [Math.sin(i * 2.2) * .9, 1.65 + (i % 4) * .12, Math.cos(i * 2.2) * .9], mat(C.sugar, .05, .35)); break;
    case "drying":
      cyl(g, "rotary drum", 1.05, 2.8, [0, 2.0, 0], s2, [0, 0, Math.PI / 2], 32); for (let i = -1; i <= 1; i++) torus(g, 1.08, .1, [i * .85, 2.0, 0], brass, [0, Math.PI / 2, 0]); box(g, "sugar bed", [1.8, .3, .8], [0, 1.35, 0], mat(C.sugar, .05, .35)); pipe(g, [-1.9, 3.2, 0], [-.7, 3.2, 0], .16, s2); break;
  }
  const motor = box(g, "motor", [.65, .65, .65], [-1.35, .45, .9], dark); motor.rotation.y = -.2;
  return g;
}

function makeInspection(stage: Stage) {
  const g = new THREE.Group(); g.userData.stageId = stage.id; const def = getEquipmentInspection(stage.id); const steel = mat(C.steel2), brass = mat(C.brass, .9, .25), dark = mat(C.dark), juice = mat(C.juice, .15, .6), sugar = mat(C.sugar, .05, .3), fiber = mat(C.fiber, .1, .7);
  const label = (text: string, y: number) => { const c = document.createElement("canvas"); c.width = 512; c.height = 128; const x = c.getContext("2d")!; x.fillStyle = "#dff8f2"; x.font = "700 34px sans-serif"; x.fillText(text, 18, 52); const t = new THREE.CanvasTexture(c); const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); m.scale.set(4.2, 1.05, 1); m.position.set(0, y, 0); g.add(m); };
  box(g, "cutaway shell", [6.4, .18, 4.2], [0, -.2, 0], dark); frame(g, 0, 5.8, 4.4);
  switch (stage.id) {
    case "preparation": box(g, "feed", [1.4, .5, 2.4], [-2.1, 1.0, 0], mat(C.cane, .1, .7)); cyl(g, "cutter", 1.0, .25, [0, 2.2, 0], brass, [Math.PI / 2, 0, 0], 32); box(g, "billets", [1.5, .35, 1.8], [2, .9, 0], mat(C.cane, .1, .7)); break;
    case "shredding": box(g, "fiber bed", [3.8, .7, 2.0], [0, .75, 0], fiber); for (let i = -1; i <= 1; i++) cyl(g, "rotor", .45, 2.4, [i * 1.05, 2.1, 0], brass, [Math.PI / 2, 0, 0]); break;
    case "extraction": for (let i = -1; i <= 1; i++) cyl(g, "roll", .72, 3.6, [i * 1.05, 2.1, 0], steel, [Math.PI / 2, 0, 0], 36); box(g, "juice pan", [5.2, .45, 2.7], [0, .45, 0], juice); pipe(g, [-2.7, 3.5, 0], [2.7, 3.5, 0], .14, fiber); break;
    case "clarification": cyl(g, "settling zone", 1.75, 3.2, [0, 1.9, 0], juice, undefined, 36); cyl(g, "solids zone", 1.55, .45, [0, .45, 0], mat(C.red, .1, .7)); torus(g, 1.3, .09, [0, 1.5, 0], brass); break;
    case "evaporation": for (let i = -1; i <= 1; i++) { cyl(g, "body", .82, 3.2, [i * 1.35, 1.9, 0], steel); cyl(g, "syrup", .68, .5, [i * 1.35, .75, 0], mat(C.syrup, .1, .55)); } break;
    case "crystallization": cyl(g, "vessel", 1.9, 3.5, [0, 1.8, 0], steel, undefined, 36); cyl(g, "massecuite", 1.65, .9, [0, .65, 0], mat(C.syrup, .1, .5)); for (let i = 0; i < 35; i++) box(g, "crystal", [.07, .07, .07], [Math.sin(i * 3.1) * 1.4, .9 + (i % 5) * .12, Math.cos(i * 2.2) * 1.4], sugar); break;
    case "centrifugation": cyl(g, "basket", 1.75, 2.7, [0, 1.8, 0], brass, undefined, 40); for (let i = 0; i < 24; i++) box(g, "sugar", [.08, .08, .25], [Math.sin(i * 2.1) * 1.5, 1.3 + (i % 5) * .12, Math.cos(i * 2.1) * 1.5], sugar); break;
    case "drying": cyl(g, "drum", 1.45, 4.5, [0, 1.8, 0], steel, [0, 0, Math.PI / 2], 40); box(g, "sugar bed", [3.2, .4, 1.2], [0, .85, 0], sugar); pipe(g, [-2.8, 3.4, 0], [2.8, 3.4, 0], .16, steel); break;
  }
  label(def?.cutawayPurpose ?? stage.name, 4.8); return g;
}

export function ImmersiveSugarPlant() {
  const mount = useRef<HTMLDivElement>(null); const sceneRef = useRef<THREE.Scene | null>(null); const cameraRef = useRef<THREE.PerspectiveCamera | null>(null); const controlsRef = useRef<OrbitControls | null>(null); const overviewRef = useRef<THREE.Group | null>(null); const insideRef = useRef<THREE.Group | null>(null); const targetRef = useRef(new THREE.Vector3()); const cameraGoalRef = useRef(new THREE.Vector3()); const lookGoalRef = useRef(new THREE.Vector3());
  const [selectedId, setSelectedId] = useState<string | null>(null); const [inside, setInside] = useState(false); const [moving, setMoving] = useState(false);
  const selected = STAGES.find(s => s.id === selectedId) ?? null;
  const stageIndex = useMemo(() => selected ? STAGES.findIndex(s => s.id === selected.id) : -1, [selected]);

  useEffect(() => {
    if (!mount.current) return; const host = mount.current; const scene = new THREE.Scene(); scene.background = new THREE.Color(0x02080b); scene.fog = new THREE.Fog(0x02080b, 28, 65); sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, .1, 100); camera.position.set(0, 8.5, 25); cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(host.clientWidth, host.clientHeight); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .075; controls.minDistance = 5; controls.maxDistance = 34; controls.maxPolarAngle = Math.PI * .48; controlsRef.current = controls;
    scene.add(new THREE.HemisphereLight(0xc8fff5, 0x071013, 2.2)); const key = new THREE.DirectionalLight(0xffffff, 4.2); key.position.set(4, 12, 12); key.castShadow = true; scene.add(key); const fill = new THREE.PointLight(C.glow, 18, 30); fill.position.set(0, 7, 3); scene.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 30), new THREE.MeshStandardMaterial({ color: 0x081113, roughness: .72, metalness: .45 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.03; floor.receiveShadow = true; scene.add(floor);
    for (let x = -28; x <= 28; x += 4) { box(scene as unknown as THREE.Group, "floor line", [.035, .012, 24], [x, .01, 0], mat(0x173438, .3, .8)); }
    const overview = new THREE.Group(); overviewRef.current = overview; STAGES.forEach(s => overview.add(makeMachine(s))); scene.add(overview);
    const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(host.clientWidth, host.clientHeight), .35, .7, .82)); composer.addPass(new OutputPass());
    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down = new THREE.Vector2(); let disposed = false;
    const click = (e: PointerEvent) => { if (moving) return; const r = renderer.domElement.getBoundingClientRect(); pointer.x = ((e.clientX-r.left)/r.width)*2-1; pointer.y = -((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(pointer,camera); const hits = ray.intersectObjects(insideRef.current ? insideRef.current.children : overview.children, true); let o: THREE.Object3D | null = hits[0]?.object ?? null; while (o && !o.userData.stageId) o = o.parent; if (o?.userData.stageId) selectStage(o.userData.stageId); };
    const downHandler = (e: PointerEvent) => { down.set(e.clientX,e.clientY); }; const upHandler = (e: PointerEvent) => { if (Math.hypot(e.clientX-down.x,e.clientY-down.y)<5) click(e); }; renderer.domElement.addEventListener("pointerdown",downHandler); renderer.domElement.addEventListener("pointerup",upHandler);
    const resize = () => { const w=host.clientWidth,h=host.clientHeight; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); composer.setSize(w,h); }; const ro=new ResizeObserver(resize); ro.observe(host);
    const animate = () => { if (disposed) return; requestAnimationFrame(animate); if (moving) { camera.position.lerp(cameraGoalRef.current,.085); controls.target.lerp(lookGoalRef.current,.085); if (camera.position.distanceTo(cameraGoalRef.current)<.06 && controls.target.distanceTo(lookGoalRef.current)<.06) { camera.position.copy(cameraGoalRef.current); controls.target.copy(lookGoalRef.current); setMoving(false); } } controls.update(); composer.render(); };
    animate(); return () => { disposed=true; ro.disconnect(); renderer.domElement.removeEventListener("pointerdown",downHandler); renderer.domElement.removeEventListener("pointerup",upHandler); controls.dispose(); renderer.dispose(); composer.dispose(); host.removeChild(renderer.domElement); scene.clear(); };
  }, [moving]);

  const selectStage = (id: string) => { const stage=STAGES.find(s=>s.id===id); if(!stage || !cameraRef.current || !controlsRef.current) return; setSelectedId(id); setMoving(true); const base=new THREE.Vector3(stage.x,2.4,0); targetRef.current.copy(base); cameraGoalRef.current.set(stage.x,5.3,9.5); lookGoalRef.current.copy(base); };
  const enter = () => { if(!selected || inside || !sceneRef.current || !cameraRef.current || !controlsRef.current) return; const g=makeInspection(selected); insideRef.current=g; sceneRef.current.add(g); if(overviewRef.current) overviewRef.current.visible=false; setInside(true); setMoving(true); cameraGoalRef.current.set(0,3.2,12); lookGoalRef.current.set(0,2,0); };
  const exit = () => { if(!sceneRef.current || !cameraRef.current || !controlsRef.current) return; if(insideRef.current){ sceneRef.current.remove(insideRef.current); insideRef.current=null; } if(overviewRef.current) overviewRef.current.visible=true; setInside(false); setMoving(true); const x=selected?.x??0; cameraGoalRef.current.set(x,7.2,18); lookGoalRef.current.set(x,2,0); };
  const moveStage = (delta: number) => { const i=Math.max(0,Math.min(STAGES.length-1,stageIndex+delta)); selectStage(STAGES[i].id); };

  return <div style={{ position:"relative", height:640, border:"1px solid rgba(145,205,196,.16)", borderRadius:22, overflow:"hidden", background:"#02080b", boxShadow:"0 28px 90px rgba(0,0,0,.38)" }}>
    <div ref={mount} style={{ position:"absolute", inset:0 }} />
    <div style={{position:"absolute",left:18,top:18,zIndex:3,pointerEvents:"none"}}><div style={{fontSize:9,fontWeight:800,letterSpacing:2.2,color:"#70d0bd"}}>SUGARCANE FACTORY · {inside?"MACHINE INSPECTION":"PRODUCTION FLOOR"}</div><div style={{marginTop:6,fontSize:20,fontWeight:800}}>{inside?(selected?.name??"Inspection"):"Select a unit to inspect"}</div></div>
    {!inside && <div style={{position:"absolute",left:18,right:18,bottom:18,zIndex:4,display:"flex",gap:8,overflowX:"auto"}}>{STAGES.map(s=><button key={s.id} onClick={()=>selectStage(s.id)} style={{flex:"0 0 132px",textAlign:"left",padding:"10px 11px",borderRadius:12,border:`1px solid ${selectedId===s.id?"rgba(112,208,189,.8)":"rgba(255,255,255,.12)"}`,background:selectedId===s.id?"rgba(40,91,84,.86)":"rgba(5,15,18,.82)",color:"#e9f4f2",cursor:"pointer"}}><div style={{fontSize:8,color:"#70d0bd",fontWeight:800}}>{s.no}</div><div style={{fontSize:10,fontWeight:800,marginTop:5}}>{s.name}</div><div style={{fontSize:8,color:"rgba(225,240,238,.5)",marginTop:4}}>{s.short}</div></button>)}</div>}
    {selected && !inside && <div style={{position:"absolute",right:18,top:18,width:245,zIndex:5,padding:15,borderRadius:16,border:"1px solid rgba(112,208,189,.22)",background:"rgba(3,12,15,.9)",backdropFilter:"blur(14px)"}}><div style={{fontSize:8,color:"#70d0bd",fontWeight:800}}>SELECTED UNIT · {selected.no}</div><div style={{fontSize:15,fontWeight:800,marginTop:5}}>{selected.name}</div><div style={{fontSize:9,color:"rgba(228,240,239,.55)",marginTop:9,lineHeight:1.6}}>IN · {selected.input}<br/>OUT · {selected.output}</div><button onClick={enter} style={{marginTop:12,width:"100%",padding:"10px 12px",border:0,borderRadius:10,background:"#70d0bd",color:"#06100f",fontWeight:900,fontSize:9,cursor:"pointer",letterSpacing:1}}>ENTER MACHINE CUTAWAY</button></div>}
    {inside && <div style={{position:"absolute",right:18,top:18,zIndex:5,width:250,padding:15,borderRadius:16,border:"1px solid rgba(112,208,189,.22)",background:"rgba(3,12,15,.92)",backdropFilter:"blur(14px)"}}><div style={{fontSize:8,color:"#70d0bd",fontWeight:800}}>INTERNAL PROCESS</div><div style={{fontSize:14,fontWeight:800,marginTop:5}}>{selected?.name}</div><div style={{fontSize:9,color:"rgba(228,240,239,.56)",lineHeight:1.6,marginTop:8}}>{getEquipmentInspection(selected?.id ?? "")?.cutawayPurpose}</div><button onClick={exit} style={{marginTop:12,width:"100%",padding:"10px 12px",border:"1px solid rgba(112,208,189,.35)",borderRadius:10,background:"rgba(112,208,189,.08)",color:"#b9eee4",fontWeight:800,fontSize:9,cursor:"pointer"}}>← RETURN TO FACTORY</button></div>}
    {selected && !inside && <div style={{position:"absolute",left:18,top:82,zIndex:5,display:"flex",gap:5}}><button onClick={()=>moveStage(-1)} style={navStyle}>←</button><button onClick={()=>moveStage(1)} style={navStyle}>→</button></div>}
    <div style={{position:"absolute",right:18,bottom:18,zIndex:4,padding:"7px 9px",borderRadius:9,background:"rgba(3,10,12,.7)",color:"rgba(225,239,238,.48)",fontSize:8}}>DRAG · ORBIT &nbsp; SCROLL · ZOOM</div>
  </div>;
}

const navStyle: React.CSSProperties = { width:32,height:28,border:"1px solid rgba(255,255,255,.14)",borderRadius:8,background:"rgba(4,14,17,.8)",color:"#dcefed",cursor:"pointer" };
