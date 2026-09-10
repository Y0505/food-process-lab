"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const model = buildSugarcaneVisualizationModel();
const stages = model.stages;
const xs = stages.map((_, i) => -8.4 + i * 2.4);

type Motion = { object: THREE.Object3D; kind: string; stage: number; phase: number; speed: number; data?: unknown };

const M = (color: number, metalness = 0.1, roughness = 0.5) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const GLASS = new THREE.MeshPhysicalMaterial({ color: 0xa8ded8, transparent: true, opacity: 0.16, roughness: 0.08, transmission: 0.18, depthWrite: false, side: THREE.DoubleSide });
const CANE = M(0x91a84d, 0, 0.84);
const CUT_CANE = M(0xb69a50, 0, 0.8);
const FIBER = M(0x987149, 0, 0.9);
const JUICE = M(0x5a9848, 0, 0.3);
const DIRTY_JUICE = M(0x536f35, 0, 0.38);
const SYRUP = M(0x795026, 0, 0.3);
const SUGAR = M(0xf2dfa0, 0, 0.2);
const SOLIDS = M(0x725338, 0, 0.82);
const MOLASSES = M(0x271a14, 0, 0.48);
const STEEL = M(0x77878a, 0.82, 0.27);
const DARK = M(0x243538, 0.82, 0.3);
const COPPER = M(0xb97d45, 0.65, 0.3);
const HOT = M(0xd47735, 0.2, 0.42);
const AIR = new THREE.MeshBasicMaterial({ color: 0xcceee7, transparent: true, opacity: 0.3 });
const STEAM = new THREE.MeshBasicMaterial({ color: 0xf3faf7, transparent: true, opacity: 0.24 });

function box(g: THREE.Group, s: [number, number, number], p: [number, number, number], m: THREE.Material) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(...s), m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function cyl(g: THREE.Group, r: number, h: number, p: [number, number, number], m: THREE.Material, n = 28) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, n), m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function sphere(g: THREE.Group, r: number, p: [number, number, number], m: THREE.Material) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); o.position.set(...p); g.add(o); return o;
}
function grain(g: THREE.Group, p: [number, number, number], r = 0.035) {
  const o = new THREE.Mesh(new THREE.OctahedronGeometry(r), SUGAR); o.position.set(...p); g.add(o); return o;
}
function pipe(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, m: THREE.Material, r = 0.055) {
  const d = b.clone().sub(a); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), m);
  o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.castShadow = true; g.add(o); return o;
}
function route(motions: Motion[], g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, stage: number, material: THREE.Material, count = 6, speed = 0.16) {
  for (let i = 0; i < count; i++) {
    const o = sphere(g, 0.045, [0, 0, 0], material);
    motions.push({ object: o, kind: "route", stage, phase: i / count, speed, data: { a: a.clone(), b: b.clone() } });
  }
}
function arrow(g: THREE.Group, x: number, y: number, z: number) {
  const shaft = box(g, [0.5, 0.035, 0.035], [x, y, z], COPPER);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), COPPER); head.rotation.z = -Math.PI / 2; head.position.set(x + 0.28, y, z); g.add(head);
  return shaft;
}

