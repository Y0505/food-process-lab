"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const STAGES = [
  { id: "preparation", no: "01", name: "Cane Preparation", input: "Whole cane", output: "Prepared billets", color: 0x9eaf5b, x: -14 },
  { id: "shredding", no: "02", name: "Shredding", input: "Billets", output: "Opened fiber", color: 0xb9a56b, x: -10 },
  { id: "extraction", no: "03", name: "Juice Extraction", input: "Shredded cane", output: "Juice + bagasse", color: 0x8c6834, x: -6 },
  { id: "clarification", no: "04", name: "Juice Clarification", input: "Raw juice", output: "Clarified juice", color: 0x72b8bd, x: -2 },
  { id: "evaporation", no: "05", name: "Evaporation", input: "Clarified juice", output: "Syrup", color: 0x75471f, x: 2 },
  { id: "crystallization", no: "06", name: "Crystallization", input: "Syrup", output: "Massecuite", color: 0xb58b49, x: 6 },
  { id: "centrifugation", no: "07", name: "Centrifugation", input: "Massecuite", output: "Sugar + molasses", color: 0xf1dca0, x: 10 },
  { id: "drying", no: "08", name: "Sugar Drying", input: "Wet sugar", output: "Dry sugar", color: 0xc7d1cf, x: 14 },
] as const;
type Stage = (typeof STAGES)[number];

const steel = (color = 0x718285, metalness = 0.72, roughness = 0.3) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const cube = (g: THREE.Object3D, size: [number, number, number], p: [number, number, number], m: THREE.Material) => { const o = new THREE.Mesh(new THREE.BoxGeometry(...size), m); o.position.set(...p); g.add(o); return o; };
const cylinder = (g: THREE.Object3D, r: number, h: number, p: [number, number, number], m: THREE.Material, rot?: [number, number, number]) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), m); o.position.set(...p); if (rot) o.rotation.set(...rot); g.add(o); return o; };
const ring = (g: THREE.Object3D, r: number, tube: number, p: [number, number, number], m: THREE.Material, rot?: [number, number, number]) => { const o = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 40), m); o.position.set(...p); if (rot) o.rotation.set(...rot); g.add(o); return o; };

