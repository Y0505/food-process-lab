"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const stages = [
  { id: "preparation", no: "01", name: "Cane Preparation", short: "Cutting & preparation", input: "Whole sugarcane", output: "Prepared billets", color: 0x9eb64c },
  { id: "shredding", no: "02", name: "Shredding", short: "Cell structure opened", input: "Prepared billets", output: "Shredded cane", color: 0xc09a58 },
  { id: "extraction", no: "03", name: "Juice Extraction", short: "Mechanical pressing", input: "Shredded cane", output: "Juice + bagasse", color: 0x65a844 },
  { id: "clarification", no: "04", name: "Juice Clarification", short: "Solids separation", input: "Raw juice", output: "Clarified juice", color: 0x8cbf5a },
  { id: "evaporation", no: "05", name: "Evaporation", short: "Water removal", input: "Clarified juice", output: "Concentrated syrup", color: 0xc07a43 },
  { id: "crystallization", no: "06", name: "Crystallization", short: "Crystal formation", input: "Syrup", output: "Sugar crystals + mother liquor", color: 0xe3c67e },
  { id: "centrifugation", no: "07", name: "Centrifugation", short: "Crystal separation", input: "Massecuite", output: "Sugar + molasses", color: 0xb18b59 },
  { id: "drying", no: "08", name: "Sugar Drying", short: "Moisture reduction", input: "Wet sugar", output: "Dry sugar", color: 0xf0dfb4 },
] as const;
type Stage = (typeof stages)[number];
type Machine = THREE.Group & { userData: { stageId?: string } };

const M = {
  steel: new THREE.MeshStandardMaterial({ color: 0x879294, metalness: 0.92, roughness: 0.22 }),
  brushed: new THREE.MeshStandardMaterial({ color: 0xc4c9c8, metalness: 0.96, roughness: 0.18 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1a2224, metalness: 0.82, roughness: 0.3 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x39484a, metalness: 0.78, roughness: 0.3 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb27b45, metalness: 0.8, roughness: 0.25 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x111617, roughness: 0.9 }),
  green: new THREE.MeshStandardMaterial({ color: 0x8da84d, roughness: 0.68 }),
  cane: new THREE.MeshStandardMaterial({ color: 0x9cac54, roughness: 0.75 }),
  fiber: new THREE.MeshStandardMaterial({ color: 0x8c6541, roughness: 0.92 }),
  juice: new THREE.MeshPhysicalMaterial({ color: 0x78a83c, roughness: 0.2, transmission: 0.08, transparent: true, opacity: 0.92 }),
  syrup: new THREE.MeshPhysicalMaterial({ color: 0x70401f, roughness: 0.25, transmission: 0.02, transparent: true, opacity: 0.94 }),
  sugar: new THREE.MeshStandardMaterial({ color: 0xf0dfad, roughness: 0.38 }),
  molasses: new THREE.MeshStandardMaterial({ color: 0x241712, roughness: 0.5 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x8fd2c7, transmission: 0.75, roughness: 0.04, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }),
  steam: new THREE.MeshBasicMaterial({ color: 0xeaf5f2, transparent: true, opacity: 0.15, depthWrite: false }),
};

