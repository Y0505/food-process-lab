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
];

type Stage = (typeof stages)[number];
type Machine = THREE.Group & { userData: { stageId?: string } };

const steel = new THREE.MeshStandardMaterial({ color: 0x6f7b7d, metalness: 0.9, roughness: 0.25 });
const darkSteel = new THREE.MeshStandardMaterial({ color: 0x202b2d, metalness: 0.82, roughness: 0.3 });
const frame = new THREE.MeshStandardMaterial({ color: 0x3f5052, metalness: 0.78, roughness: 0.31 });
const edge = new THREE.MeshStandardMaterial({ color: 0xaab2af, metalness: 0.94, roughness: 0.18 });
const brass = new THREE.MeshStandardMaterial({ color: 0xb57c45, metalness: 0.78, roughness: 0.26 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x101718, metalness: 0.08, roughness: 0.9 });
const cane = new THREE.MeshStandardMaterial({ color: 0x91a94a, roughness: 0.75 });
const caneCut = new THREE.MeshStandardMaterial({ color: 0xc4a866, roughness: 0.78 });
const fiber = new THREE.MeshStandardMaterial({ color: 0x9a7048, roughness: 0.92 });
const juice = new THREE.MeshPhysicalMaterial({ color: 0x79ad3f, roughness: 0.15, transmission: 0.12, transparent: true, opacity: 0.9 });
const syrup = new THREE.MeshPhysicalMaterial({ color: 0x86552d, roughness: 0.2, transmission: 0.03, transparent: true, opacity: 0.92 });
const sugar = new THREE.MeshStandardMaterial({ color: 0xf1dfac, roughness: 0.42 });
const molasses = new THREE.MeshStandardMaterial({ color: 0x2b1d16, roughness: 0.52 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x9dded6, transmission: 0.72, roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
const steam = new THREE.MeshBasicMaterial({ color: 0xeef7f4, transparent: true, opacity: 0.18, depthWrite: false });
const glow = new THREE.MeshBasicMaterial({ color: 0x66dfbc, transparent: true, opacity: 0.25, depthWrite: false });

function box(g: THREE.Object3D, s: [number, number, number], p: [number, number, number], m: THREE.Material, radius = 0) {
  const geo = radius ? new THREE.BoxGeometry(...s) : new THREE.BoxGeometry(...s);
  const o = new THREE.Mesh(geo, m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function cyl(g: THREE.Object3D, r: number, h: number, p: [number, number, number], m: THREE.Material, n = 32) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, n), m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function sphere(g: THREE.Object3D, r: number, p: [number, number, number], m: THREE.Material) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function pipe(g: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) {
  const d = b.clone().sub(a); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 16), m);
  o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.castShadow = true; o.receiveShadow = true; g.add(o); return o;
}
function disc(g: THREE.Object3D, r: number, depth: number, p: [number, number, number], m: THREE.Material) {
  const o = cyl(g, r, depth, p, m, 48); o.rotation.x = Math.PI / 2; return o;
}
function tag(o: THREE.Object3D, id: string) { o.userData.stageId = id; o.traverse(c => { c.userData.stageId = id; }); return o; }
function addRailing(g: THREE.Object3D, x: number, z: number, w: number) {
  box(g, [w, 0.06, 0.06], [x, 1.7, z], brass); box(g, [w, 0.06, 0.06], [x, 1.15, z], brass);
  box(g, [0.06, 0.7, 0.06], [x - w / 2, 1.4, z], brass); box(g, [0.06, 0.7, 0.06], [x + w / 2, 1.4, z], brass);
}

function buildMachine(stage: Stage, x: number, z: number): Machine {
  const root = new THREE.Group() as Machine;
  root.userData.stageId = stage.id;
  root.position.set(x, 0, z);

  box(root, [3.1, 0.18, 2.2], [0, -1.25, 0], rubber);
  box(root, [2.8, 0.22, 1.9], [0, -1.1, 0], darkSteel);
  addRailing(root, 0, -0.98, 2.5);

  if (stage.id === "preparation") {
    box(root, [1.9, 1.2, 1.45], [0, -0.05, 0], frame);
    const rotor = new THREE.Group(); rotor.position.set(0.35, -0.02, 0); root.add(rotor);
    disc(rotor, 0.7, 0.18, [0, 0, 0], steel);
    for (let i = 0; i < 8; i++) { const b = box(rotor, [0.75, 0.07, 0.08], [0.22, 0, 0], edge); b.rotation.z = i * Math.PI / 4; }
    const belt = box(root, [2.8, 0.12, 0.7], [-0.15, 0.65, 0], darkSteel); belt.rotation.z = -0.08;
    for (let i = 0; i < 8; i++) { const c = cyl(root, 0.075, 0.72, [-1.2 + i * 0.28, 0.82, -0.18 + (i % 2) * 0.34], cane, 12); c.rotation.z = Math.PI / 2; }
  } else if (stage.id === "shredding") {
    box(root, [2.25, 1.8, 1.7], [0, -0.05, 0], frame);
    const rotor = new THREE.Group(); rotor.position.set(0, -0.02, 0); root.add(rotor);
    const shaft = disc(rotor, 0.1, 1.65, [0, 0, 0], brass);
    for (let i = 0; i < 12; i++) { const b = box(rotor, [0.82, 0.08, 0.12], [0.25, 0, 0], edge); b.rotation.z = i * Math.PI / 6; }
    shaft.rotation.z = Math.PI / 2;
    box(root, [2.0, 0.14, 1.35], [0, 0.95, 0], steel);
    for (let i = 0; i < 16; i++) { const f = box(root, [0.42, 0.045, 0.06], [0.2 + (i % 5) * 0.15, -0.62, -0.5 + (i % 8) * 0.13], fiber); f.rotation.y = i * 0.3; }
  } else if (stage.id === "extraction") {
    const rolls = [-0.48, 0.48, 0].map((y, i) => {
      const r = disc(root, 0.48, 1.7, [0, y, 0], steel);
      for (let j = 0; j < 9; j++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.022, 8, 40), i === 1 ? brass : darkSteel); ring.position.set(0, y, 0); ring.rotation.x = Math.PI / 2; root.add(ring); }
      return r;
    });
    rolls[2].position.z = 0.12;
    box(root, [2.55, 0.65, 1.35], [0, -0.85, 0], darkSteel);
    box(root, [2.25, 0.04, 1.1], [0, -0.5, 0], juice);
    pipe(root, new THREE.Vector3(0, -0.58, 0), new THREE.Vector3(1.1, -0.58, 0), 0.09, steel);
    for (let i = 0; i < 18; i++) { const c = cyl(root, 0.06, 0.65, [-1.3 + (i % 6) * 0.42, 0.7, -0.4 + (i % 4) * 0.25], cane, 10); c.rotation.z = Math.PI / 2; }
  } else if (stage.id === "clarification") {
    cyl(root, 0.95, 2.25, [0, 0.02, 0], glass, 48);
    cyl(root, 0.78, 0.7, [0, -0.55, 0], juice, 40);
    cyl(root, 0.78, 0.22, [0, -1.0, 0], molasses, 40);
    const shaft = cyl(root, 0.05, 1.9, [0, 0.55, 0], brass, 16);
    for (const y of [-0.55, -0.78]) { const rake = box(root, [1.35, 0.06, 0.08], [0, y, 0], darkSteel); rake.rotation.y = y * 1.8; }
    box(root, [1.8, 0.12, 0.12], [0, 1.18, 0], steel);
    pipe(root, new THREE.Vector3(0.8, 0.48, 0), new THREE.Vector3(1.35, 0.48, 0), 0.07, steel);
    for (let i = 0; i < 30; i++) sphere(root, 0.025, [Math.sin(i) * 0.45, -0.1 + (i % 8) * 0.06, Math.cos(i * 1.7) * 0.45], molasses);
  } else if (stage.id === "evaporation") {
    for (let i = -1; i <= 1; i++) {
      const px = i * 0.72;
      cyl(root, 0.55, 2.15, [px, 0.02, 0], glass, 40);
      cyl(root, 0.45, 0.9, [px, -0.45, 0], syrup, 32);
      for (let j = 0; j < 5; j++) { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.028, 8, 32), brass); coil.position.set(px, -0.68 + j * 0.22, 0); root.add(coil); }
      for (let j = 0; j < 4; j++) sphere(root, 0.035, [px + Math.sin(j) * 0.2, 0.35 + j * 0.18, Math.cos(j) * 0.2], steam);
    }
    pipe(root, new THREE.Vector3(-1.45, 0.5, 0), new THREE.Vector3(1.45, 0.5, 0), 0.06, steel);
  } else if (stage.id === "crystallization") {
    cyl(root, 1.0, 1.75, [0, -0.02, 0], steel, 48);
    cyl(root, 0.83, 0.95, [0, -0.42, 0], syrup, 40);
    const shaft = cyl(root, 0.06, 1.8, [0, 0.65, 0], brass, 16);
    const imp = new THREE.Group(); imp.position.set(0, -0.45, 0); root.add(imp);
    for (let i = 0; i < 6; i++) { const arm = box(imp, [0.82, 0.06, 0.07], [0.36, 0, 0], edge); arm.rotation.y = i * Math.PI / 3; }
    for (let i = 0; i < 36; i++) { const c = sphere(root, 0.035, [Math.sin(i * 2.2) * 0.68, -0.05 + (i % 9) * 0.07, Math.cos(i * 1.6) * 0.68], sugar); c.scale.setScalar(0.5 + (i % 4) * 0.2); }
  } else if (stage.id === "centrifugation") {
    box(root, [2.2, 1.65, 1.9], [0, 0, 0], frame);
    const basket = new THREE.Group(); basket.position.set(0, -0.15, 0); root.add(basket);
    const shell = disc(basket, 0.82, 1.45, [0, 0, 0], steel); shell.rotation.x = Math.PI / 2;
    const inner = disc(basket, 0.66, 1.3, [0, 0, 0], darkSteel); inner.rotation.x = Math.PI / 2;
    for (let i = 0; i < 28; i++) { const hole = sphere(basket, 0.035, [0, 0, 0], edge); const a = (i / 28) * Math.PI * 2; const r = 0.68; hole.position.set(Math.cos(a) * r, -0.55 + (i % 5) * 0.27, Math.sin(a) * r); }
    for (let i = 0; i < 25; i++) { const c = sphere(basket, 0.04, [Math.sin(i) * 0.5, -0.3 + (i % 8) * 0.08, Math.cos(i * 1.3) * 0.5], sugar); }
    pipe(root, new THREE.Vector3(0, -1.0, 0), new THREE.Vector3(1.25, -1.0, 0), 0.07, steel);
  } else if (stage.id === "drying") {
    const drum = new THREE.Group(); drum.position.set(0, -0.05, 0); root.add(drum);
    const shell = cyl(drum, 0.82, 2.15, [0, 0, 0], steel, 48); shell.rotation.z = Math.PI / 2;
    for (let i = 0; i < 12; i++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 8, 48), brass); rib.rotation.y = Math.PI / 2; rib.position.x = -0.85 + i * 0.16; drum.add(rib); }
    const inside = cyl(drum, 0.68, 1.95, [0, 0, 0], darkSteel, 40); inside.rotation.z = Math.PI / 2;
    for (let i = 0; i < 40; i++) { const c = sphere(drum, 0.04, [0, -0.4 + (i % 10) * 0.08, -0.45 + (i % 8) * 0.12], sugar); }
    pipe(root, new THREE.Vector3(-1.4, 0.7, 0), new THREE.Vector3(-0.7, 0.35, 0), 0.08, steel);
  }

  // Every unit gets recognizable maintenance/detail language.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2; const bolt = cyl(root, 0.045, 0.08, [Math.cos(a) * 1.25, -1.08, Math.sin(a) * 0.78], edge, 10); bolt.rotation.x = Math.PI / 2;
  }
  return root;
}