function buildMachine(s: Stage) {
  const g = new THREE.Group();
  g.userData.stageId = s.id;
  g.position.x = s.x;
  const dark = steel(0x182326, 0.65, 0.42);
  const frame = steel(0x304246, 0.85, 0.28);
  const metal = steel();
  const brass = steel(0xb58b49, 0.88, 0.23);
  cube(g, [3.5, 0.18, 2.5], [0, 0, 0], dark);
  for (const x of [-1.5, 1.5]) for (const z of [-0.8, 0.8]) cube(g, [0.12, 4.2, 0.12], [x, 2.1, z], frame);
  cube(g, [3.3, 0.12, 1.65], [0, 4.05, 0], frame);

  if (s.id === "preparation") {
    cube(g, [2.8, 0.25, 1.3], [0, 1.0, 0], dark);
    for (let i = -5; i <= 5; i++) cube(g, [0.32, 0.14, 1.05], [i * 0.25, 1.25, 0], steel(0x9eaf5b, 0.1, 0.72));
    cylinder(g, 0.72, 0.22, [0, 2.45, 0], brass, [Math.PI / 2, 0, 0]);
  } else if (s.id === "shredding") {
    cube(g, [2.8, 2.2, 1.65], [0, 2.0, 0], dark);
    for (let i = -2; i <= 2; i++) cylinder(g, 0.25, 1.4, [i * 0.42, 2.0, 0], brass, [Math.PI / 2, 0, 0]);
    cube(g, [0.9, 0.45, 1.0], [1.85, 1.15, 0], steel(0xb9a56b, 0.1, 0.78));
  } else if (s.id === "extraction") {
    cube(g, [3.2, 2.45, 1.8], [0, 2.0, 0], dark);
    for (let i = -1; i <= 1; i++) cylinder(g, 0.62, 1.7, [i * 0.78, 2.05, 0], metal, [Math.PI / 2, 0, 0]);
    cube(g, [2.9, 0.3, 1.5], [0, 0.72, 0], steel(0x8c6834, 0.12, 0.58));
    cube(g, [1.05, 0.72, 1.05], [1.85, 1.25, 0], steel(0xb9a56b, 0.1, 0.78));
  } else if (s.id === "clarification") {
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x72b8bd, transparent: true, opacity: 0.32, transmission: 0.4, roughness: 0.18 });
    cylinder(g, 1.32, 3.2, [0, 2.0, 0], glass);
    cylinder(g, 1.08, 0.65, [0, 1.18, 0], steel(0x8c6834, 0.1, 0.58));
    cylinder(g, 1.08, 0.38, [0, 0.75, 0], steel(0x704c3d, 0.1, 0.72));
    cylinder(g, 0.09, 3.0, [0, 2.0, 0], brass);
    ring(g, 0.86, 0.07, [0, 1.18, 0], brass);
  } else if (s.id === "evaporation") {
    for (let i = -1; i <= 1; i++) { cylinder(g, 0.88, 2.6, [i * 1.05, 2.0, 0], metal); ring(g, 0.88, 0.08, [i * 1.05, 1.0, 0], brass); cylinder(g, 0.68, 0.25, [i * 1.05, 0.95, 0], steel(0x75471f, 0.1, 0.55)); }
  } else if (s.id === "crystallization") {
    cylinder(g, 1.3, 3.0, [0, 2.0, 0], metal);
    cylinder(g, 1.05, 0.65, [0, 1.0, 0], steel(0x75471f, 0.1, 0.55));
    cylinder(g, 0.09, 2.8, [0, 2.0, 0], brass);
    for (let i = 0; i < 20; i++) cube(g, [0.09, 0.09, 0.09], [Math.sin(i * 2.1) * 0.78, 1.12 + (i % 3) * 0.13, Math.cos(i * 1.7) * 0.78], steel(0xf1dca0, 0.05, 0.3));
  } else if (s.id === "centrifugation") {
    cylinder(g, 1.35, 2.7, [0, 2.0, 0], dark);
    cylinder(g, 1.08, 1.9, [0, 2.0, 0], brass);
    ring(g, 1.08, 0.09, [0, 2.8, 0], metal);
  } else {
    cylinder(g, 1.05, 2.9, [0, 2.0, 0], metal, [0, 0, Math.PI / 2]);
    for (let i = -1; i <= 1; i++) ring(g, 1.08, 0.1, [i * 0.85, 2.0, 0], brass, [0, Math.PI / 2, 0]);
    cube(g, [1.9, 0.28, 0.85], [0, 1.3, 0], steel(0xf1dca0, 0.05, 0.34));
  }
  return g;
}

