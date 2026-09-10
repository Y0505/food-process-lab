"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const model = buildSugarcaneVisualizationModel();
const stages = model.stages;
const xs = stages.map((_, i) => -8.4 + i * 2.4);

type Animated = {
  object: THREE.Object3D;
  kind: string;
  stage: number;
  phase: number;
  speed: number;
  base?: THREE.Vector3;
};

const material = (color: number, metalness = 0.45, roughness = 0.42) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });

function box(g: THREE.Group, size: [number, number, number], p: [number, number, number], m: THREE.Material) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(...size), m);
  o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}

function cyl(g: THREE.Group, radius: number, height: number, p: [number, number, number], m: THREE.Material, segments = 24) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), m);
  o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}

function pipe(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, m: THREE.Material, radius = 0.055) {
  const d = b.clone().sub(a);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 12), m);
  o.position.copy(a).add(b).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  o.castShadow = true; g.add(o); return o;
}

function torus(g: THREE.Group, r: number, tube: number, p: [number, number, number], m: THREE.Material) {
  const o = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 32), m);
  o.position.set(...p); o.rotation.x = Math.PI / 2; o.castShadow = true; g.add(o); return o;
}

function addFlow(animated: Animated[], g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, stage: number, m: THREE.Material, count = 9, speed = 0.18) {
  const d = b.clone().sub(a);
  for (let i = 0; i < count; i++) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), m);
    g.add(o);
    animated.push({ object: o, kind: "pipe-flow", stage, phase: i / count, speed, base: d.clone() });
    o.userData.flowA = a.clone(); o.userData.flowB = b.clone();
  }
}