function mesh(g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, p: [number, number, number] = [0, 0, 0]) {
  const o = new THREE.Mesh(geo, mat); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function box(g: THREE.Object3D, s: [number, number, number], p: [number, number, number], mat: THREE.Material) { return mesh(g, new THREE.BoxGeometry(...s), mat, p); }
function cyl(g: THREE.Object3D, r: number, h: number, p: [number, number, number], mat: THREE.Material, radial = 32) { return mesh(g, new THREE.CylinderGeometry(r, r, h, radial), mat, p); }
function torus(g: THREE.Object3D, r: number, tube: number, p: [number, number, number], mat: THREE.Material, rot: [number, number, number] = [0, 0, 0]) { const o = mesh(g, new THREE.TorusGeometry(r, tube, 10, 40), mat, p); o.rotation.set(...rot); return o; }
function sphere(g: THREE.Object3D, r: number, p: [number, number, number], mat: THREE.Material) { return mesh(g, new THREE.SphereGeometry(r, 16, 12), mat, p); }
function pipe(g: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) { const d = b.clone().sub(a); const o = mesh(g, new THREE.CylinderGeometry(r, r, d.length(), 18), mat); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o; }
function bolts(g: THREE.Object3D, center: [number, number, number], count: number, radius: number, spread: number, mat = M.brushed) { for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count; sphere(g, radius, [center[0] + Math.cos(a) * spread, center[1], center[2] + Math.sin(a) * spread], mat); } }
function flange(g: THREE.Object3D, p: [number, number, number], axis: "x" | "y" | "z", radius: number, mat = M.brushed) { const o = cyl(g, radius, 0.09, p, mat, 32); if (axis === "x") o.rotation.z = Math.PI / 2; if (axis === "z") o.rotation.x = Math.PI / 2; bolts(g, p, 8, 0.025, radius * 0.72); return o; }
function labelPlate(g: THREE.Object3D, p: [number, number, number], w: number) { box(g, [w, 0.16, 0.05], p, M.dark); box(g, [w * 0.72, 0.025, 0.015], [p[0], p[1], p[2] + 0.03], M.brass); }
function tag(g: Machine, id: string) { g.traverse(c => { c.userData.stageId = id; }); g.userData.stageId = id; return g; }

function motor(g: THREE.Object3D, p: [number, number, number], scale = 1) {
  const m = new THREE.Group(); m.position.set(...p); g.add(m);
  cyl(m, 0.27 * scale, 0.72 * scale, [0, 0, 0], M.dark, 24).rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++) box(m, [0.035 * scale, 0.48 * scale, 0.025 * scale], [-0.05 * scale + i * 0.02 * scale, 0, 0.27 * scale], M.brushed);
  cyl(m, 0.08 * scale, 0.18 * scale, [0.44 * scale, 0, 0], M.brass, 16).rotation.z = Math.PI / 2;
  box(m, [0.18 * scale, 0.55 * scale, 0.55 * scale], [-0.48 * scale, 0, 0], M.frame);
  return m;
}