export default function ImmersiveSugarPlant() {
  const mount = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [inside, setInside] = useState(false);
  const selectedRef = useRef<string | null>(null);
  const insideRef = useRef(false);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { insideRef.current = inside; }, [inside]);

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x02080b); scene.fog = new THREE.Fog(0x02080b, 12, 32);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100); camera.position.set(0, 7.2, 18);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; host.appendChild(renderer.domElement);
    const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.65, 0.86); composer.addPass(bloom); composer.addPass(new OutputPass());
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.055; controls.enablePan = false; controls.minDistance = 2.8; controls.maxDistance = 28; controls.maxPolarAngle = Math.PI * 0.49; controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xe9f8f3, 0x071012, 2.0));
    const key = new THREE.DirectionalLight(0xffdfbd, 4.6); key.position.set(4, 11, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 1; key.shadow.camera.far = 40; key.shadow.camera.left = -20; key.shadow.camera.right = 20; key.shadow.camera.top = 15; key.shadow.camera.bottom = -10; scene.add(key);
    const teal = new THREE.PointLight(0x4fd4b8, 2.0, 18); teal.position.set(0, 4, 3); scene.add(teal);
    const warm = new THREE.PointLight(0xff9b58, 1.3, 16); warm.position.set(10, 2, -5); scene.add(warm);

    const world = new THREE.Group(); scene.add(world);
    box(world, [25, 0.3, 13], [0, -1.55, 0], rubber);
    box(world, [24, 0.16, 12], [0, -1.36, 0], new THREE.MeshStandardMaterial({ color: 0x182326, roughness: 0.84, metalness: 0.18 }));
    for (let x = -11; x <= 11; x += 4) { box(world, [0.16, 8, 0.16], [x, 2.35, -5.4], frame); box(world, [0.16, 8, 0.16], [x, 2.35, 5.4], frame); box(world, [0.16, 8, 0.16], [x, 2.35, 0], frame); }
    for (let x = -12; x <= 12; x += 4) { box(world, [3.9, 0.16, 0.16], [x + 1.8, 6.2, -5.4], steel); box(world, [3.9, 0.16, 0.16], [x + 1.8, 6.2, 5.4], steel); }
    for (let z = -4; z <= 4; z += 2) { pipe(world, new THREE.Vector3(-12, 4.8, z), new THREE.Vector3(12, 4.8, z), 0.055, darkSteel); }
    // Main process utility headers.
    pipe(world, new THREE.Vector3(-12, 5.3, -4.3), new THREE.Vector3(12, 5.3, -4.3), 0.13, steel);
    pipe(world, new THREE.Vector3(-12, 4.75, -4.0), new THREE.Vector3(12, 4.75, -4.0), 0.085, brass);
    pipe(world, new THREE.Vector3(-12, 4.2, -3.7), new THREE.Vector3(12, 4.2, -3.7), 0.06, darkSteel);

    // Conveyor and material route.
    box(world, [23, 0.12, 0.92], [0, -0.88, 0], darkSteel);
    for (let x = -10.8; x <= 10.8; x += 0.48) { const r = disc(world, 0.18, 0.84, [x, -0.78, 0], edge); r.rotation.x = Math.PI / 2; }
    for (let x = -10.2; x <= 10.2; x += 1.8) box(world, [0.08, 0.42, 1.1], [x, -0.55, 0], frame);

    const machines = new Map<string, Machine>();
    const xs = [-9.6, -7.0, -4.4, -1.5, 1.5, 4.3, 7.0, 9.6];
    stages.forEach((s, i) => { const m = tag(buildMachine(s, xs[i], 0), s.id); machines.set(s.id, m); world.add(m); });

    // Inter-unit process piping and overhead utility drops.
    for (let i = 0; i < xs.length - 1; i++) {
      pipe(world, new THREE.Vector3(xs[i] + 1.4, -0.25, -0.92), new THREE.Vector3(xs[i + 1] - 1.4, -0.25, -0.92), 0.045, brass);
      pipe(world, new THREE.Vector3(xs[i] + 1.3, 2.8, 1.5), new THREE.Vector3(xs[i + 1] - 1.3, 2.8, 1.5), 0.055, steel);
    }

    // Animated material particles make the factory read as a process, not a static diorama.
    const particles: { o: THREE.Object3D; lane: number; phase: number; kind: string }[] = [];
    for (let i = 0; i < 80; i++) { const o = sphere(world, 0.045, [0, 0, 0], i % 3 ? juice : cane); particles.push({ o, lane: i % 7, phase: i / 80, kind: i < 32 ? "cane" : i < 58 ? "juice" : "sugar" }); }

    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const targetPos = new THREE.Vector3(0, 5.5, 16); const targetLook = new THREE.Vector3(0, 0, 0); let transition = 0;
    const machineCenter = (id: string) => { const m = machines.get(id); return m ? m.position.clone().add(new THREE.Vector3(0, 0, 0)) : new THREE.Vector3(); };
    const focusFor = (id: string, detailed: boolean) => {
      const p = machineCenter(id); const idx = stages.findIndex(s => s.id === id); const side = idx % 2 ? 1 : -1;
      return detailed ? { p: p.clone().add(new THREE.Vector3(side * 2.9, 1.45, 2.65)), l: p.clone().add(new THREE.Vector3(0, -0.05, 0)) } : { p: p.clone().add(new THREE.Vector3(side * 3.2, 2.6, 4.0)), l: p.clone().add(new THREE.Vector3(0, 0.2, 0)) };
    };
    const selectFromPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(world.children, true).find(h => typeof h.object.userData.stageId === "string");
      if (!hit) return;
      const id = hit.object.userData.stageId as string; setSelected(id); setInside(false); transition = 0;
      const f = focusFor(id, false); targetPos.copy(f.p); targetLook.copy(f.l);
    };
    renderer.domElement.addEventListener("pointerup", selectFromPointer);

    const clock = new THREE.Clock(); let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate); const t = clock.getElapsedTime();
      machines.forEach((m, id) => { const active = selectedRef.current === id; m.scale.lerp(new THREE.Vector3(active ? 1.045 : 1, active ? 1.045 : 1, active ? 1.045 : 1), 0.08); });
      particles.forEach((p, i) => {
        const cycle = (t * 0.055 + p.phase) % 1; const x = -11 + cycle * 22; const lane = (p.lane - 3) * 0.1;
        p.o.position.set(x, -0.42 + Math.sin(t * 2 + i) * 0.04, lane);
        if (p.kind === "cane") p.o.position.y += Math.max(0, Math.sin(cycle * Math.PI)) * 0.3;
        if (p.kind === "sugar") p.o.position.y -= 0.08;
      });
      if (selectedRef.current) {
        const f = focusFor(selectedRef.current, insideRef.current); targetPos.lerp(f.p, 0.055); targetLook.lerp(f.l, 0.055);
        if (insideRef.current) { transition = Math.min(1, transition + 0.015); machines.forEach((m, id) => { if (id !== selectedRef.current) m.visible = transition < 0.72; }); }
      } else { targetPos.lerp(new THREE.Vector3(0, 7.2, 18), 0.04); targetLook.lerp(new THREE.Vector3(0, 0, 0), 0.04); machines.forEach(m => { m.visible = true; }); }
      camera.position.lerp(targetPos, 0.07); controls.target.lerp(targetLook, 0.07); controls.update(); composer.render();
    };
    animate();
    const resize = () => { const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); };
    resize(); window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); renderer.domElement.removeEventListener("pointerup", selectFromPointer); window.removeEventListener("resize", resize); controls.dispose(); composer.dispose(); renderer.dispose(); if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement); };
  }, []);

  const stage = stages.find(s => s.id === selected) ?? null;
  const enterUnit = () => { if (!stage) return; setInside(true); insideRef.current = true; };
  const exitUnit = () => { setInside(false); insideRef.current = false; };

  return <section className="immersive-plant">
    <div className="immersive-plant-top">
      <div><span className="eyebrow">FOODPROCESSLAB · SUGARCANE FACTORY</span><h1>Walk through the process.</h1><p>Start on the production floor. Select a real process unit, move the camera inside it, and watch the material transform.</p></div>
      <div className="plant-status"><i /> LIVE PROCESS MODEL <b>08 UNITS</b></div>
    </div>
    <div className="plant-viewport" ref={mount} aria-label="Interactive 3D sugar factory. Click a process unit to enter it." />
    <div className="plant-hint"><span>CLICK / TAP A MACHINE</span><b>→</b><span>ENTER THE UNIT</span><b>→</b><span>ROTATE + ZOOM TO INSPECT</span></div>
    {stage && <aside className="unit-panel">
      <div className="unit-panel-kicker">UNIT {stage.no} · {stage.short.toUpperCase()}</div>
      <h2>{stage.name}</h2>
      <p>This is a process unit, not a decorative object. The internal view exposes the working mechanism and the material transformation.</p>
      <div className="unit-flow"><div><small>INPUT</small><strong>{stage.input}</strong></div><span>→</span><div><small>OUTPUT</small><strong>{stage.output}</strong></div></div>
      {!inside ? <button type="button" onClick={enterUnit}>ENTER MACHINE <b>↗</b></button> : <button type="button" className="secondary" onClick={exitUnit}>← RETURN TO FACTORY</button>}
    </aside>}
    {inside && stage && <div className="inside-badge"><span>INSIDE UNIT {stage.no}</span><strong>{stage.name}</strong><small>Drag to inspect the mechanism · Scroll to zoom</small></div>}
    {!selected && <div className="plant-intro-card"><span>THE FACTORY IS THE INTERFACE</span><strong>Every machine is selectable.</strong><p>Follow the material from sugarcane to sugar without leaving the 3D environment.</p></div>}
  </section>;
}