function buildInside(s: Stage) {
  const g = new THREE.Group();
  const dark = steel(0x111a1d, 0.6, 0.45);
  const metal = steel();
  const brass = steel(0xb58b49, 0.88, 0.23);
  const juice = steel(0x8c6834, 0.12, 0.58);
  const sugar = steel(0xf1dca0, 0.05, 0.32);
  cube(g, [6, 0.18, 4], [0, -0.1, 0], dark);
  if (s.id === "extraction") {
    for (let i = -1; i <= 1; i++) cylinder(g, 0.75, 3.7, [i * 1.05, 2.1, 0], metal, [Math.PI / 2, 0, 0]);
    cube(g, [5.2, 0.42, 2.6], [0, 0.48, 0], juice);
    for (let i = -7; i <= 7; i++) cube(g, [0.16, 0.12, 0.55], [i * 0.35, 1.15, Math.sin(i) * 0.5], steel(0xb9a56b, 0.1, 0.8));
    cylinder(g, 0.1, 5.3, [0, 2.15, 0], brass, [0, 0, Math.PI / 2]);
  } else if (s.id === "clarification") {
    cylinder(g, 1.75, 3.4, [0, 1.8, 0], juice);
    cylinder(g, 1.52, 0.48, [0, 0.35, 0], steel(0x704c3d, 0.1, 0.72));
    ring(g, 1.3, 0.1, [0, 1.55, 0], brass);
  } else if (s.id === "evaporation") {
    for (let i = -1; i <= 1; i++) { cylinder(g, 0.85, 3.2, [i * 1.35, 1.8, 0], metal); cylinder(g, 0.68, 0.5, [i * 1.35, 0.72, 0], steel(0x75471f, 0.1, 0.55)); }
  } else if (s.id === "crystallization") {
    cylinder(g, 1.9, 3.6, [0, 1.8, 0], metal); cylinder(g, 1.65, 0.85, [0, 0.62, 0], steel(0x75471f, 0.1, 0.5));
    for (let i = 0; i < 45; i++) cube(g, [0.08, 0.08, 0.08], [Math.sin(i * 3.1) * 1.4, 0.9 + (i % 5) * 0.1, Math.cos(i * 2.2) * 1.4], sugar);
  } else if (s.id === "centrifugation") {
    cylinder(g, 1.8, 2.8, [0, 1.8, 0], brass);
    for (let i = 0; i < 28; i++) cube(g, [0.08, 0.08, 0.25], [Math.sin(i * 2.1) * 1.48, 1.3 + (i % 5) * 0.11, Math.cos(i * 2.1) * 1.48], sugar);
  } else if (s.id === "drying") {
    cylinder(g, 1.45, 4.6, [0, 1.8, 0], metal, [0, 0, Math.PI / 2]); cube(g, [3.2, 0.38, 1.2], [0, 0.8, 0], sugar);
  } else if (s.id === "shredding") {
    cube(g, [4.2, 0.7, 2.1], [0, 0.8, 0], steel(0xb9a56b, 0.1, 0.78));
    for (let i = -1; i <= 1; i++) cylinder(g, 0.48, 2.5, [i * 1.05, 2.05, 0], brass, [Math.PI / 2, 0, 0]);
  } else {
    cube(g, [1.5, 0.55, 2.5], [-1.8, 0.9, 0], steel(0x9eaf5b, 0.1, 0.72));
    cylinder(g, 0.95, 0.25, [0, 2.2, 0], brass, [Math.PI / 2, 0, 0]);
    cube(g, [1.6, 0.4, 1.8], [1.7, 0.85, 0], steel(0x9eaf5b, 0.1, 0.72));
  }
  return g;
}