function buildMachine(stage: Stage, x: number, z: number): Machine {
  const g = new THREE.Group() as Machine; g.position.set(x, 0, z); tag(g, stage.id);
  box(g, [3.7, 0.16, 2.65], [0, -1.28, 0], M.rubber);
  box(g, [3.35, 0.18, 2.35], [0, -1.15, 0], M.frame);
  labelPlate(g, [0, 1.62, -1.04], 0.95);

  if (stage.id === "preparation") {
    box(g, [2.2, 1.25, 1.65], [0, -0.1, 0], M.frame);
    box(g, [1.95, 0.22, 1.35], [0, 0.56, 0], M.brushed);
    for (let i = 0; i < 10; i++) { const cane = cyl(g, 0.07, 0.85, [-1.2 + i * 0.25, 0.78, -0.48 + (i % 3) * 0.45], M.cane, 12); cane.rotation.z = Math.PI / 2; }
    const wheel = new THREE.Group(); wheel.position.set(0.35, 0, 0); g.add(wheel); const disc = cyl(wheel, 0.68, 0.18, [0, 0, 0], M.steel, 48); disc.rotation.x = Math.PI / 2;
    for (let i = 0; i < 10; i++) { const blade = box(wheel, [0.62, 0.055, 0.07], [0.2, 0, 0], M.brushed); blade.rotation.z = i * Math.PI / 5; }
    motor(g, [1.25, -0.02, 0], 0.85); bolts(g, [-1.0, -0.65, 0], 6, 0.03, 0.5);
  }
  if (stage.id === "shredding") {
    box(g, [2.55, 1.75, 1.9], [0, 0, 0], M.frame);
    box(g, [2.1, 0.18, 1.5], [0, 0.92, 0], M.brushed);
    const rotor = new THREE.Group(); rotor.position.set(0, 0, 0); g.add(rotor); const shaft = cyl(rotor, 0.1, 1.75, [0, 0, 0], M.brass, 20); shaft.rotation.z = Math.PI / 2;
    for (let i = 0; i < 14; i++) { const tooth = box(rotor, [0.8, 0.08, 0.11], [0.22, 0, 0], M.brushed); tooth.rotation.z = i * Math.PI / 7; }
    motor(g, [1.35, 0, 0], 0.9); for (let i = 0; i < 24; i++) sphere(g, 0.045, [-0.9 + (i % 8) * 0.24, -0.82, -0.55 + (i % 5) * 0.28], M.fiber);
    flange(g, [1.48, 0, 0], "x", 0.2);
  }
  if (stage.id === "extraction") {
    box(g, [2.8, 0.35, 1.9], [0, -0.8, 0], M.dark);
    const ys = [-0.48, 0, 0.48];
    ys.forEach((y, i) => { const r = cyl(g, 0.47, 1.9, [0, y, 0], i === 1 ? M.brushed : M.steel, 48); r.rotation.x = Math.PI / 2; torus(g, 0.42, 0.025, [0, y, 0], M.dark, [Math.PI / 2, 0, 0]); torus(g, 0.36, 0.018, [0, y, 0], M.brass, [Math.PI / 2, 0, 0]); });
    pipe(g, new THREE.Vector3(-1.55, 0.45, 0), new THREE.Vector3(-0.65, 0.45, 0), 0.11, M.cane); pipe(g, new THREE.Vector3(0.55, -0.78, 0), new THREE.Vector3(1.55, -0.78, 0), 0.09, M.juice);
    flange(g, [-0.7, 0.45, 0], "x", 0.16); flange(g, [0.62, -0.78, 0], "x", 0.15); motor(g, [1.15, 0.65, 0.78], 0.72);
    for (let i = 0; i < 20; i++) { const c = cyl(g, 0.045, 0.5, [-1.65 + (i % 5) * 0.34, 0.82, -0.4 + (i % 4) * 0.26], M.cane, 10); c.rotation.z = Math.PI / 2; }
  }
  if (stage.id === "clarification") {
    cyl(g, 1.05, 2.25, [0, 0.05, 0], M.glass, 64); torus(g, 1.02, 0.055, [0, 1.12, 0], M.brushed); torus(g, 1.02, 0.055, [0, -1.08, 0], M.brushed);
    cyl(g, 0.86, 0.75, [0, -0.55, 0], M.juice, 48); cyl(g, 0.84, 0.22, [0, -0.97, 0], M.molasses, 48);
    cyl(g, 0.055, 1.9, [0, 0.35, 0], M.brass, 16); for (const y of [-0.52, -0.72]) { const rake = box(g, [1.45, 0.06, 0.08], [0, y, 0], M.brushed); rake.rotation.z = y * 1.2; }
    pipe(g, new THREE.Vector3(0.85, 0.45, 0), new THREE.Vector3(1.5, 0.45, 0), 0.08, M.steel); flange(g, [1.48, 0.45, 0], "x", 0.14);
    for (let i = 0; i < 28; i++) sphere(g, 0.025 + (i % 3) * 0.006, [Math.sin(i * 1.8) * 0.58, -0.12 + (i % 7) * 0.055, Math.cos(i * 2.1) * 0.58], M.fiber);
  }
  if (stage.id === "evaporation") {
    for (let i = -1; i <= 1; i++) { const x0 = i * 0.75; cyl(g, 0.58, 2.25, [x0, 0, 0], M.glass, 48); torus(g, 0.57, 0.05, [x0, 1.1, 0], M.brushed); torus(g, 0.57, 0.05, [x0, -1.1, 0], M.brushed); cyl(g, 0.47, 0.92, [x0, -0.52, 0], M.syrup, 40); for (let j = 0; j < 5; j++) torus(g, 0.38, 0.026, [x0, -0.72 + j * 0.22, 0], M.brass); for (let j = 0; j < 5; j++) sphere(g, 0.035, [x0 + Math.sin(j) * 0.2, 0.25 + j * 0.18, Math.cos(j) * 0.2], M.steam); }
    pipe(g, new THREE.Vector3(-1.55, 0.72, 0), new THREE.Vector3(1.55, 0.72, 0), 0.065, M.steel); flange(g, [-1.5, 0.72, 0], "x", 0.12); motor(g, [1.5, -0.1, 0.8], 0.55);
  }
  if (stage.id === "crystallization") {
    cyl(g, 1.05, 1.9, [0, -0.02, 0], M.steel, 56); cyl(g, 0.88, 1.0, [0, -0.43, 0], M.syrup, 48); torus(g, 1.02, 0.05, [0, 0.94, 0], M.brushed); cyl(g, 0.055, 1.85, [0, 0.62, 0], M.brass, 16);
    for (let i = 0; i < 6; i++) { const arm = box(g, [0.8, 0.06, 0.07], [0.36, -0.45, 0], M.brushed); arm.rotation.y = i * Math.PI / 3; }
    for (let i = 0; i < 45; i++) { const c = sphere(g, 0.035 + (i % 3) * 0.01, [Math.sin(i * 2.2) * 0.7, -0.05 + (i % 10) * 0.065, Math.cos(i * 1.7) * 0.7], M.sugar); c.scale.setScalar(0.6 + (i % 4) * 0.18); }
    motor(g, [1.05, 0.8, 0], 0.65);
  }
  if (stage.id === "centrifugation") {
    box(g, [2.45, 1.65, 2.0], [0, 0, 0], M.frame); box(g, [2.1, 1.35, 1.65], [0, 0.05, 0], M.dark);
    const basket = new THREE.Group(); basket.position.set(0, 0, 0); g.add(basket); const b = cyl(basket, 0.78, 1.45, [0, 0, 0], M.brushed, 48); b.rotation.x = Math.PI / 2;
    for (let i = 0; i < 28; i++) { const h = cyl(basket, 0.025, 0.03, [Math.cos(i * 0.72) * 0.7, Math.sin(i * 0.72) * 0.7, 0], M.dark, 8); h.rotation.x = Math.PI / 2; }
    cyl(g, 0.08, 1.5, [0, 0, 0], M.brass, 16).rotation.z = Math.PI / 2; motor(g, [1.25, -0.45, 0], 0.7); pipe(g, new THREE.Vector3(0, -0.8, 0), new THREE.Vector3(1.35, -0.8, 0), 0.08, M.molasses);
    for (let i = 0; i < 22; i++) sphere(g, 0.035, [Math.cos(i) * 0.65, Math.sin(i * 1.8) * 0.55, 0.08], M.sugar);
  }
  if (stage.id === "drying") {
    const drum = new THREE.Group(); drum.position.set(0, 0, 0); g.add(drum); const d = cyl(drum, 0.78, 2.2, [0, 0, 0], M.brushed, 48); d.rotation.z = Math.PI / 2;
    for (let i = 0; i < 7; i++) { const ring = torus(drum, 0.8, 0.035, [-0.9 + i * 0.3, 0, 0], M.dark, [0, Math.PI / 2, 0]); ring.rotation.y = Math.PI / 2; }
    for (let i = 0; i < 36; i++) sphere(drum, 0.035, [-0.9 + (i % 9) * 0.22, -0.45 + (i % 5) * 0.22, 0.05], M.sugar);
    pipe(g, new THREE.Vector3(-1.6, 0.55, 0), new THREE.Vector3(-0.9, 0.55, 0), 0.08, M.sugar); pipe(g, new THREE.Vector3(1.0, 0.55, 0), new THREE.Vector3(1.6, 0.55, 0), 0.08, M.steel); motor(g, [0, -0.05, 0.95], 0.72);
  }
  return g;
}

