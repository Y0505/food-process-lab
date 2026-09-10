"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const model = buildSugarcaneVisualizationModel();
const stages = model.stages;
const xs = stages.map((_, i) => -8.4 + i * 2.4);

type Motion = { object: THREE.Object3D; kind: string; stage: number; phase: number; speed: number; data?: unknown };
const M = (color: number, metalness = 0.1, roughness = 0.5) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const GLASS = new THREE.MeshPhysicalMaterial({ color: 0x9ed9d3, transparent: true, opacity: 0.13, roughness: 0.08, transmission: 0.2, depthWrite: false, side: THREE.DoubleSide });
const LIQUID = M(0x568c48, 0, 0.32);
const DARK_LIQUID = M(0x60401f, 0, 0.3);
const CANE = M(0x88a24d, 0, 0.82);
const CUT_CANE = M(0xb39a54, 0, 0.78);
const FIBER = M(0x967044, 0, 0.9);
const SUGAR = M(0xf1dfa1, 0, 0.22);
const SOLIDS = M(0x795c3c, 0, 0.78);
const STEEL = M(0x748487, 0.82, 0.27);
const DARK = M(0x26383b, 0.82, 0.3);
const COPPER = M(0xb57a42, 0.65, 0.3);
const AIR = new THREE.MeshBasicMaterial({ color: 0xd9f0eb, transparent: true, opacity: 0.3 });
const STEAM = new THREE.MeshBasicMaterial({ color: 0xf1f8f5, transparent: true, opacity: 0.2 });
const MOLASSES = M(0x241812, 0, 0.48);

function box(g: THREE.Group, s: [number, number, number], p: [number, number, number], m: THREE.Material) { const o = new THREE.Mesh(new THREE.BoxGeometry(...s), m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
function cyl(g: THREE.Group, r: number, h: number, p: [number, number, number], m: THREE.Material, n = 28) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, n), m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
function sphere(g: THREE.Group, r: number, p: [number, number, number], m: THREE.Material) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); o.position.set(...p); g.add(o); return o; }
function pipe(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, m: THREE.Material, r = 0.06) { const d = b.clone().sub(a); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), m); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.castShadow = true; g.add(o); return o; }
function grain(g: THREE.Group, p: [number, number, number], m = SUGAR, r = 0.035) { const o = new THREE.Mesh(new THREE.OctahedronGeometry(r), m); o.position.set(...p); g.add(o); return o; }
function route(motions: Motion[], g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, stage: number, material: THREE.Material, count = 6, speed = 0.15) { for (let i = 0; i < count; i++) { const o = sphere(g, 0.045, [0, 0, 0], material); motions.push({ object: o, kind: "route", stage, phase: i / count, speed, data: { a: a.clone(), b: b.clone() } }); } }