export function ImmersiveSugarPlant() {
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const machinesRef = useRef<THREE.Group[]>([]);
  const [selected, setSelected] = useState<Stage>(STAGES[2]);
  const [inside, setInside] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02080b);
    scene.fog = new THREE.Fog(0x02080b, 25, 62);
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
    camera.position.set(0, 12, 30);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x9ec5c0, 0x061013, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(8, 18, 14); scene.add(key);
    const rim = new THREE.PointLight(0x6de1c5, 12, 30); rim.position.set(0, 8, 3); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 22), new THREE.MeshStandardMaterial({ color: 0x0b1518, metalness: 0.25, roughness: 0.65 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
    for (let x = -30; x <= 30; x += 5) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 20), steel(0x2a3a3d, 0.7, 0.35)); rail.position.set(x, 0.015, 0); scene.add(rail); }

    const overview = new THREE.Group();
    machinesRef.current = STAGES.map((s) => { const g = buildMachine(s); overview.add(g); return g; });
    scene.add(overview);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.07; controls.minDistance = 8; controls.maxDistance = 45; controls.target.set(0, 2.1, 0);
    controlsRef.current = controls;

    let frame = 0;
    const resize = () => { if (!el) return; const w = el.clientWidth; const h = el.clientHeight; camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); renderer.setSize(w, h, false); };
    const onPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(machinesRef.current, true);
      const group = hits[0]?.object;
      let parent: THREE.Object3D | null = group ?? null;
      while (parent && !parent.userData.stageId) parent = parent.parent;
      const id = parent?.userData.stageId as Stage["id"] | undefined;
      if (id) { const stage = STAGES.find((x) => x.id === id); if (stage) setSelected(stage); }
    };
    renderer.domElement.addEventListener("click", onPointer);
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const animate = () => { frame = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); renderer.domElement.removeEventListener("click", onPointer); controls.dispose(); renderer.dispose(); if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement); scene.clear(); };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;
    const existing = scene.getObjectByName("inside-view");
    if (existing) scene.remove(existing);
    if (inside) {
      const g = buildInside(selected); g.name = "inside-view"; scene.add(g);
      camera.position.set(8, 6, 12); controls.target.set(0, 1.8, 0); controls.minDistance = 4; controls.maxDistance = 22;
    } else {
      camera.position.set(selected.x * 0.35, 7.5, 21); controls.target.set(selected.x, 2.0, 0); controls.minDistance = 8; controls.maxDistance = 45;
    }
  }, [selected, inside]);

  const choose = (stage: Stage) => { setSelected(stage); setInside(false); };

  return (
    <section style={{ position: "relative", height: 620, borderRadius: 24, overflow: "hidden", border: "1px solid rgba(157,202,201,.16)", background: "#02080b", isolation: "isolate" }}>
      <div ref={host} aria-label="Interactive sugar factory 3D scene" style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      <div style={{ position: "absolute", zIndex: 20, top: 18, left: 18, width: 245, padding: 14, borderRadius: 16, background: "rgba(3,12,15,.94)", border: "1px solid rgba(157,202,201,.22)", boxShadow: "0 12px 35px rgba(0,0,0,.35)", pointerEvents: "auto" }}>
        <div style={{ color: "#70d0bd", fontSize: 9, fontWeight: 800, letterSpacing: 2 }}>PROCESS UNITS</div>
        <div style={{ marginTop: 10, display: "grid", gap: 5 }}>
          {STAGES.map((stage) => {
            const active = stage.id === selected.id;
            return <button key={stage.id} type="button" onClick={() => choose(stage)} style={{ width: "100%", padding: "9px 10px", borderRadius: 9, border: `1px solid ${active ? "rgba(112,208,189,.65)" : "rgba(157,202,201,.1)"}`, background: active ? "rgba(112,208,189,.13)" : "rgba(255,255,255,.025)", color: active ? "#dff9f3" : "rgba(226,239,238,.65)", textAlign: "left", cursor: "pointer", fontSize: 10 }}>{stage.no} · {stage.name}</button>;
          })}
        </div>
      </div>

      <div style={{ position: "absolute", zIndex: 20, top: 18, right: 18, width: 265, padding: 16, borderRadius: 16, background: "rgba(3,12,15,.94)", border: "1px solid rgba(157,202,201,.22)", boxShadow: "0 12px 35px rgba(0,0,0,.35)", pointerEvents: "auto" }}>
        <div style={{ color: "#70d0bd", fontSize: 9, fontWeight: 800, letterSpacing: 1.8 }}>{inside ? "CUTAWAY INSPECTION" : `UNIT ${selected.no}`}</div>
        <div style={{ marginTop: 7, fontSize: 18, fontWeight: 750 }}>{selected.name}</div>
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ padding: 9, borderRadius: 9, background: "rgba(255,255,255,.035)" }}><div style={{ fontSize: 7, color: "rgba(226,239,238,.38)" }}>INPUT</div><div style={{ marginTop: 4, fontSize: 9 }}>{selected.input}</div></div>
          <div style={{ padding: 9, borderRadius: 9, background: "rgba(255,255,255,.035)" }}><div style={{ fontSize: 7, color: "rgba(226,239,238,.38)" }}>OUTPUT</div><div style={{ marginTop: 4, fontSize: 9 }}>{selected.output}</div></div>
        </div>
        <button type="button" onClick={() => setInside((v) => !v)} style={{ marginTop: 12, width: "100%", padding: "11px 12px", border: 0, borderRadius: 9, background: "#70d0bd", color: "#03100e", fontWeight: 850, fontSize: 10, cursor: "pointer" }}>{inside ? "← RETURN TO FACTORY" : "ENTER CUTAWAY →"}</button>
      </div>

      <div style={{ position: "absolute", zIndex: 10, left: "50%", bottom: 16, transform: "translateX(-50%)", padding: "7px 12px", borderRadius: 999, background: "rgba(3,12,15,.78)", color: "rgba(226,239,238,.5)", fontSize: 8, letterSpacing: 1, pointerEvents: "none", whiteSpace: "nowrap" }}>CLICK A UNIT · DRAG TO ORBIT · SCROLL TO ZOOM</div>
    </section>
  );
}