function buildFactory(animated: Animated[]) {
  const g = new THREE.Group();
  const steel = material(0x788b8e, 0.88, 0.25);
  const steelDark = material(0x34474b, 0.86, 0.29);
  const rubber = material(0x151b1d, 0.35, 0.7);
  const copper = material(0x9a704b, 0.72, 0.3);
  const cane = material(0x9f8050, 0.05, 0.86);
  const sugar = material(0xf0d994, 0.04, 0.28);
  const juice = new THREE.MeshStandardMaterial({ color: 0x5a9d69, roughness: 0.24, metalness: 0.02, transparent: true, opacity: 0.82 });
  const vapor = new THREE.MeshStandardMaterial({ color: 0xdcefed, roughness: 0.1, transparent: true, opacity: 0.18 });
  const hot = new THREE.MeshStandardMaterial({ color: 0xd17b36, emissive: 0x5d210c, emissiveIntensity: 0.65, transparent: true, opacity: 0.5 });
  const processPipe = material(0x50756f, 0.8, 0.26);

  // Industrial floor and structural frame.
  box(g, [21, 0.18, 5.2], [0, -1.42, 0], material(0x11191c, 0.2, 0.88));
  box(g, [20.8, 0.08, 0.08], [0, 2.9, -1.15], steel);
  box(g, [20.8, 0.08, 0.08], [0, 2.55, -1.15], steelDark);
  for (const x of xs) {
    box(g, [0.08, 4.1, 0.08], [x - 0.88, 0.55, -1.15], steelDark);
    box(g, [0.08, 4.1, 0.08], [x + 0.88, 0.55, -1.15], steelDark);
    box(g, [1.95, 0.12, 1.95], [x, -1.29, 0], steelDark);
  }

  // Elevated process pipework: actual continuous routes rather than floating dots.
  for (let i = 0; i < xs.length - 1; i++) {
    const a = new THREE.Vector3(xs[i] + 0.75, 0.15, 0);
    const b = new THREE.Vector3(xs[i + 1] - 0.75, 0.15, 0);
    pipe(g, a, b, processPipe, 0.085);
    addFlow(animated, g, a, b, i, juice, 7, 0.16);
  }

  // 01 Preparation: belt conveyor, rollers and real cane pieces.
  {
    const x = xs[0];
    box(g, [1.7, 0.16, 1.15], [x - 0.15, -0.35, 0], rubber);
    box(g, [1.82, 0.08, 1.28], [x - 0.15, -0.24, 0], steelDark);
    for (const z of [-0.52, 0.52]) {
      const r = cyl(g, 0.13, 1.2, [x - 0.72, -0.12, z], steel, 20); r.rotation.x = Math.PI / 2;
      animated.push({ object: r, kind: "conveyor-roller", stage: 0, phase: z, speed: 1.8 });
    }
    for (let i = 0; i < 8; i++) {
      const canePiece = box(g, [0.34, 0.07, 0.07], [x - 1.05 + (i % 4) * 0.28, 0.05 + Math.floor(i / 4) * 0.11, (i % 2) * 0.14], cane);
      animated.push({ object: canePiece, kind: "cane-feed", stage: 0, phase: i / 8, speed: 0.28 });
    }
    for (let i = -2; i <= 2; i++) {
      const r = cyl(g, 0.16, 1.15, [x + i * 0.2, 0.35, 0], steel, 20); r.rotation.z = Math.PI / 2;
      animated.push({ object: r, kind: "prep-roller", stage: 0, phase: i / 5, speed: 1.4 });
    }
  }

  // 02 Shredding: enclosed drum with visible rotating shaft and discharge chute.
  {
    const x = xs[1];
    const housing = cyl(g, 0.82, 1.65, [x, 0.48, 0], steelDark, 36); housing.rotation.z = Math.PI / 2;
    const drum = cyl(g, 0.64, 1.82, [x, 0.48, 0], rubber, 32); drum.rotation.z = Math.PI / 2;
    animated.push({ object: drum, kind: "shred-drum", stage: 1, phase: 0, speed: 2.2 });
    const shaft = cyl(g, 0.075, 2.0, [x, 0.48, 0], steel, 12); shaft.rotation.z = Math.PI / 2;
    animated.push({ object: shaft, kind: "shred-shaft", stage: 1, phase: 0, speed: 2.2 });
    for (let i = 0; i < 10; i++) {
      const blade = box(g, [0.13, 0.08, 0.46], [x - 0.55 + i * 0.12, 0.5, 0.35], copper);
      animated.push({ object: blade, kind: "shred-blade", stage: 1, phase: i / 10, speed: 2.2 });
    }
    box(g, [0.72, 0.55, 0.55], [x + 0.9, -0.15, 0], steelDark);
    for (let i = 0; i < 10; i++) {
      const fiber = box(g, [0.2, 0.035, 0.035], [x + 0.62 + (i % 5) * 0.14, -0.18, -0.2 + (i % 3) * 0.18], cane);
      animated.push({ object: fiber, kind: "shredded-fiber", stage: 1, phase: i / 10, speed: 0.38 });
    }
  }

  // 03 Extraction: two opposed mill rolls, pressure zone and juice collection trough.
  {
    const x = xs[2];
    for (const z of [-0.34, 0.34]) {
      const r = cyl(g, 0.43, 1.5, [x, 0.48, z], steel, 36); r.rotation.z = Math.PI / 2;
      animated.push({ object: r, kind: "mill-roll", stage: 2, phase: z, speed: 1.55 });
      for (let i = 0; i < 5; i++) {
        const groove = torus(g, 0.37, 0.018, [x, 0.48, z], copper); groove.rotation.y = i * 0.22;
        animated.push({ object: groove, kind: "roll-groove", stage: 2, phase: i / 5, speed: 1.55 });
      }
    }
    box(g, [1.72, 0.16, 1.12], [x, -0.55, 0], steelDark);
    box(g, [1.3, 0.08, 0.78], [x, -0.43, 0], juice);
    for (let i = 0; i < 12; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), juice); g.add(drop);
      animated.push({ object: drop, kind: "extracted-juice", stage: 2, phase: i / 12, speed: 0.42 });
    }
  }

  // 04 Clarifier: tank, feed, slow rake and visibly settling solids.
  {
    const x = xs[3];
    const tank = cyl(g, 0.76, 2.35, [x, 0.1, 0], steel, 40);
    const liquid = cyl(g, 0.62, 1.12, [x, -0.45, 0], juice, 32);
    liquid.castShadow = false;
    const shaft = cyl(g, 0.045, 1.65, [x, 0.35, 0], steelDark, 12);
    animated.push({ object: shaft, kind: "clarifier-rake", stage: 3, phase: 0, speed: 0.32 });
    for (const y of [-0.48, -0.66]) {
      const rake = box(g, [1.0, 0.045, 0.07], [x, y, 0], steelDark);
      animated.push({ object: rake, kind: "clarifier-rake", stage: 3, phase: y, speed: 0.32 });
    }
    for (let i = 0; i < 18; i++) {
      const solid = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 7), copper); g.add(solid);
      animated.push({ object: solid, kind: "settling-solid", stage: 3, phase: i / 18, speed: 0.055 });
    }
    tank.userData.isTank = true;
  }

  // 05 Evaporation: calandria-style vessels, heating circulation and vapour outlet.
  {
    const x = xs[4];
    for (let i = -1; i <= 1; i++) {
      const vx = x + i * 0.48;
      const vessel = cyl(g, 0.42, 1.9, [vx, 0.12, 0], steel, 30);
      const liquid = cyl(g, 0.35, 0.75, [vx, -0.42, 0], juice, 24);
      liquid.castShadow = false;
      for (let j = 0; j < 4; j++) {
        const coil = torus(g, 0.31, 0.028, [vx, -0.34 + j * 0.2, 0], copper);
        animated.push({ object: coil, kind: "heater-coil", stage: 4, phase: j / 4, speed: 0.6 });
      }
      for (let j = 0; j < 6; j++) {
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), hot); g.add(bubble);
        animated.push({ object: bubble, kind: "boiling", stage: 4, phase: (j + i + 3) / 9, speed: 0.24 });
      }
      vessel.userData.evaporationVessel = true;
    }
    for (let i = 0; i < 18; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), vapor); g.add(puff);
      animated.push({ object: puff, kind: "vapour", stage: 4, phase: i / 18, speed: 0.15 });
    }
    pipe(g, new THREE.Vector3(x, 1.08, 0), new THREE.Vector3(x, 1.8, 0), processPipe, 0.075);
  }

  // 06 Crystallizer: jacketed vessel, agitator and suspended crystal population.
  {
    const x = xs[5];
    const vessel = cyl(g, 0.74, 2.0, [x, 0.1, 0], steel, 34);
    const liquor = cyl(g, 0.61, 1.15, [x, -0.38, 0], juice, 28); liquor.castShadow = false;
    for (let j = 0; j < 5; j++) {
      const jacket = torus(g, 0.66, 0.025, [x, -0.62 + j * 0.28, 0], copper);
      animated.push({ object: jacket, kind: "jacket", stage: 5, phase: j / 5, speed: 0.25 });
    }
    const shaft = cyl(g, 0.055, 2.5, [x, 0.48, 0], steelDark, 12);
    animated.push({ object: shaft, kind: "agitator-shaft", stage: 5, phase: 0, speed: 0.7 });
    for (const y of [-0.45, 0, 0.45]) {
      const blade = box(g, [1.15, 0.06, 0.08], [x, y, 0], steelDark);
      animated.push({ object: blade, kind: "agitator-blade", stage: 5, phase: y, speed: 0.7 });
    }
    for (let i = 0; i < 28; i++) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), sugar); g.add(crystal);
      animated.push({ object: crystal, kind: "crystal-growth", stage: 5, phase: i / 28, speed: 0.12 });
    }
    vessel.userData.crystallizer = true;
  }

  // 07 Centrifuge: basket, perforated-looking rings and outward solids separation.
  {
    const x = xs[6];
    const housing = cyl(g, 0.88, 1.5, [x, 0.12, 0], steelDark, 40); housing.rotation.z = Math.PI / 2;
    const basket = cyl(g, 0.69, 1.55, [x, 0.12, 0], steel, 36); basket.rotation.z = Math.PI / 2;
    animated.push({ object: basket, kind: "centrifuge-basket", stage: 6, phase: 0, speed: 4.2 });
    for (let r = 0.25; r <= 0.65; r += 0.13) {
      const ring = torus(g, r, 0.022, [x, 0.12, 0], copper);
      animated.push({ object: ring, kind: "centrifuge-ring", stage: 6, phase: r, speed: 4.2 });
    }
    for (let i = 0; i < 22; i++) {
      const grain = new THREE.Mesh(new THREE.OctahedronGeometry(0.032), sugar); g.add(grain);
      animated.push({ object: grain, kind: "centrifuge-grain", stage: 6, phase: i / 22, speed: 4.2 });
    }
  }

  // 08 Dryer: perforated chamber, moving bed and hot-air stream.
  {
    const x = xs[7];
    box(g, [1.65, 2.05, 1.45], [x, 0.08, 0], steelDark);
    box(g, [1.35, 1.5, 1.18], [x, 0.08, 0], steel);
    for (let i = 0; i < 20; i++) {
      const grain = new THREE.Mesh(new THREE.OctahedronGeometry(0.032), sugar); g.add(grain);
      animated.push({ object: grain, kind: "dryer-grain", stage: 7, phase: i / 20, speed: 0.22 });
    }
    for (let i = 0; i < 14; i++) {
      const air = new THREE.Mesh(new THREE.SphereGeometry(0.028, 7, 7), vapor); g.add(air);
      animated.push({ object: air, kind: "dryer-air", stage: 7, phase: i / 14, speed: 0.36 });
    }
    pipe(g, new THREE.Vector3(x, -1.0, 0), new THREE.Vector3(x, -0.15, 0), processPipe, 0.08);
  }

  return g;
}