function buildFactory(motions: Motion[]) {
  const g = new THREE.Group();
  box(g, [21, 0.18, 5.4], [0, -1.45, 0], M(0x10191c, 0.1, 0.92));
  for (const x of xs) { box(g, [0.07, 4.0, 0.07], [x - 0.95, 0.45, -1.1], DARK); box(g, [0.07, 4.0, 0.07], [x + 0.95, 0.45, -1.1], DARK); }
  box(g, [20.8, 0.08, 0.08], [0, 2.45, -1.1], STEEL);

  for (let i = 0; i < 7; i++) { const a = new THREE.Vector3(xs[i] + 0.8, -0.15, 0); const b = new THREE.Vector3(xs[i + 1] - 0.8, -0.15, 0); pipe(g, a, b, DARK, 0.055); route(motions, g, a, b, i, i < 3 ? LIQUID : DARK_LIQUID, 5, 0.13); }

  // PREPARATION: long cane stalks physically pass a cutter and emerge as short pieces.
  {
    const x = xs[0]; box(g, [1.8, 0.16, 1.2], [x - 0.1, -0.45, 0], DARK);
    for (let i = 0; i < 5; i++) { const stalk = cyl(g, 0.075, 1.35, [x - 1.05 + i * 0.22, -0.02, -0.25 + (i % 2) * 0.28], CANE, 10); stalk.rotation.z = Math.PI / 2; motions.push({ object: stalk, kind: "stalk", stage: 0, phase: i / 5, speed: 0.22 }); }
    const cutter = new THREE.Group(); cutter.position.set(x + 0.5, 0.05, 0); g.add(cutter); cyl(cutter, 0.12, 0.22, [0, 0, 0], COPPER, 20).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) { const b = box(cutter, [0.62, 0.045, 0.08], [0.3, 0, 0], STEEL); b.rotation.z = i * Math.PI / 3; }
    motions.push({ object: cutter, kind: "cutter", stage: 0, phase: 0, speed: 2.5 });
    for (let i = 0; i < 12; i++) { const p = box(g, [0.16, 0.08, 0.08], [x + 0.58 + (i % 4) * 0.18, -0.05, -0.35 + (i % 3) * 0.28], CUT_CANE); motions.push({ object: p, kind: "cut-piece", stage: 0, phase: i / 12, speed: 0.3 }); }
  }

  // SHREDDING: transparent drum exposes rotating knives and the intact-to-fiber transition.
  {
    const x = xs[1]; box(g, [1.7, 1.65, 1.35], [x, 0.15, 0], GLASS);
    const shaft = cyl(g, 0.075, 1.5, [x, 0.15, 0], COPPER, 16); shaft.rotation.x = Math.PI / 2; motions.push({ object: shaft, kind: "shred-rotor", stage: 1, phase: 0, speed: 4 });
    for (let i = 0; i < 8; i++) { const b = box(g, [0.72, 0.06, 0.08], [x, 0.15, 0], STEEL); b.rotation.z = i * Math.PI / 4; motions.push({ object: b, kind: "shred-blade", stage: 1, phase: i / 8, speed: 4 }); }
    box(g, [0.45, 0.12, 0.75], [x, 1.05, 0], DARK);
    for (let i = 0; i < 8; i++) { const p = box(g, [0.13, 0.22, 0.09], [x - 0.22 + (i % 3) * 0.2, 0.82, -0.25 + (i % 2) * 0.3], CUT_CANE); motions.push({ object: p, kind: "shred-input", stage: 1, phase: i / 8, speed: 0.28 }); }
    for (let i = 0; i < 16; i++) { const f = box(g, [0.3, 0.035, 0.035], [x + 0.35, -0.38, -0.5 + (i % 7) * 0.15], FIBER); motions.push({ object: f, kind: "fiber", stage: 1, phase: i / 16, speed: 0.42 }); }
  }

  // EXTRACTION: counter-rotating rolls compress fiber; liquid falls and dry bagasse exits sideways.
  {
    const x = xs[2];
    for (const z of [-0.34, 0.34]) { const r = cyl(g, 0.43, 1.3, [x, 0.28, z], STEEL, 36); r.rotation.x = Math.PI / 2; motions.push({ object: r, kind: "mill-roll", stage: 2, phase: z, speed: z < 0 ? 1.7 : -1.7 }); }
    for (let i = 0; i < 12; i++) { const f = box(g, [0.2, 0.035, 0.035], [x - 0.78 + (i % 5) * 0.16, 0.5, -0.22 + (i % 3) * 0.2], FIBER); motions.push({ object: f, kind: "press", stage: 2, phase: i / 12, speed: 0.35 }); }
    box(g, [1.45, 0.14, 0.95], [x, -0.62, 0], DARK);
    for (let i = 0; i < 16; i++) { const d = sphere(g, 0.038, [0, 0, 0], LIQUID); motions.push({ object: d, kind: "juice-drop", stage: 2, phase: i / 16, speed: 0.5 }); }
    for (let i = 0; i < 12; i++) { const b = box(g, [0.22, 0.045, 0.06], [x + 0.45, -0.05, -0.3 + (i % 5) * 0.15], FIBER); motions.push({ object: b, kind: "bagasse", stage: 2, phase: i / 12, speed: 0.28 }); }
  }

  // CLARIFICATION: transparent tank visibly separates a dirty lower feed from a clear upper layer and sludge.
  {
    const x = xs[3]; cyl(g, 0.8, 2.0, [x, 0.1, 0], GLASS, 40); cyl(g, 0.66, 0.72, [x, -0.48, 0], LIQUID, 32); cyl(g, 0.67, 0.22, [x, -0.9, 0], SOLIDS, 32);
    const shaft = cyl(g, 0.045, 1.7, [x, 0.48, 0], DARK, 12); motions.push({ object: shaft, kind: "rake-shaft", stage: 3, phase: 0, speed: 0.3 });
    for (const y of [-0.48, -0.7]) { const rake = box(g, [1.0, 0.045, 0.06], [x, y, 0], DARK); motions.push({ object: rake, kind: "rake", stage: 3, phase: y, speed: 0.3 }); }
    for (let i = 0; i < 24; i++) { const s = sphere(g, 0.025, [x, 0.3, 0], SOLIDS); motions.push({ object: s, kind: "settle", stage: 3, phase: i / 24, speed: 0.07 }); }
    pipe(g, new THREE.Vector3(x + 0.63, 0.68, 0), new THREE.Vector3(x + 1.05, 0.68, 0), STEEL, 0.055);
  }

  // EVAPORATION: open vessels make boiling and water leaving the concentrated syrup obvious.
  {
    const x = xs[4];
    for (let i = -1; i <= 1; i++) { const vx = x + i * 0.48; cyl(g, 0.43, 1.5, [vx, 0.05, 0], GLASS, 30); cyl(g, 0.35, 0.6, [vx, -0.43, 0], DARK_LIQUID, 24); for (let j = 0; j < 5; j++) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.022, 8, 24), COPPER); h.position.set(vx, -0.48 + j * 0.16, 0); g.add(h); } }
    for (let i = 0; i < 20; i++) { const v = sphere(g, 0.04, [0, 0, 0], STEAM); motions.push({ object: v, kind: "steam", stage: 4, phase: i / 20, speed: 0.17 }); }
    for (let i = 0; i < 14; i++) { const b = sphere(g, 0.03, [0, 0, 0], COPPER); motions.push({ object: b, kind: "boil", stage: 4, phase: i / 14, speed: 0.25 }); }
  }

  // CRYSTALLIZATION: transparent vessel shows syrup and a growing crystal population around an agitator.
  {
    const x = xs[5]; cyl(g, 0.76, 1.9, [x, 0.1, 0], GLASS, 34); cyl(g, 0.62, 1.05, [x, -0.38, 0], DARK_LIQUID, 28);
    const shaft = cyl(g, 0.055, 2.4, [x, 0.48, 0], DARK, 12); motions.push({ object: shaft, kind: "agitator", stage: 5, phase: 0, speed: 0.75 });
    for (const y of [-0.45, 0, 0.45]) { const blade = box(g, [1.1, 0.06, 0.07], [x, y, 0], DARK); motions.push({ object: blade, kind: "agitator-blade", stage: 5, phase: y, speed: 0.75 }); }
    for (let i = 0; i < 34; i++) { const c = grain(g, [x, -0.55, 0], SUGAR, 0.035); motions.push({ object: c, kind: "crystal", stage: 5, phase: i / 34, speed: 0.12 }); }
  }

  // CENTRIFUGATION: open basket makes radial separation visible rather than hiding it inside a box.
  {
    const x = xs[6]; const housing = cyl(g, 0.88, 1.55, [x, 0.05, 0], GLASS, 36); housing.rotation.x = Math.PI / 2;
    const basket = new THREE.Group(); basket.position.set(x, 0.05, 0); g.add(basket); const hub = cyl(basket, 0.13, 1.2, [0, 0, 0], STEEL, 20); hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) { const arm = box(basket, [0.72, 0.05, 0.05], [0.36, 0, 0], STEEL); arm.rotation.z = i * Math.PI / 4; }
    motions.push({ object: basket, kind: "basket", stage: 6, phase: 0, speed: 4.5 });
    for (let i = 0; i < 28; i++) { const c = grain(g, [x + 0.2, 0.05, 0], SUGAR, 0.032); motions.push({ object: c, kind: "centrifuge-crystal", stage: 6, phase: i / 28, speed: 4.5 }); }
    for (let i = 0; i < 18; i++) { const l = sphere(g, 0.025, [0, 0, 0], MOLASSES); motions.push({ object: l, kind: "mother-liquor", stage: 6, phase: i / 18, speed: 2.4 }); }
  }

  // DRYING: transparent tunnel exposes crystals crossing a hot-air stream before discharge.
  {
    const x = xs[7]; box(g, [1.7, 1.65, 1.35], [x, 0.1, 0], GLASS); box(g, [1.5, 0.12, 0.95], [x, -0.63, 0], DARK);
    for (let i = 0; i < 30; i++) { const c = grain(g, [x - 0.55, -0.48, -0.3 + (i % 7) * 0.1], SUGAR, 0.03); motions.push({ object: c, kind: "dry-grain", stage: 7, phase: i / 30, speed: 0.24 }); }
    for (let i = 0; i < 18; i++) { const a = sphere(g, 0.025, [0, 0, 0], AIR); motions.push({ object: a, kind: "hot-air", stage: 7, phase: i / 18, speed: 0.4 }); }
  }
  return g;
}