function buildFactory(motions: Motion[]) {
  const g = new THREE.Group();

  // Neutral industrial environment. The material itself is the visual story.
  box(g, [21, 0.18, 5.4], [0, -1.48, 0], M(0x10191c, 0.1, 0.92));
  for (const x of xs) {
    box(g, [0.06, 3.9, 0.06], [x - 0.98, 0.4, -1.15], DARK);
    box(g, [0.06, 3.9, 0.06], [x + 0.98, 0.4, -1.15], DARK);
  }
  box(g, [20.8, 0.08, 0.08], [0, 2.35, -1.15], STEEL);

  // Continuous process route, deliberately secondary to the material transformations.
  for (let i = 0; i < 7; i++) {
    const a = new THREE.Vector3(xs[i] + 0.86, -0.78, 0);
    const b = new THREE.Vector3(xs[i + 1] - 0.86, -0.78, 0);
    pipe(g, a, b, DARK, 0.045);
    route(motions, g, a, b, i, i < 3 ? JUICE : SYRUP, 4, 0.12);
  }

  // 01 PREPARATION — unmistakable before/after: long stalks become short billets.
  {
    const x = xs[0];
    box(g, [1.75, 0.14, 1.15], [x, -0.92, 0], DARK);
    for (let i = 0; i < 5; i++) {
      const stalk = cyl(g, 0.075, 1.55, [x - 0.9 + i * 0.16, -0.52, -0.25 + (i % 2) * 0.28], CANE, 10);
      stalk.rotation.z = Math.PI / 2;
      motions.push({ object: stalk, kind: "prep-stalk", stage: 0, phase: i / 5, speed: 0.22 });
    }
    // Large rotating knife disc crossing the stalk path.
    const cutter = new THREE.Group(); cutter.position.set(x + 0.15, -0.35, 0); g.add(cutter);
    const wheel = cyl(cutter, 0.55, 0.16, [0, 0, 0], STEEL, 32); wheel.rotation.z = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const blade = box(cutter, [0.7, 0.045, 0.075], [0.26, 0, 0], COPPER); blade.rotation.z = i * Math.PI / 3;
    }
    motions.push({ object: cutter, kind: "prep-cutter", stage: 0, phase: 0, speed: 2.8 });
    for (let i = 0; i < 14; i++) {
      const p = box(g, [0.16, 0.08, 0.1], [x + 0.43 + (i % 5) * 0.18, -0.48, -0.35 + (i % 4) * 0.22], CUT_CANE);
      motions.push({ object: p, kind: "prep-billet", stage: 0, phase: i / 14, speed: 0.32 });
    }
    arrow(g, x + 0.86, -0.9, 0);
  }

  // 02 SHREDDING — a visible rotor pulls billets through a cutting chamber and produces long fibers.
  {
    const x = xs[1];
    box(g, [1.7, 1.5, 1.4], [x, -0.05, 0], GLASS);
    const rotor = new THREE.Group(); rotor.position.set(x, -0.05, 0); g.add(rotor);
    const shaft = cyl(rotor, 0.07, 1.25, [0, 0, 0], COPPER, 16); shaft.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) { const blade = box(rotor, [0.72, 0.06, 0.08], [0.05, 0, 0], STEEL); blade.rotation.z = i * Math.PI / 4; }
    motions.push({ object: rotor, kind: "shred-rotor", stage: 1, phase: 0, speed: 4.2 });
    for (let i = 0; i < 8; i++) {
      const p = box(g, [0.14, 0.2, 0.09], [x - 0.18 + (i % 3) * 0.18, 0.85, -0.25 + (i % 2) * 0.3], CUT_CANE);
      motions.push({ object: p, kind: "shred-billet", stage: 1, phase: i / 8, speed: 0.3 });
    }
    for (let i = 0; i < 18; i++) {
      const f = box(g, [0.34, 0.035, 0.035], [x + 0.34, -0.5, -0.48 + (i % 8) * 0.13], FIBER);
      motions.push({ object: f, kind: "shred-fiber", stage: 1, phase: i / 18, speed: 0.43 });
    }
    arrow(g, x + 0.86, -0.72, 0);
  }

  // 03 EXTRACTION — two counter-rotating grooved rolls visibly squeeze fiber into two streams.
  {
    const x = xs[2];
    for (const z of [-0.34, 0.34]) {
      const roll = cyl(g, 0.44, 1.3, [x, 0.12, z], STEEL, 36); roll.rotation.x = Math.PI / 2;
      for (let j = 0; j < 5; j++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.018, 7, 28), COPPER); ring.position.set(x, 0.12, z); ring.rotation.x = Math.PI / 2; g.add(ring); }
      motions.push({ object: roll, kind: "extract-roll", stage: 2, phase: z, speed: z < 0 ? 1.8 : -1.8 });
    }
    for (let i = 0; i < 14; i++) {
      const f = box(g, [0.18, 0.035, 0.035], [x - 0.82 + (i % 6) * 0.14, 0.45, -0.25 + (i % 4) * 0.16], FIBER);
      motions.push({ object: f, kind: "extract-fiber", stage: 2, phase: i / 14, speed: 0.38 });
    }
    box(g, [1.5, 0.1, 0.95], [x, -0.65, 0], DARK);
    for (let i = 0; i < 18; i++) {
      const d = sphere(g, 0.038, [0, 0, 0], JUICE); motions.push({ object: d, kind: "extract-juice", stage: 2, phase: i / 18, speed: 0.52 });
    }
    for (let i = 0; i < 13; i++) {
      const b = box(g, [0.22, 0.05, 0.06], [x + 0.5, -0.05, -0.32 + (i % 6) * 0.12], FIBER);
      motions.push({ object: b, kind: "extract-bagasse", stage: 2, phase: i / 13, speed: 0.31 });
    }
  }

  // 04 CLARIFICATION — transparent tank makes the vertical separation itself the mechanism.
  {
    const x = xs[3];
    cyl(g, 0.8, 2.05, [x, 0.05, 0], GLASS, 40);
    cyl(g, 0.66, 0.78, [x, -0.42, 0], DIRTY_JUICE, 32);
    cyl(g, 0.66, 0.35, [x, 0.2, 0], JUICE, 32);
    cyl(g, 0.67, 0.2, [x, -0.9, 0], SOLIDS, 32);
    const shaft = cyl(g, 0.045, 1.7, [x, 0.45, 0], DARK, 12); motions.push({ object: shaft, kind: "clarifier-shaft", stage: 3, phase: 0, speed: 0.28 });
    for (const y of [-0.52, -0.72]) { const rake = box(g, [1.0, 0.04, 0.06], [x, y, 0], DARK); motions.push({ object: rake, kind: "clarifier-rake", stage: 3, phase: y, speed: 0.28 }); }
    for (let i = 0; i < 28; i++) { const s = sphere(g, 0.025, [x, 0.45, 0], SOLIDS); motions.push({ object: s, kind: "clarifier-solid", stage: 3, phase: i / 28, speed: 0.075 }); }
    pipe(g, new THREE.Vector3(x + 0.64, 0.55, 0), new THREE.Vector3(x + 1.05, 0.55, 0), STEEL, 0.05);
  }

  // 05 EVAPORATION — three vessels visibly boil liquid down from a high level to a concentrated low level.
  {
    const x = xs[4];
    for (let i = -1; i <= 1; i++) {
      const vx = x + i * 0.48;
      cyl(g, 0.43, 1.55, [vx, 0.05, 0], GLASS, 30);
      const liquid = cyl(g, 0.35, 0.62, [vx, -0.37, 0], SYRUP, 24);
      motions.push({ object: liquid, kind: "evap-liquid", stage: 4, phase: (i + 1) / 3, speed: 0.08 });
      for (let j = 0; j < 4; j++) { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.022, 8, 24), HOT); coil.position.set(vx, -0.65 + j * 0.16, 0); g.add(coil); }
    }
    for (let i = 0; i < 22; i++) { const v = sphere(g, 0.04, [0, 0, 0], STEAM); motions.push({ object: v, kind: "evap-steam", stage: 4, phase: i / 22, speed: 0.18 }); }
    for (let i = 0; i < 18; i++) { const b = sphere(g, 0.03, [0, 0, 0], STEAM); motions.push({ object: b, kind: "evap-bubble", stage: 4, phase: i / 18, speed: 0.3 }); }
  }

  // 06 CRYSTALLIZATION — large transparent vessel with agitator and clearly growing sugar crystals.
  {
    const x = xs[5];
    cyl(g, 0.78, 1.95, [x, 0.08, 0], GLASS, 34);
    cyl(g, 0.63, 0.92, [x, -0.4, 0], SYRUP, 28);
    const shaft = cyl(g, 0.055, 2.25, [x, 0.5, 0], DARK, 12); motions.push({ object: shaft, kind: "cryst-shaft", stage: 5, phase: 0, speed: 0.8 });
    for (const y of [-0.45, -0.05, 0.35]) { const blade = box(g, [1.05, 0.055, 0.07], [x, y, 0], DARK); motions.push({ object: blade, kind: "cryst-blade", stage: 5, phase: y, speed: 0.8 }); }
    for (let i = 0; i < 42; i++) { const c = grain(g, [x, -0.52, 0], 0.03 + (i % 4) * 0.009); motions.push({ object: c, kind: "crystal-grow", stage: 5, phase: i / 42, speed: 0.13 }); }
  }

  // 07 CENTRIFUGATION — rotating basket, crystal cake at the wall, dark mother liquor thrown away.
  {
    const x = xs[6];
    const housing = cyl(g, 0.88, 1.55, [x, 0.05, 0], GLASS, 36); housing.rotation.x = Math.PI / 2;
    const basket = new THREE.Group(); basket.position.set(x, 0.05, 0); g.add(basket);
    const hub = cyl(basket, 0.13, 1.15, [0, 0, 0], STEEL, 20); hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 10; i++) { const bar = box(basket, [0.72, 0.05, 0.05], [0.36, 0, 0], STEEL); bar.rotation.z = i * Math.PI / 5; }
    motions.push({ object: basket, kind: "centrifuge-basket", stage: 6, phase: 0, speed: 4.5 });
    for (let i = 0; i < 34; i++) { const c = grain(g, [x + 0.18, 0.04, 0], 0.03); motions.push({ object: c, kind: "centrifuge-sugar", stage: 6, phase: i / 34, speed: 4.5 }); }
    for (let i = 0; i < 20; i++) { const l = sphere(g, 0.024, [0, 0, 0], MOLASSES); motions.push({ object: l, kind: "centrifuge-liquor", stage: 6, phase: i / 20, speed: 2.8 }); }
  }

  // 08 DRYING — wet crystal feed enters a transparent tunnel; hot air crosses it and dry crystals leave.
  {
    const x = xs[7];
    box(g, [1.75, 1.55, 1.4], [x, 0.03, 0], GLASS);
    box(g, [1.55, 0.1, 0.95], [x, -0.66, 0], DARK);
    for (let i = 0; i < 34; i++) { const c = grain(g, [x - 0.58, -0.48, -0.32 + (i % 8) * 0.09], 0.028); motions.push({ object: c, kind: "dry-sugar", stage: 7, phase: i / 34, speed: 0.28 }); }
    for (let i = 0; i < 20; i++) { const a = sphere(g, 0.024, [0, 0, 0], AIR); motions.push({ object: a, kind: "dry-air", stage: 7, phase: i / 20, speed: 0.43 }); }
  }

  return g;
}

