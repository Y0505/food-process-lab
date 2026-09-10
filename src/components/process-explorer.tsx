"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const model = buildSugarcaneVisualizationModel();

type Lesson = { title: string; what: string; watch: string[]; outputs: string[] };
const lessons: Record<string, Lesson> = {
  preparation: { title: "Prepare the cane", what: "The feed is presented and conditioned before size reduction. Follow the cane path through the roller bed and watch how the feed is continuously moved toward the next unit.", watch: ["Cane feed entering", "Roller/conveyor movement", "Continuous feed direction"], outputs: ["Prepared cane", "Feed to shredding"] },
  shredding: { title: "Open the cane structure", what: "Mechanical size reduction breaks the cane structure and exposes more material for the extraction step. The internal view makes the rotating shaft and cutting zone visible.", watch: ["Rotating shaft", "Cutting elements", "Smaller cane/fiber pieces"], outputs: ["Reduced-size cane", "Fiber-rich material"] },
  extraction: { title: "Separate juice from fiber", what: "Prepared cane passes through the extraction zone. Mechanical compression is represented by counter-rotating rollers: liquid juice is released downward while fibrous bagasse continues onward.", watch: ["Cane entering the nip", "Juice droplets leaving the fiber", "Bagasse leaving the rollers"], outputs: ["Juice stream", "Bagasse / fiber-rich stream"] },
  clarification: { title: "Clarify the juice", what: "The extracted juice enters a vessel where suspended material is represented settling through the liquid. The clearer upper phase moves toward the outlet while solids concentrate lower in the vessel.", watch: ["Feed entering", "Suspended solids settling", "Clarified overflow"], outputs: ["Clarified juice", "Removed solids fraction"] },
  evaporation: { title: "Concentrate the juice", what: "Heat is transferred into the liquid and water leaves as vapor. The internal model exposes heating surfaces, the liquid region and the vapor path so the concentration mechanism is visible.", watch: ["Liquid around heating surfaces", "Vapor rising", "Concentrated liquor leaving"], outputs: ["Concentrated juice", "Water vapor"] },
  crystallization: { title: "Grow sugar crystals", what: "Concentrated liquor is agitated while the model represents the appearance and growth of solid sugar crystals. The important visual distinction is between the liquid phase and the emerging crystal population.", watch: ["Agitator movement", "Crystal nuclei", "Crystal growth in the liquor"], outputs: ["Crystal-containing massecuite", "Mother-liquor-rich phase"] },
  centrifugation: { title: "Separate crystals and mother liquor", what: "The basket rotates and the mixture separates. Sugar crystals are represented accumulating toward the basket wall while the liquid-rich fraction follows a separate outlet path.", watch: ["Rotating basket", "Crystal accumulation", "Liquid leaving separately"], outputs: ["Sugar-rich crystals", "Mother liquor-rich stream"] },
  drying: { title: "Dry the sugar", what: "Sugar crystals travel through a drying chamber while process air contacts the solids. The view makes the solid path and the moisture-carrying air path visible at the same time.", watch: ["Sugar granules moving", "Air circulation", "Moisture leaving the chamber"], outputs: ["Dry sugar", "Moist exhaust air"] },
};

function m(color: number, metalness = .35, roughness = .45) { return new THREE.MeshStandardMaterial({ color, metalness, roughness }); }
function addBox(g: THREE.Group, s: [number, number, number], p: [number, number, number], material: THREE.Material) { const o = new THREE.Mesh(new THREE.BoxGeometry(...s), material); o.position.set(...p); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; }
function addCyl(g: THREE.Group, r: number, h: number, p: [number, number, number], material: THREE.Material, segments = 24) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material); o.position.set(...p); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; }
function addPipe(g: THREE.Group, a: [number, number, number], b: [number, number, number], color = 0x8daeb1, radius = .065) { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va); const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 12), m(color, .75, .3)); o.position.copy(va).add(vb).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.castShadow = true; g.add(o); return o; }