function cameraPose(index: number) { const x = xs[index]; return { position: new THREE.Vector3(x * 0.32, 3.05, 17.8), target: new THREE.Vector3(x * 0.3, -0.05, 0) }; }

export default function ProcessLineOverview() {
  const mount = useRef<HTMLDivElement>(null); const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!mount.current) return; const element = mount.current; const scene = new THREE.Scene(); scene.background = new THREE.Color(0x071013); scene.fog = new THREE.Fog(0x071013, 14, 32);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70); const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; element.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xd7ebe6, 0x111719, 1.7)); const key = new THREE.DirectionalLight(0xfff4dc, 3.2); key.position.set(4, 8, 9); key.castShadow = true; scene.add(key); const fill = new THREE.DirectionalLight(0x6aaea3, 1.25); fill.position.set(-8, 4, -6); scene.add(fill);
    const motions: Motion[] = []; const factory = buildFactory(motions); scene.add(factory);
    const hits = stages.map((_, i) => { const h = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.5, 2.5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); h.position.set(xs[i], 0.25, 0); h.userData.stageIndex = i; factory.add(h); return h; });
    const markers = stages.map((_, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 10, 32), new THREE.MeshStandardMaterial({ color: 0x7bd4c5, emissive: 0x17554d, emissiveIntensity: 1.2 })); m.rotation.x = Math.PI / 2; m.position.set(xs[i], -1.28, 0); m.visible = i === 0; factory.add(m); return m; });
    let goal = cameraPose(0); let target = goal.target.clone(); camera.position.copy(goal.position); camera.lookAt(target);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const point = (e: PointerEvent | MouseEvent) => { const r = renderer.domElement.getBoundingClientRect(); pointer.set(((e.clientX-r.left)/r.width)*2-1, -(((e.clientY-r.top)/r.height)*2-1)); raycaster.setFromCamera(pointer, camera); };
    const selectScene = (i: number) => { setSelected(i); markers.forEach((m, j) => m.visible = j === i); window.dispatchEvent(new CustomEvent("food-process-stage-select", { detail: i })); };
    const onMove = (e: PointerEvent) => { point(e); renderer.domElement.style.cursor = raycaster.intersectObjects(hits, false).length ? "pointer" : "default"; };
    const onClick = (e: MouseEvent) => { point(e); const hit = raycaster.intersectObjects(hits, false)[0]; if (hit) selectScene(Number(hit.object.userData.stageIndex)); };
    const onStage = (e: Event) => { const i = Math.max(0, Math.min(7, Number((e as CustomEvent<number>).detail))); selectScene(i); goal = cameraPose(i); };
    const onOpenInspection = (e: Event) => { const i = Math.max(0, Math.min(7, Number((e as CustomEvent<number>).detail))); selectScene(i); window.setTimeout(() => { const cards = document.querySelectorAll<HTMLButtonElement>(".stage-card"); cards[i]?.click(); cards[i]?.scrollIntoView({ behavior: "smooth", block: "center" }); window.setTimeout(() => document.querySelector<HTMLButtonElement>(".explorer-stage .enter-equipment")?.click(), 100); }, 0); };
    renderer.domElement.addEventListener("pointermove", onMove); renderer.domElement.addEventListener("click", onClick); window.addEventListener("food-process-stage-select", onStage); window.addEventListener("food-process-open-inspection", onOpenInspection);
    const clock = new THREE.Clock(); let id = 0;
    const animate = () => { id = requestAnimationFrame(animate); const delta = Math.min(clock.getDelta(), 0.05); const elapsed = clock.elapsedTime; camera.position.lerp(goal.position, 1-Math.pow(0.001,delta*1.3)); target.lerp(goal.target, 1-Math.pow(0.001,delta*1.5)); camera.lookAt(target); markers.forEach(m => { if (m.visible) m.scale.setScalar(1+Math.sin(elapsed*3.4)*0.1); });
      motions.forEach(({ object, kind, stage, phase, speed, data }) => { const cycle=(elapsed*speed+phase)%1; const x=xs[stage];
        if (kind === "route") { const {a,b}=data as {a:THREE.Vector3;b:THREE.Vector3}; object.position.lerpVectors(a,b,cycle); }
        else if (kind === "stalk") object.position.x=x-1.15+cycle*1.9;
        else if (kind === "cutter") object.rotation.z=elapsed*speed;
        else if (kind === "cut-piece") object.position.x=x+0.42+cycle*0.95;
        else if (kind === "shred-rotor" || kind === "shred-blade") object.rotation.x=elapsed*speed;
        else if (kind === "shred-input") object.position.y=1.0-cycle*1.35;
        else if (kind === "fiber") { object.position.x=x+0.3+cycle*0.85; object.position.y=-0.38+Math.sin(elapsed*4+phase)*0.07; }
        else if (kind === "mill-roll") object.rotation.z=elapsed*speed;
        else if (kind === "press") { object.position.x=x-0.72+cycle*0.72; object.scale.x=0.65+cycle*0.35; }
        else if (kind === "juice-drop") object.position.set(x-0.5+(phase*13%5)*0.2,-0.38-cycle*0.55,-0.3+(phase*7%4)*0.18);
        else if (kind === "bagasse") object.position.x=x+0.42+cycle*0.9;
        else if (kind === "rake-shaft") object.rotation.y=elapsed*speed;
        else if (kind === "rake") object.rotation.y=elapsed*speed;
        else if (kind === "settle") object.position.set(x-0.48+(phase*17%5)*0.2,0.55-cycle*1.25,-0.28+(phase*11%4)*0.18);
        else if (kind === "steam") { object.position.set(x-0.7+(phase*17%5)*0.3,0.7+cycle*1.7,Math.sin(phase*8)*0.08); object.scale.setScalar(0.5+Math.sin(cycle*Math.PI)*0.7); }
        else if (kind === "boil") { object.position.set(x-0.2+(phase*7%3)*0.18,-0.35+cycle*0.95,0.05); object.scale.setScalar(0.45+Math.sin(cycle*Math.PI)*0.7); }
        else if (kind === "agitator") object.rotation.y=elapsed*speed;
        else if (kind === "agitator-blade") object.rotation.y=elapsed*speed;
        else if (kind === "crystal") { const a=phase*Math.PI*2+elapsed*0.12; const r=0.12+((phase*19)%5)*0.09; object.position.set(x+Math.cos(a)*r,-0.58+((phase*23)%7)*0.16,Math.sin(a)*r); object.scale.setScalar(0.35+cycle*0.9); }
        else if (kind === "basket") object.rotation.y=elapsed*speed;
        else if (kind === "centrifuge-crystal") { const a=elapsed*speed+phase*Math.PI*2; const r=0.18+cycle*0.55; object.position.set(x+Math.cos(a)*r,0.04+Math.sin(a*2)*0.05,Math.sin(a)*r); }
        else if (kind === "mother-liquor") object.position.set(x-0.2+cycle*0.8,0.05,0.25*Math.sin(phase*12));
        else if (kind === "dry-grain") object.position.set(x-0.65+cycle*1.25,-0.48,-0.3+(phase*11%6)*0.11);
        else if (kind === "hot-air") object.position.set(x-0.65+cycle*1.2,-0.8+((phase*9)%4)*0.25,-0.45+((phase*13)%5)*0.18);
      }); renderer.render(scene,camera); };
    animate(); const resize=()=>{ camera.aspect=element.clientWidth/Math.max(1,element.clientHeight); camera.updateProjectionMatrix(); renderer.setSize(element.clientWidth,element.clientHeight,false); }; resize(); window.addEventListener("resize",resize);
    return()=>{ cancelAnimationFrame(id); renderer.domElement.removeEventListener("pointermove",onMove); renderer.domElement.removeEventListener("click",onClick); window.removeEventListener("food-process-stage-select",onStage); window.removeEventListener("food-process-open-inspection",onOpenInspection); window.removeEventListener("resize",resize); renderer.dispose(); if(element.contains(renderer.domElement)) element.removeChild(renderer.domElement); };
  }, []);
  const stage=stages[selected]; const select=(i:number)=>{setSelected(i);window.dispatchEvent(new CustomEvent("food-process-stage-select",{detail:i}));}; const openInspection=()=>window.dispatchEvent(new CustomEvent("food-process-open-inspection",{detail:selected}));
  return <section className="process-line-overview"><div className="process-line-heading"><div><span>PRODUCTION LINE · MATERIAL TRANSFORMATION</span><h2>Understand what happens to the sugarcane by watching it change</h2></div><p>The machines are educational cutaway models: the stalk is cut, shredded, squeezed into juice and bagasse, clarified, concentrated, crystallized, separated and dried.</p></div><div ref={mount} className="process-line-canvas" aria-label="Interactive 3D sugarcane material transformation process" /><div className="process-line-stages">{stages.map((item,index)=><button key={item.stepId} type="button" className={selected===index?"process-line-stage active":"process-line-stage"} onClick={()=>select(index)}><strong>{String(index+1).padStart(2,"0")}</strong><span>{item.name}</span><small>{item.equipmentId}</small></button>)}</div><div className="process-line-selected"><div><span>SELECTED EQUIPMENT · STAGE {selected+1}</span><strong>{stage.equipmentId}</strong><h3>{stage.name}</h3><p>{stage.description}</p></div><div className="selected-flow"><span>INPUT · {stage.inputStreams.map(s=>s.materialId).join(" + ")}</span><span>OUTPUT · {stage.outputStreams.map(s=>s.materialId).join(" + ")}</span><button type="button" onClick={openInspection}>View Details · نمایش جزئیات</button></div></div></section>;
}