function cameraPose(index: number) {
  const x = xs[index];
  return { position: new THREE.Vector3(x * 0.36, 3.35, 17.8), target: new THREE.Vector3(x * 0.33, 0.05, 0) };
}

export default function ProcessLineOverview() {
  const mount = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!mount.current) return;
    const element = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080f12);
    scene.fog = new THREE.Fog(0x080f12, 13, 34);
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 70);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xd7e8e4, 0x10171a, 1.55));
    const key = new THREE.DirectionalLight(0xf1eee5, 3.6);
    key.position.set(3, 9, 8); key.castShadow = true; scene.add(key);
    const rim = new THREE.DirectionalLight(0x6aa9a0, 1.5); rim.position.set(-8, 4, -5); scene.add(rim);

    const animated: Animated[] = [];
    const factory = buildFactory(animated);
    scene.add(factory);

    const hits = stages.map((_, index) => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(1.95, 3.6, 2.45), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      h.position.set(xs[index], 0.4, 0); h.userData.stageIndex = index; factory.add(h); return h;
    });
    const markers = stages.map((_, index) => {
      const m = torus(factory, 0.62, 0.035, [xs[index], -1.08, 0], new THREE.MeshStandardMaterial({ color: 0x71cbbd, emissive: 0x164c44, emissiveIntensity: 1.3, transparent: true, opacity: 0.95 }));
      m.visible = index === 0; return m;
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.5, 8), new THREE.MeshBasicMaterial({ color: 0x71cbbd, transparent: true, opacity: 0.35 }));
    beam.position.set(xs[0], 0.2, 0); factory.add(beam);

    let goal = cameraPose(0); let currentTarget = goal.target.clone();
    camera.position.copy(goal.position); camera.lookAt(goal.target);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const pointerCoords = (e: MouseEvent | PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      raycaster.setFromCamera(pointer, camera);
    };
    const selectScene = (index: number) => {
      setSelected(index); markers.forEach((m, i) => { m.visible = i === index; }); beam.position.x = xs[index];
      window.dispatchEvent(new CustomEvent("food-process-stage-select", { detail: index }));
    };
    const onMove = (e: PointerEvent) => { pointerCoords(e); renderer.domElement.style.cursor = raycaster.intersectObjects(hits, false).length ? "pointer" : "default"; };
    const onClick = (e: MouseEvent) => { pointerCoords(e); const hit = raycaster.intersectObjects(hits, false)[0]; if (hit) selectScene(Number(hit.object.userData.stageIndex)); };
    const onStage = (e: Event) => { const i = Math.max(0, Math.min(7, Number((e as CustomEvent<number>).detail))); selectScene(i); goal = cameraPose(i); };
    const onOpenInspection = (e: Event) => {
      const i = Math.max(0, Math.min(7, Number((e as CustomEvent<number>).detail))); selectScene(i);
      window.setTimeout(() => {
        const cards = document.querySelectorAll<HTMLButtonElement>(".stage-card");
        cards[i]?.click(); cards[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => document.querySelector<HTMLButtonElement>(".explorer-stage .enter-equipment")?.click(), 100);
      }, 0);
    };
    renderer.domElement.addEventListener("pointermove", onMove); renderer.domElement.addEventListener("click", onClick);
    window.addEventListener("food-process-stage-select", onStage); window.addEventListener("food-process-open-inspection", onOpenInspection);

    const timer = new THREE.Timer(); let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate); timer.update();
      const delta = Math.min(timer.getDelta(), 0.05); const elapsed = timer.getElapsed();
      camera.position.lerp(goal.position, 1 - Math.pow(0.001, delta * 1.35));
      currentTarget.lerp(goal.target, 1 - Math.pow(0.001, delta * 1.5)); camera.lookAt(currentTarget);
      factory.rotation.y = Math.sin(elapsed * 0.08) * 0.008;
      markers.forEach(m => { if (m.visible) { const s = 1 + Math.sin(elapsed * 3.5) * 0.1; m.scale.setScalar(s); } });
      beam.scale.y = 0.88 + Math.sin(elapsed * 2.2) * 0.12;

      animated.forEach(item => {
        const { object, kind, stage, phase, speed } = item; const cycle = (elapsed * speed + phase) % 1; const x = xs[stage];
        if (kind === "pipe-flow") {
          const a = object.userData.flowA as THREE.Vector3; const b = object.userData.flowB as THREE.Vector3;
          object.position.lerpVectors(a, b, cycle);
        } else if (kind === "cane-feed") {
          object.position.x = x - 1.15 + cycle * 1.8; object.position.z = Math.sin(cycle * Math.PI * 2 + phase * 8) * 0.12; object.rotation.z = cycle * Math.PI * 2;
        } else if (kind === "conveyor-roller") {
          object.rotation.x += delta * speed;
        } else if (["prep-roller", "shred-drum", "shred-shaft", "shred-blade", "mill-roll", "roll-groove", "centrifuge-basket", "centrifuge-ring", "agitator-shaft", "agitator-blade", "jacket"].includes(kind)) {
          object.rotation.x += delta * speed;
          if (kind === "shred-blade" || kind === "agitator-blade") object.rotation.y += delta * speed * 0.35;
        } else if (kind === "shredded-fiber") {
          object.position.x = x + 0.5 + cycle * 0.9; object.position.y = -0.18 + Math.sin(cycle * 7 + phase) * 0.08; object.rotation.z += delta * 2;
        } else if (kind === "extracted-juice") {
          object.position.set(x - 0.55 + (phase * 12 % 4) * 0.25, -0.4 - cycle * 0.42, -0.35 + (phase * 7 % 3) * 0.28); object.scale.setScalar(0.65 + Math.sin(cycle * Math.PI) * 0.35);
        } else if (kind === "settling-solid") {
          object.position.set(x - 0.45 + (phase * 17 % 4) * 0.25, 0.62 - cycle * 1.25, -0.3 + (phase * 13 % 3) * 0.22);
        } else if (kind === "boiling") {
          object.position.set(x + (phase * 7 % 3) * 0.18 - 0.2 + Math.sin(elapsed * 2 + phase) * 0.04, -0.35 + cycle * 1.05, 0.04); object.scale.setScalar(0.5 + Math.sin(cycle * Math.PI) * 0.7);
        } else if (kind === "vapour") {
          object.position.set(x - 0.65 + (phase * 11 % 5) * 0.3 + Math.sin(elapsed + phase) * 0.05, 1.0 + cycle * 1.65, -0.04); object.scale.setScalar(0.55 + Math.sin(cycle * Math.PI) * 0.7);
        } else if (kind === "crystal-growth") {
          const a = phase * Math.PI * 2 + elapsed * 0.18; const r = 0.12 + ((phase * 19) % 5) * 0.08;
          object.position.set(x + Math.cos(a) * r, -0.65 + ((phase * 23) % 7) * 0.16 + cycle * 0.05, Math.sin(a) * r);
          object.scale.setScalar(0.35 + cycle * 1.0); object.rotation.x += delta * 0.25; object.rotation.y += delta * 0.4;
        } else if (kind === "centrifuge-grain") {
          const a = elapsed * 4.2 + phase * Math.PI * 2; const r = 0.18 + cycle * 0.62;
          object.position.set(x + Math.cos(a) * r, 0.12 + Math.sin(a * 2) * 0.08, Math.sin(a) * r); object.rotation.x += delta * 2.5; object.rotation.y += delta * 2.5;
        } else if (kind === "dryer-grain") {
          object.position.set(x - 0.5 + (phase * 17 % 6) * 0.17, -0.58 + cycle * 1.35, -0.42 + (phase * 13 % 5) * 0.18); object.rotation.x += delta * 0.8; object.rotation.y += delta * 1.0;
        } else if (kind === "dryer-air") {
          object.position.set(x - 0.45 + (phase * 11 % 5) * 0.2, -0.95 + cycle * 1.8, -0.38 + (phase * 7 % 4) * 0.22); object.scale.setScalar(0.5 + Math.sin(cycle * Math.PI) * 0.55);
        }
      });
      renderer.render(scene, camera);
    };
    animate();
    const resize = () => { camera.aspect = element.clientWidth / Math.max(1, element.clientHeight); camera.updateProjectionMatrix(); renderer.setSize(element.clientWidth, element.clientHeight, false); };
    resize(); window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animationId); renderer.domElement.removeEventListener("pointermove", onMove); renderer.domElement.removeEventListener("click", onClick); window.removeEventListener("food-process-stage-select", onStage); window.removeEventListener("food-process-open-inspection", onOpenInspection); window.removeEventListener("resize", resize); renderer.dispose(); if (element.contains(renderer.domElement)) element.removeChild(renderer.domElement); };
  }, []);

  const stage = stages[selected];
  const select = (index: number) => { setSelected(index); window.dispatchEvent(new CustomEvent("food-process-stage-select", { detail: index })); };
  const openInspection = () => window.dispatchEvent(new CustomEvent("food-process-open-inspection", { detail: selected }));

  return (
    <section className="process-line-overview">
      <div className="process-line-heading">
        <div><span>PRODUCTION LINE · REALISTIC PROCESS VIEW</span><h2>Watch the physical transformation inside the factory</h2></div>
        <p>The animation now follows machine mechanics and material behavior instead of decorative motion: rollers rotate, fluids travel through pipes, solids settle, vapour rises, crystals form and separation occurs.</p>
      </div>
      <div ref={mount} className="process-line-canvas" aria-label="Interactive realistic 3D sugar production process" />
      <div className="process-line-stages">
        {stages.map((item, index) => <button key={item.stepId} type="button" className={selected === index ? "process-line-stage active" : "process-line-stage"} onClick={() => select(index)}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{item.name}</span><small>{item.equipmentId}</small></button>)}
      </div>
      <div className="process-line-selected">
        <div><span>SELECTED EQUIPMENT · STAGE {selected + 1}</span><strong>{stage.equipmentId}</strong><h3>{stage.name}</h3><p>{stage.description}</p></div>
        <div className="selected-flow"><span>INPUT · {stage.inputStreams.map(s => s.materialId).join(" + ")}</span><span>OUTPUT · {stage.outputStreams.map(s => s.materialId).join(" + ")}</span><button type="button" onClick={openInspection}>View Details · نمایش جزئیات</button></div>
      </div>
    </section>
  );
}