function buildInterior(stageIndex: number, animated: THREE.Object3D[]) {
  const g = new THREE.Group();
  const steel = m(0x718a8e, .82, .27), dark = m(0x15262c, .7, .32), copper = m(0x9a7149, .76, .3), fiber = m(0x9a7449, .05, .8), crystal = m(0xf0df9f, .08, .2);
  const juice = new THREE.MeshStandardMaterial({ color: 0x55c68d, transparent: true, opacity: .76, roughness: .16, emissive: 0x123d2b, emissiveIntensity: .45 });
  const liquid = new THREE.MeshStandardMaterial({ color: 0x55b886, transparent: true, opacity: .48, roughness: .18, emissive: 0x113d2c, emissiveIntensity: .5 });
  const vapor = new THREE.MeshStandardMaterial({ color: 0xc3eeeb, transparent: true, opacity: .3, emissive: 0x73b7b3, emissiveIntensity: 1.2 });
  if (stageIndex === 0) {
    addBox(g, [6, .18, 2.7], [0, -1.25, 0], dark);
    for (let i = -5; i <= 5; i++) { const r = addCyl(g, .11, 2.45, [i * .5, -.75, 0], steel, 14); r.rotation.z = Math.PI / 2; animated.push(r); }
    for (let i = 0; i < 12; i++) { const cane = addCyl(g, .075, .9, [-2.5 + i * .44, -.38 + (i % 2) * .15, .18 * Math.sin(i)], fiber, 8); cane.rotation.z = Math.PI / 2; animated.push(cane); }
    addPipe(g, [-3, .15, 0], [3, .15, 0], 0x9b754b, .08);
  } else if (stageIndex === 1) {
    const drum = addCyl(g, 1.0, 3.1, [0, 0, 0], dark, 32); drum.rotation.z = Math.PI / 2; animated.push(drum);
    const shaft = addCyl(g, .12, 4, [0, 0, 0], steel, 16); shaft.rotation.z = Math.PI / 2; animated.push(shaft);
    for (let i = -6; i <= 6; i++) { const knife = addBox(g, [.28, .12, .72], [i * .25, 0, .48], copper); knife.rotation.y = i * .15; animated.push(knife); }
    for (let i = 0; i < 24; i++) { const f = addBox(g, [.24, .07, .08], [-2.5 + (i % 10) * .52, -.4 + (i % 4) * .24, -.5], fiber); animated.push(f); }
    addPipe(g, [-3, 0, 0], [-1.55, 0, 0], 0x9b754b, .08); addPipe(g, [1.55, 0, 0], [3, 0, 0], 0x9b754b, .08);
  } else if (stageIndex === 2) {
    for (const x of [-.8, .8]) { const roller = addCyl(g, .62, 2.9, [x, 0, 0], steel, 36); roller.rotation.z = Math.PI / 2; animated.push(roller); }
    for (let i = 0; i < 20; i++) { const cane = addBox(g, [.13, .13, .95], [-1.7 + (i % 7) * .5, .35 + (i % 3) * .16, -.45 + (i % 2) * .9], fiber); cane.rotation.z = .18; animated.push(cane); }
    addBox(g, [4, .14, 2.2], [0, -1.05, 0], dark); addCyl(g, .92, .18, [0, -.9, 0], juice);
    for (let i = 0; i < 22; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 8), juice); d.position.set(-.8 + (i % 8) * .23, -.5 - (i % 3) * .1, -.25 + (i % 4) * .15); g.add(d); animated.push(d); }
    addPipe(g, [0, -.92, 0], [0, -1.5, 0], 0x59c997, .1);
  } else if (stageIndex === 3) {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 3.5, 48), new THREE.MeshPhysicalMaterial({ color: 0x75c0c3, transparent: true, opacity: .1, transmission: .45, roughness: .08, side: THREE.DoubleSide })); g.add(shell);
    addCyl(g, 1.52, 1.15, [0, -.58, 0], liquid);
    for (const y of [-.3, .15, .6]) addBox(g, [2.55, .07, .16], [0, y, 0], dark);
    for (let i = 0; i < 45; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.045, 7, 7), fiber); s.position.set((Math.random() - .5) * 2.5, -.9 + Math.random() * 1.5, (Math.random() - .5) * 1.35); g.add(s); animated.push(s); }
    addPipe(g, [-2.9, .95, 0], [-1.55, .95, 0], 0x5acb91, .09); addPipe(g, [1.55, .72, 0], [2.9, .72, 0], 0x7edab1, .08);
  } else if (stageIndex === 4) {
    for (let i = -1; i <= 1; i++) { const x = i * 1.45; addCyl(g, .92, 3.1, [x, 0, 0], steel, 32); for (let j = 0; j < 6; j++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.69, .055, 8, 30), copper); ring.position.set(x, -.9 + j * .36, 0); ring.rotation.x = Math.PI / 2; g.add(ring); animated.push(ring); } }
    for (let i = 0; i < 30; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), vapor); p.position.set((Math.random() - .5) * 2.8, .15 + Math.random() * 2.6, (Math.random() - .5) * .8); g.add(p); animated.push(p); }
    addPipe(g, [-3, -.45, 0], [3, -.45, 0], 0x5dc995, .08); addPipe(g, [0, 1.55, 0], [0, 2.9, 0], 0xc6ebe8, .11);
  } else if (stageIndex === 5) {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 3.2, 48), new THREE.MeshPhysicalMaterial({ color: 0x76c2c4, transparent: true, opacity: .1, transmission: .45, roughness: .08, side: THREE.DoubleSide })); g.add(shell); addCyl(g, 1.5, 1.75, [0, -.4, 0], liquid);
    const shaft = addCyl(g, .09, 3.1, [0, 0, 0], steel, 12); animated.push(shaft);
    for (const y of [-.35, .15, .65]) { const arm = addBox(g, [2.45, .1, .13], [0, y, 0], steel); animated.push(arm); }
    for (let i = 0; i < 100; i++) { const r = .18 + Math.random() * 1.18, a = Math.random() * Math.PI * 2; const c = new THREE.Mesh(new THREE.OctahedronGeometry(.035 + Math.random() * .05), crystal); c.position.set(Math.cos(a) * r, -.75 + Math.random() * 1.5, Math.sin(a) * r); g.add(c); animated.push(c); }
  } else if (stageIndex === 6) {
    const basket = addCyl(g, 1.38, 1.05, [0, 0, 0], steel, 44); basket.rotation.z = Math.PI / 2; animated.push(basket);
    for (let r = .42; r < 1.3; r += .2) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .035, 8, 44), steel); ring.rotation.x = Math.PI / 2; g.add(ring); animated.push(ring); }
    const motor = addCyl(g, .25, 2.0, [0, 0, 0], dark, 20); motor.rotation.z = Math.PI / 2; animated.push(motor);
    for (let i = 0; i < 100; i++) { const a = Math.random() * Math.PI * 2, r = .52 + Math.random() * .65; const c = new THREE.Mesh(new THREE.OctahedronGeometry(.045), crystal); c.position.set(Math.cos(a) * r, (Math.random() - .5) * .6, Math.sin(a) * r); g.add(c); animated.push(c); }
    addPipe(g, [1.4, .1, 0], [2.9, .1, 0], 0x75cbaa, .08);
  } else {
    addBox(g, [5, 3, 2.5], [0, 0, 0], m(0x344e53, .55, .35)); const chamber = addBox(g, [3.9, 2.1, 1.9], [0, -.05, 0], new THREE.MeshPhysicalMaterial({ color: 0x7fc9cb, transparent: true, opacity: .08, transmission: .4, side: THREE.DoubleSide })); chamber.castShadow = false;
    for (let i = 0; i < 90; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(.045), crystal); c.position.set(-1.65 + Math.random() * 3.3, -.7 + Math.random() * 1.4, -.7 + Math.random() * 1.4); g.add(c); animated.push(c); }
    for (let i = 0; i < 28; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 8), vapor); a.position.set(-1.7 + Math.random() * 3.4, -.9 + Math.random() * 1.8, -.7 + Math.random() * 1.4); g.add(a); animated.push(a); }
    addPipe(g, [-3, .55, 0], [-1.9, .55, 0], 0x91d9d4, .1); addPipe(g, [1.9, .55, 0], [3, .55, 0], 0x91d9d4, .08);
  }
  return g;
}