export function ImmersiveSugarPlant() {
  const mountRef = useRef<HTMLDivElement>(null); const selectedRef = useRef<string | null>(null); const insideRef = useRef(false);
  const [selected, setSelected] = useState<Stage | null>(null); const [inside, setInside] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current; const scene = new THREE.Scene(); scene.background = new THREE.Color(0x071012); scene.fog = new THREE.Fog(0x071012, 18, 42);
    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 100); camera.position.set(13, 10, 16);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(mount.clientWidth, mount.clientHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; mount.appendChild(renderer.domElement);
    const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.38, 0.65, 0.82)); composer.addPass(new OutputPass());
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.055; controls.minDistance = 3.2; controls.maxDistance = 30; controls.target.set(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xb7d1cf, 0x1a211f, 1.6)); const key = new THREE.DirectionalLight(0xfff2d5, 3.0); key.position.set(8, 15, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); scene.add(key); const fill = new THREE.PointLight(0x66c9b4, 35, 22); fill.position.set(0, 5, 2); scene.add(fill);
    const factory = new THREE.Group(); scene.add(factory); box(factory, [34, 0.25, 22], [0, -1.48, 0], M.dark);
    for (let x = -15; x <= 15; x += 5) { for (let z = -9; z <= 9; z += 6) { box(factory, [0.04, 0.03, 22], [x, -1.32, 0], M.brushed); box(factory, [34, 0.03, 0.04], [0, -1.31, z], M.brushed); } }
    for (const x of [-15, 0, 15]) for (const z of [-9, 9]) { box(factory, [0.35, 8, 0.35], [x, 2.5, z], M.frame); box(factory, [30, 0.25, 0.25], [0, 6.5, z], M.frame); }
    box(factory, [30, 0.18, 0.18], [0, 6.9, -2], M.steel); box(factory, [30, 0.18, 0.18], [0, 7.2, 2], M.steel);
    const positions: [number, number][] = [[-11, -5],[-4, -5],[3,-5],[10,-5],[-8,4],[-1,4],[6,4],[13,4]];
    const machines = stages.map((s, i) => buildMachine(s, positions[i][0], positions[i][1])); machines.forEach(m => factory.add(m));
    for (let i = 0; i < positions.length - 1; i++) { const a = new THREE.Vector3(positions[i][0] + 1.8, 0.35, positions[i][1]); const b = new THREE.Vector3(positions[i + 1][0] - 1.8, 0.35, positions[i + 1][1]); pipe(factory, a, new THREE.Vector3((a.x + b.x) / 2, 1.5, a.z), 0.055, M.steel); pipe(factory, new THREE.Vector3((a.x + b.x) / 2, 1.5, a.z), new THREE.Vector3((a.x + b.x) / 2, 1.5, b.z), 0.055, M.steel); pipe(factory, new THREE.Vector3((a.x + b.x) / 2, 1.5, b.z), b, 0.055, M.steel); }
    const particles = Array.from({ length: 100 }, (_, i) => { const p = sphere(factory, 0.045 + (i % 3) * 0.015, [0, 0, 0], i % 2 ? M.sugar : M.green); p.userData.t = i / 100; return p; });
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let targetPos = camera.position.clone(); let targetLook = controls.target.clone(); let raf = 0;
    const onPointer = (e: PointerEvent) => { const r = mount.getBoundingClientRect(); pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(machines, true); const id = hits[0]?.object.userData.stageId as string | undefined; if (!id || insideRef.current) return; const stage = stages.find(s => s.id === id) ?? null; if (!stage) return; selectedRef.current = stage.id; setSelected(stage); const m = machines.find(x => x.userData.stageId === stage.id)!; const wp = new THREE.Vector3(); m.getWorldPosition(wp); targetPos = wp.clone().add(new THREE.Vector3(5.0, 3.6, 5.0)); targetLook = wp.clone().add(new THREE.Vector3(0, 0.3, 0)); };
    renderer.domElement.addEventListener("pointerdown", onPointer);
    const enter = () => { const id = selectedRef.current; if (!id) return; const m = machines.find(x => x.userData.stageId === id); if (!m) return; const wp = new THREE.Vector3(); m.getWorldPosition(wp); insideRef.current = true; setInside(true); targetPos = wp.clone().add(new THREE.Vector3(2.8, 1.7, 3.0)); targetLook = wp.clone(); machines.forEach(x => { if (x !== m) x.visible = false; }); };
    const exit = () => { insideRef.current = false; setInside(false); machines.forEach(x => x.visible = true); targetPos = new THREE.Vector3(13, 10, 16); targetLook = new THREE.Vector3(0, 0, 0); };
    (mount as HTMLDivElement & { enter?: () => void; exit?: () => void }).enter = enter; (mount as HTMLDivElement & { enter?: () => void; exit?: () => void }).exit = exit;
    const animate = (time: number) => { const t = time * 0.001; raf = requestAnimationFrame(animate); particles.forEach((p, i) => { const u = (p.userData.t + t * 0.06) % 1; const a = positions[i % positions.length]; const b = positions[(i + 1) % positions.length]; p.position.set(THREE.MathUtils.lerp(a[0], b[0], u), 0.15 + Math.sin(t * 2 + i) * 0.08, THREE.MathUtils.lerp(a[1], b[1], u)); }); camera.position.lerp(targetPos, 0.035); controls.target.lerp(targetLook, 0.05); controls.update(); composer.render(); };
    raf = requestAnimationFrame(animate);
    const resize = () => { const w = mount.clientWidth, h = mount.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); composer.setSize(w, h); };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); renderer.domElement.removeEventListener("pointerdown", onPointer); renderer.dispose(); mount.innerHTML = ""; };
  }, []);

  const host = mountRef.current as (HTMLDivElement & { enter?: () => void; exit?: () => void }) | null;
  return <div ref={mountRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: 700 }}>
    <div style={{ position: "absolute", left: 24, top: 22, zIndex: 5, color: "#edf7f4", pointerEvents: "none" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.62 }}>FOOD PROCESS LAB · SUGAR HOUSE</div>
      <div style={{ fontSize: 27, fontWeight: 650, marginTop: 8 }}>Production Floor</div>
      <div style={{ fontSize: 12, opacity: 0.58, marginTop: 5 }}>Select a unit to inspect the transformation.</div>
    </div>
    <div style={{ position: "absolute", right: 22, top: 22, zIndex: 5, padding: "8px 11px", border: "1px solid rgba(150,220,205,.18)", borderRadius: 999, background: "rgba(4,13,15,.58)", color: "#b8d9d2", fontSize: 11, letterSpacing: 1.5 }}>LIVE PROCESS MODEL</div>
    {selected && <div style={{ position: "absolute", right: 22, bottom: 22, zIndex: 6, width: 320, padding: 20, borderRadius: 18, border: "1px solid rgba(160,220,210,.2)", background: "rgba(5,13,15,.9)", color: "#edf7f4", backdropFilter: "blur(14px)" }}>
      <div style={{ fontSize: 10, letterSpacing: 2, opacity: 0.5 }}>UNIT {selected.no}</div><div style={{ fontSize: 21, fontWeight: 650, margin: "6px 0 3px" }}>{selected.name}</div><div style={{ fontSize: 12, opacity: 0.58 }}>{selected.short}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}><div><div style={{ fontSize: 9, opacity: 0.42 }}>INPUT</div><div style={{ fontSize: 11, marginTop: 4 }}>{selected.input}</div></div><div><div style={{ fontSize: 9, opacity: 0.42 }}>OUTPUT</div><div style={{ fontSize: 11, marginTop: 4 }}>{selected.output}</div></div></div>
      <button onClick={() => host?.enter?.()} style={{ width: "100%", marginTop: 18, padding: "12px 14px", border: 0, borderRadius: 10, background: "#d9eadf", color: "#091210", fontWeight: 750, cursor: "pointer" }}>ENTER MACHINE</button>
    </div>}
    {inside && <button onClick={() => host?.exit?.()} style={{ position: "absolute", left: 22, bottom: 22, zIndex: 7, padding: "12px 15px", borderRadius: 10, border: "1px solid rgba(220,245,235,.2)", background: "rgba(5,13,15,.82)", color: "#edf7f4", cursor: "pointer" }}>← RETURN TO FACTORY</button>}
  </div>;
}