function cameraPose(index: number) {
  const x = xs[index];
  return { position: new THREE.Vector3(x * 0.31, 3.0, 17.6), target: new THREE.Vector3(x * 0.29, -0.05, 0) };
}

export default function ProcessLineOverview() {
  const mount = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!mount.current) return;
    const element = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071013);
    scene.fog = new THREE.Fog(0x071013, 15, 33);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xd7ebe6, 0x111719, 1.75));
    const key = new THREE.DirectionalLight(0xfff3dc, 3.1); key.position.set(4, 8, 9); key.castShadow = true; scene.add(key);
    const fill = new THREE.DirectionalLight(0x6aaea3, 1.25); fill.position.set(-8, 4, -6); scene.add(fill);

    const motions: Motion[] = [];
    const factory = buildFactory(motions); scene.add(factory);
    const hits = stages.map((_, i) => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.5, 2.5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      h.position.set(xs[i], 0.2, 0); h.userData.stageIndex = i; factory.add(h); return h;
    });
    const markers = stages.map((_, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.035, 10, 32), new THREE.MeshStandardMaterial({ color: 0x7bd4c5, emissive: 0x17554d, emissiveIntensity: 1.2 }));
      m.rotation.x = Math.PI / 2; m.position.set(xs[i], -1.28, 0); m.visible = i === 0; factory.add(m); return m;
    });

    let goal = cameraPose(0); let target = goal.target.clone(); camera.position.copy(goal.position); camera.lookAt(target);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const point = (e: PointerEvent | MouseEvent) => { const r = renderer.domElement.getBoundingClientRect(); pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)); raycaster.setFromCamera(pointer, camera); };
    const selectScene = (i: number) => { setSelected(i); markers.forEach((m, j) => m.visible = j === i); window.dispatchEvent(new CustomEvent("food-process-stage-select", { detail: i })); };
    const onMove = (e: PointerEvent) => { point(e); renderer.domElement.style.cursor = raycaster.intersectObjects(hits, false).length ? "pointer" : "default"; };
    const onClick = (e: MouseEvent) => { point(e); const hit = raycaster.intersectObjects(hits, false)[0]; if (hit) selectScene(Number(hit.object.userData.stageIndex)); };
    const onStage = (e: Event) => { const i = Math.max(0, Math.min(7, Number((e as CustomEvent<number>).detail))); selectScene(i); goal = cameraPose(i); };
    const onOpenInspection = (e: Event) => { const i = Math.max(0, Math.min(7, Number((e as CustomEvent<number>).detail))); selectScene(i); window.setTimeout(() => { const cards = document.querySelectorAll<HTMLButtonElement>(".stage-card"); cards[i]?.click(); cards[i]?.scrollIntoView({ behavior: "smooth", block: "center" }); window.setTimeout(() => document.querySelector<HTMLButtonElement>(".explorer-stage .enter-equipment")?.click(), 100); }, 0); };
    renderer.domElement.addEventListener("pointermove", onMove); renderer.domElement.addEventListener("click", onClick); window.addEventListener("food-process-stage-select", onStage); window.addEventListener("food-process-open-inspection", onOpenInspection);

    const clock = new THREE.Clock(); let id = 0;
    const animate = () => {
      id = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05); const elapsed = clock.elapsedTime;
      camera.position.lerp(goal.position, 1 - Math.pow(0.001, delta * 1.3)); target.lerp(goal.target, 1 - Math.pow(0.001, delta * 1.5)); camera.lookAt(target);
      markers.forEach(m => { if (m.visible) m.scale.setScalar(1 + Math.sin(elapsed * 3.4) * 0.1); });

      motions.forEach(({ object, kind, stage, phase, speed, data }) => {
        const cycle = (elapsed * speed + phase) % 1; const x = xs[stage];
        if (kind === "route") { const { a, b } = data as { a: THREE.Vector3; b: THREE.Vector3 }; object.position.lerpVectors(a, b, cycle); }
        else if (kind === "prep-stalk") object.position.x = x - 1.0 + cycle * 1.55;
        else if (kind === "prep-cutter") object.rotation.z = elapsed * speed;
        else if (kind === "prep-billet") { object.position.x = x + 0.43 + cycle * 0.8; object.position.z = -0.35 + ((phase * 13) % 4) * 0.22; }
        else if (kind === "shred-rotor") object.rotation.z = elapsed * speed;
        else if (kind === "shred-billet") object.position.y = 0.92 - cycle * 1.35;
        else if (kind === "shred-fiber") { object.position.x = x + 0.34 + cycle * 0.8; object.position.y = -0.48 + Math.sin(elapsed * 5 + phase) * 0.05; }
        else if (kind === "extract-roll") object.rotation.z = elapsed * speed;
        else if (kind === "extract-fiber") { object.position.x = x - 0.82 + cycle * 0.76; object.scale.x = 1 - cycle * 0.35; }
        else if (kind === "extract-juice") object.position.set(x - 0.48 + ((phase * 17) % 5) * 0.19, -0.35 - cycle * 0.6, -0.32 + ((phase * 11) % 4) * 0.2);
        else if (kind === "extract-bagasse") object.position.x = x + 0.5 + cycle * 0.85;
        else if (kind === "clarifier-shaft" || kind === "clarifier-rake") object.rotation.y = elapsed * speed;
        else if (kind === "clarifier-solid") object.position.set(x - 0.5 + ((phase * 19) % 5) * 0.2, 0.55 - cycle * 1.35, -0.28 + ((phase * 13) % 4) * 0.18);
        else if (kind === "evap-liquid") { const level = 0.78 - ((phase * 3) % 1) * 0.3; object.scale.y = level; object.position.y = -0.7 + level * 0.38 + Math.sin(elapsed * 0.6 + phase) * 0.025; }
        else if (kind === "evap-steam") { object.position.set(x - 0.9 + ((phase * 19) % 7) * 0.3, 0.45 + cycle * 1.55, Math.sin(phase * 10) * 0.08); object.scale.setScalar(0.45 + Math.sin(cycle * Math.PI) * 0.7); }
        else if (kind === "evap-bubble") { object.position.set(x - 0.7 + ((phase * 11) % 5) * 0.3, -0.38 + cycle * 0.65, Math.sin(phase * 12) * 0.1); object.scale.setScalar(0.4 + Math.sin(cycle * Math.PI) * 0.8); }
        else if (kind === "cryst-shaft" || kind === "cryst-blade") object.rotation.y = elapsed * speed;
        else if (kind === "crystal-grow") { const a = phase * Math.PI * 2 + elapsed * 0.13; const r = 0.12 + ((phase * 23) % 6) * 0.085; object.position.set(x + Math.cos(a) * r, -0.58 + ((phase * 29) % 7) * 0.15, Math.sin(a) * r); object.scale.setScalar(0.35 + cycle * 1.0); }
        else if (kind === "centrifuge-basket") object.rotation.y = elapsed * speed;
        else if (kind === "centrifuge-sugar") { const a = elapsed * speed + phase * Math.PI * 2; const r = 0.16 + cycle * 0.62; object.position.set(x + Math.cos(a) * r, 0.04 + Math.sin(a * 2) * 0.04, Math.sin(a) * r); }
        else if (kind === "centrifuge-liquor") { const a = elapsed * speed + phase * Math.PI * 2; const r = 0.22 + cycle * 0.7; object.position.set(x + Math.cos(a) * r, 0.04, Math.sin(a) * r); }
        else if (kind === "dry-sugar") object.position.set(x - 0.67 + cycle * 1.3, -0.48, -0.33 + ((phase * 17) % 7) * 0.1);
        else if (kind === "dry-air") object.position.set(x - 0.7 + cycle * 1.25, -0.75 + ((phase * 11) % 5) * 0.22, -0.45 + ((phase * 17) % 6) * 0.16);
      });
      renderer.render(scene, camera);
    };
    animate();
    const resize = () => { camera.aspect = element.clientWidth / Math.max(1, element.clientHeight); camera.updateProjectionMatrix(); renderer.setSize(element.clientWidth, element.clientHeight, false); };
    resize(); window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(id); renderer.domElement.removeEventListener("pointermove", onMove); renderer.domElement.removeEventListener("click", onClick); window.removeEventListener("food-process-stage-select", onStage); window.removeEventListener("food-process-open-inspection", onOpenInspection); window.removeEventListener("resize", resize); renderer.dispose(); if (element.contains(renderer.domElement)) element.removeChild(renderer.domElement); };
  }, []);

  const stage = stages[selected];
  const select = (i: number) => { setSelected(i); window.dispatchEvent(new CustomEvent("food-process-stage-select", { detail: i })); };
  const openInspection = () => window.dispatchEvent(new CustomEvent("food-process-open-inspection", { detail: selected }));

  return <section className="process-line-overview">
    <div className="process-line-heading"><div><span>PRODUCTION LINE · MATERIAL TRANSFORMATION</span><h2>Watch the sugarcane change — not just the machines</h2></div><p>The factory view is built around visible material transformations: cutting, shredding, squeezing, separating, concentrating, crystallizing and drying.</p></div>
    <div ref={mount} className="process-line-canvas" aria-label="Interactive 3D sugarcane material transformation process" />
    <div className="process-line-stages">{stages.map((item, index) => <button key={item.stepId} type="button" className={selected === index ? "process-line-stage active" : "process-line-stage"} onClick={() => select(index)}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{item.name}</span><small>{item.equipmentId}</small></button>)}</div>
    <div className="process-line-selected"><div><span>SELECTED EQUIPMENT · STAGE {selected + 1}</span><strong>{stage.equipmentId}</strong><h3>{stage.name}</h3><p>{stage.description}</p></div><div className="selected-flow"><span>INPUT · {stage.inputStreams.map(s => s.materialId).join(" + ")}</span><span>OUTPUT · {stage.outputStreams.map(s => s.materialId).join(" + ")}</span><button type="button" onClick={openInspection}>View Details · نمایش جزئیات</button></div></div>
  </section>;
}