function Inspection({ stageIndex, onExit }: { stageIndex: number; onExit: () => void }) {
  const mount = useRef<HTMLDivElement>(null); const stage = model.stages[stageIndex]; const lesson = lessons[stage.stepId];
  useEffect(() => {
    const el = mount.current; if (!el) return; const scene = new THREE.Scene(); scene.background = new THREE.Color(0x061015); scene.fog = new THREE.Fog(0x061015, 10, 25);
    const camera = new THREE.PerspectiveCamera(43, 1, .1, 60); camera.position.set(0, 1.1, 8.6); camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xaadce0, 0x071014, 2)); const key = new THREE.DirectionalLight(0xf2ffff, 3.5); key.position.set(-5, 8, 7); key.castShadow = true; scene.add(key); const fill = new THREE.PointLight(0x4fb9c4, 16, 18, 2); fill.position.set(0, 2, 5); scene.add(fill); const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 64), m(0x0b191e, .15, .82)); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.38; floor.receiveShadow = true; scene.add(floor);
    const animated: THREE.Object3D[] = []; const interior = buildInterior(stageIndex, animated); scene.add(interior);
    const resize = () => { const w = el.clientWidth; const h = Math.max(470, Math.min(650, w * .56)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }; resize(); window.addEventListener("resize", resize);
    let frame = 0; const timer = new THREE.Timer(); const animate = () => { frame = requestAnimationFrame(animate); timer.update(); const t = timer.getElapsed(); interior.rotation.y = Math.sin(t * .16) * .1; animated.forEach((o, i) => { if ([1, 2, 4, 5, 6].includes(stageIndex)) o.rotation.y += .012 + (i % 4) * .003; if ([3, 4, 5, 7].includes(stageIndex)) o.position.y += Math.sin(t * 1.5 + i) * .0012; }); renderer.render(scene, camera); }; animate();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.dispose(); if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement); scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const mm = o.material; if (Array.isArray(mm)) mm.forEach((x) => x.dispose()); else mm.dispose(); } }); };
  }, [stageIndex]);
  return <section className="inspection-shell"><header className="inspection-header"><button className="inspection-back" onClick={onExit}>← Back to plant</button><div><span className="inspection-eyebrow">INSIDE EQUIPMENT · STAGE {stageIndex + 1}/8</span><h2>{lesson.title}</h2></div><code>{stage.equipmentId}</code></header><div className="inspection-layout"><div className="inspection-view"><div ref={mount} className="inspection-canvas"/><div className="inspection-overlay"><span>INTERNAL MODEL</span><span>● MATERIAL FLOW</span><span>● PROCESS MECHANISM</span></div></div><aside className="inspection-lesson"><span className="lesson-kicker">WHAT A FOOD PROCESS ENGINEER SHOULD SEE</span><p>{lesson.what}</p><h3>Observe</h3><ul>{lesson.watch.map((x) => <li key={x}>{x}</li>)}</ul><h3>Leaving the unit</h3>{lesson.outputs.map((x) => <div className="lesson-output" key={x}>{x}</div>)}<div className="lesson-warning">Conceptual educational visualization. Geometry is not an engineering drawing and does not imply unverified dimensions or operating conditions.</div></aside></div></section>;
}

export default function ProcessExplorer() {
  const [stageIndex, setStageIndex] = useState(0); const [inside, setInside] = useState(false); const stages = useMemo(() => model.stages, []); const stage = stages[stageIndex];
  if (inside) return <Inspection stageIndex={stageIndex} onExit={() => setInside(false)} />;
  return <section className="explorer-shell"><div className="explorer-top"><div><span className="explorer-eyebrow">PROCESS EXPLORER</span><h2>Travel through the sugar plant</h2><p>Select a unit. Then enter it and inspect the mechanism from the inside.</p></div><div className="explorer-status"><span>ACTIVE</span><strong>{stage.name}</strong><small>{stage.equipmentId}</small></div></div><div className="stage-strip">{stages.map((s, i) => <button key={s.stepId} className={`stage-card ${i === stageIndex ? "selected" : ""}`} onClick={() => setStageIndex(i)}><b>{String(i + 1).padStart(2, "0")}</b><strong>{s.name}</strong><small>{s.equipmentId}</small></button>)}</div><div className="explorer-stage"><div className="stage-visual"><div className="mini-vessel"><span className="mini-flow flow-1"/><span className="mini-flow flow-2"/><span className="mini-ring"/></div><div className="stage-direction">FEED <i/> PROCESS <i/> OUTPUT</div></div><div className="stage-info"><span>STAGE {stageIndex + 1} · INTERNAL INSPECTION AVAILABLE</span><h3>{lessons[stage.stepId].title}</h3><p>{lessons[stage.stepId].what}</p><div className="stage-outputs">{lessons[stage.stepId].outputs.map((x) => <span key={x}>{x}</span>)}</div><button className="enter-equipment" onClick={() => setInside(true)}>Enter equipment <b>→</b></button></div></div><div className="explorer-footer"><span>8 process stages</span><span>Material state driven by deterministic simulation</span><span>Original procedural inspection geometry</span></div></section>;
}
