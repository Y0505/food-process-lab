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
};

const mat = (color: number, metalness = 0.25, roughness = 0.5) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const glass = (color: number, opacity = 0.16) =>
  new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity, roughness: 0.12, transmission: 0.15, depthWrite: false });

function addBox(g: THREE.Group, size: [number, number, number], p: [number, number, number], m: THREE.Material) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(...size), m);
  o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function addCylinder(g: THREE.Group, r: number, h: number, p: [number, number, number], m: THREE.Material, segments = 24) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), m);
  o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function addPipe(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, m: THREE.Material, radius = 0.055) {
  const d = b.clone().sub(a);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 12), m);
  o.position.copy(a).add(b).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  o.castShadow = true; g.add(o); return o;
}
function addFlow(animated: Animated[], g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, stage: number, m: THREE.Material, count = 8, speed = 0.2) {
  for (let i = 0; i < count; i++) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), m);
    o.userData.a = a.clone(); o.userData.b = b.clone(); g.add(o);
    animated.push({ object: o, kind: "flow", stage, phase: i / count, speed });
  }
}
function addGrain(g: THREE.Group, p: [number, number, number], m: THREE.Material, size = 0.045) {
  const o = new THREE.Mesh(new THREE.OctahedronGeometry(size), m); o.position.set(...p); g.add(o); return o;
}

function buildFactory(animated: Animated[]) {
  const g = new THREE.Group();
  const steel = mat(0x77898a, 0.8, 0.28);
  const darkSteel = mat(0x273a3d, 0.82, 0.3);
  const frame = mat(0x405457, 0.72, 0.34);
  const copper = mat(0xb07a45, 0.68, 0.3);
  const cane = mat(0x9c8651, 0.05, 0.82);
  const caneFresh = mat(0xb3a05b, 0.03, 0.78);
  const fiber = mat(0x8c7446, 0.02, 0.9);
  const sugar = mat(0xf4e4a8, 0.02, 0.25);
  const juice = mat(0x4e9a62, 0.03, 0.3);
  const syrup = mat(0x7f5a31, 0.03, 0.34);
  const molasses = mat(0x3a251b, 0.02, 0.46);
  const hot = mat(0xe28b42, 0.05, 0.4);
  const pipe = mat(0x3f6e68, 0.72, 0.3);
  const transparent = glass(0x9bd0d0, 0.12);
  const vapor = new THREE.MeshBasicMaterial({ color: 0xe4f5f0, transparent: true, opacity: 0.22 });

  // Factory floor and support structure.
  addBox(g, [21, 0.18, 5.4], [0, -1.43, 0], mat(0x10191c, 0.15, 0.9));
  for (const x of xs) {
    addBox(g, [0.07, 4.1, 0.07], [x - 0.95, 0.45, -1.15], frame);
    addBox(g, [0.07, 4.1, 0.07], [x + 0.95, 0.45, -1.15], frame);
  }
  addBox(g, [20.8, 0.08, 0.08], [0, 2.5, -1.15], frame);

  // A single material route ties the stations together, but the stations themselves show the transformation.
  for (let i = 0; i < xs.length - 1; i++) {
    const a = new THREE.Vector3(xs[i] + 0.78, 0.1, 0);
    const b = new THREE.Vector3(xs[i + 1] - 0.78, 0.1, 0);
    addPipe(g, a, b, pipe, 0.065);
    addFlow(animated, g, a, b, i, i < 3 ? juice : syrup, 6, 0.16);
  }

  // 01 PREPARATION — whole cane is cut into short feed pieces.
  {
    const x = xs[0];
    addBox(g, [1.75, 0.14, 1.18], [x - 0.15, -0.32, 0], darkSteel);
    for (const z of [-0.48, 0.48]) {
      const r = addCylinder(g, 0.14, 1.08, [x - 0.72, -0.12, z], steel, 20);
      r.rotation.x = Math.PI / 2; animated.push({ object: r, kind: "rotate-x", stage: 0, phase: z, speed: 2 });
    }
    // Long cane stalks enter the belt from the left.
    for (let i = 0; i < 5; i++) {
      const stalk = addCylinder(g, 0.075, 1.1, [x - 1.05 + i * 0.2, -0.02, -0.28 + (i % 2) * 0.22], caneFresh, 10);
      stalk.rotation.z = Math.PI / 2; animated.push({ object: stalk, kind: "whole-cane", stage: 0, phase: i / 5, speed: 0.25 });
    }
    // Cutter wheel makes the transformation visible rather than decorative.
    const wheel = addCylinder(g, 0.5, 0.18, [x + 0.55, 0.22, 0], copper, 32);
    wheel.rotation.z = Math.PI / 2; animated.push({ object: wheel, kind: "cutter", stage: 0, phase: 0, speed: 2.8 });
    for (let i = 0; i < 8; i++) {
      const blade = addBox(g, [0.05, 0.08, 0.42], [x + 0.55, 0.22, 0], steel);
      blade.rotation.y = (i / 8) * Math.PI * 2; animated.push({ object: blade, kind: "cutter-blade", stage: 0, phase: i / 8, speed: 2.8 });
    }
    for (let i = 0; i < 12; i++) {
      const piece = addBox(g, [0.16, 0.07, 0.07], [x + 0.55 + (i % 4) * 0.2, 0.05, -0.35 + (i % 3) * 0.3], cane);
      animated.push({ object: piece, kind: "cut-cane", stage: 0, phase: i / 12, speed: 0.32 });
    }
  }

  // 02 SHREDDING — open drum with knives visibly tearing the cane into fibers.
  {
    const x = xs[1];
    addBox(g, [1.65, 1.7, 1.35], [x, 0.15, 0], transparent);
    const shaft = addCylinder(g, 0.09, 1.5, [x, 0.2, 0], copper, 16);
    shaft.rotation.x = Math.PI / 2; animated.push({ object: shaft, kind: "rotate-z", stage: 1, phase: 0, speed: 3.8 });
    for (let i = 0; i < 7; i++) {
      const blade = addBox(g, [0.75, 0.055, 0.1], [x, 0.2, 0], steel);
      blade.rotation.z = (i / 7) * Math.PI * 2; animated.push({ object: blade, kind: "shred-blade", stage: 1, phase: i / 7, speed: 3.8 });
    }
    // Feed chute and intact pieces entering the cutting zone.
    addBox(g, [0.55, 0.12, 0.8], [x, 1.08, 0], frame);
    for (let i = 0; i < 7; i++) {
      const piece = addBox(g, [0.12, 0.22, 0.08], [x - 0.18 + (i % 3) * 0.18, 0.92, -0.25 + (i % 2) * 0.3], caneFresh);
      animated.push({ object: piece, kind: "shred-input", stage: 1, phase: i / 7, speed: 0.28 });
    }
    // Fiber ribbons leave the bottom-right of the cutter.
    for (let i = 0; i < 13; i++) {
      const ribbon = addBox(g, [0.22, 0.035, 0.035], [x + 0.35, -0.48, -0.42 + (i % 6) * 0.16], fiber);
      animated.push({ object: ribbon, kind: "fiber", stage: 1, phase: i / 13, speed: 0.42 });
    }
  }

  // 03 EXTRACTION — two grooved rolls squeeze shredded cane; juice falls, bagasse exits.
  {
    const x = xs[2];
    for (const z of [-0.34, 0.34]) {
      const roll = addCylinder(g, 0.42, 1.25, [x, 0.28, z], steel, 36);
      roll.rotation.x = Math.PI / 2; animated.push({ object: roll, kind: "mill-roll", stage: 2, phase: z, speed: z < 0 ? 1.8 : -1.8 });
      for (let j = 0; j < 7; j++) {
        const groove = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.018, 8, 30), copper);
        groove.position.set(x, 0.28, z); groove.rotation.x = Math.PI / 2; groove.rotation.z = j * 0.08; g.add(groove);
      }
    }
    // Shredded cane visibly enters the nip point.
    for (let i = 0; i < 10; i++) {
      const strand = addBox(g, [0.18, 0.035, 0.035], [x - 0.78 + (i % 4) * 0.16, 0.48, -0.22 + (i % 3) * 0.2], fiber);
      animated.push({ object: strand, kind: "pressed-fiber", stage: 2, phase: i / 10, speed: 0.36 });
    }
    addBox(g, [1.5, 0.13, 1.0], [x, -0.58, 0], darkSteel);
    // Juice droplets separate downward.
    for (let i = 0; i < 15; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), juice); g.add(drop);
      animated.push({ object: drop, kind: "juice-drop", stage: 2, phase: i / 15, speed: 0.45 });
    }
    // Dry bagasse visibly leaves to the right.
    for (let i = 0; i < 10; i++) {
      const bagasse = addBox(g, [0.2, 0.05, 0.06], [x + 0.55 + (i % 5) * 0.16, -0.18, -0.32 + (i % 3) * 0.22], fiber);
      animated.push({ object: bagasse, kind: "bagasse", stage: 2, phase: i / 10, speed: 0.3 });
    }
  }

  // 04 CLARIFICATION — transparent vessel exposes clear juice above a settling solids layer.
  {
    const x = xs[3];
    addCylinder(g, 0.78, 2.05, [x, 0.15, 0], transparent, 40);
    addCylinder(g, 0.65, 0.92, [x, -0.38, 0], juice, 32);
    addCylinder(g, 0.66, 0.22, [x, -0.88, 0], copper, 32);
    const shaft = addCylinder(g, 0.045, 1.7, [x, 0.55, 0], darkSteel, 12);
    animated.push({ object: shaft, kind: "clarifier-rake", stage: 3, phase: 0, speed: 0.32 });
    for (const y of [-0.48, -0.7]) {
      const rake = addBox(g, [1.0, 0.045, 0.06], [x, y, 0], darkSteel);
      animated.push({ object: rake, kind: "rake", stage: 3, phase: y, speed: 0.32 });
    }
    for (let i = 0; i < 22; i++) {
      const solid = new THREE.Mesh(new THREE.SphereGeometry(0.028, 7, 7), copper); g.add(solid);
      animated.push({ object: solid, kind: "settle", stage: 3, phase: i / 22, speed: 0.06 });
    }
    // Clear overflow at the top makes the separation legible.
    addPipe(g, new THREE.Vector3(x + 0.62, 0.68, 0), new THREE.Vector3(x + 1.0, 0.68, 0), pipe, 0.06);
  }

  // 05 EVAPORATION — three open vessels show boiling liquid becoming darker/thicker while vapour leaves.
  {
    const x = xs[4];
    for (let i = -1; i <= 1; i++) {
      const vx = x + i * 0.48;
      addCylinder(g, 0.43, 1.7, [vx, 0.1, 0], transparent, 32);
      addCylinder(g, 0.35, 0.72, [vx, -0.42, 0], syrup, 24);
      for (let j = 0; j < 5; j++) {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.024, 8, 24), copper);
        coil.position.set(vx, -0.43 + j * 0.17, 0); coil.rotation.x = Math.PI / 2; g.add(coil);
      }
      for (let j = 0; j < 6; j++) {
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), hot); g.add(bubble);
        animated.push({ object: bubble, kind: "bubble", stage: 4, phase: (j + i + 4) / 10, speed: 0.25 });
      }
    }
    for (let i = 0; i < 16; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), vapor); g.add(p);
      animated.push({ object: p, kind: "vapor", stage: 4, phase: i / 16, speed: 0.15 });
    }
  }

  // 06 CRYSTALLIZATION — transparent vessel shows syrup, agitation and visible sugar crystals growing.
  {
    const x = xs[5];
    addCylinder(g, 0.76, 2.0, [x, 0.1, 0], transparent, 34);
    addCylinder(g, 0.61, 1.15, [x, -0.38, 0], syrup, 28);
    const shaft = addCylinder(g, 0.05, 2.4, [x, 0.48, 0], darkSteel, 12);
    animated.push({ object: shaft, kind: "agitator", stage: 5, phase: 0, speed: 0.75 });
    for (const y of [-0.45, 0, 0.45]) {
      const blade = addBox(g, [1.05, 0.06, 0.08], [x, y, 0], darkSteel);
      animated.push({ object: blade, kind: "agitator-blade", stage: 5, phase: y, speed: 0.75 });
    }
    for (let i = 0; i < 34; i++) {
      const c = addGrain(g, [x, -0.62, 0], sugar, 0.038);
      animated.push({ object: c, kind: "crystal", stage: 5, phase: i / 34, speed: 0.1 });
    }
  }

  // 07 CENTRIFUGATION — basket spins; crystal cake remains on the wall while dark mother liquor separates.
  {
    const x = xs[6];
    addCylinder(g, 0.88, 1.45, [x, 0.12, 0], transparent, 40).rotation.z = Math.PI / 2;
    const basket = addCylinder(g, 0.69, 1.48, [x, 0.12, 0], steel, 36);
    basket.rotation.z = Math.PI / 2; animated.push({ object: basket, kind: "centrifuge", stage: 6, phase: 0, speed: 4.2 });
    // Crystal cake ring and radial liquor droplets communicate the separation.
    const cake = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.12, 14, 36), sugar); cake.position.set(x, 0.12, 0); g.add(cake);
    animated.push({ object: cake, kind: "centrifuge-cake", stage: 6, phase: 0, speed: 4.2 });
    for (let i = 0; i < 18; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.03, 7, 7), molasses); g.add(drop);
      animated.push({ object: drop, kind: "mother-liquor", stage: 6, phase: i / 18, speed: 4.2 });
    }
  }

  // 08 DRYING — wet crystals enter, hot air passes through, dry crystals leave.
  {
    const x = xs[7];
    addBox(g, [1.6, 1.9, 1.45], [x, 0.05, 0], transparent);
    addBox(g, [0.1, 1.7, 1.35], [x - 0.72, 0.05, 0], darkSteel);
    addBox(g, [0.1, 1.7, 1.35], [x + 0.72, 0.05, 0], darkSteel);
    for (let i = 0; i < 25; i++) {
      const grain = addGrain(g, [x, -0.6, 0], sugar, 0.035);
      animated.push({ object: grain, kind: "dry-grain", stage: 7, phase: i / 25, speed: 0.22 });
    }
    for (let i = 0; i < 15; i++) {
      const air = new THREE.Mesh(new THREE.SphereGeometry(0.025, 7, 7), vapor); g.add(air);
      animated.push({ object: air, kind: "hot-air", stage: 7, phase: i / 15, speed: 0.38 });
    }
    addPipe(g, new THREE.Vector3(x - 0.95, -0.95, 0), new THREE.Vector3(x - 0.7, -0.35, 0), pipe, 0.08);
  }

  return g;
}

function cameraPose(index: number) {
  const x = xs[index];
  return { position: new THREE.Vector3(x * 0.34, 2.9, 17.5), target: new THREE.Vector3(x * 0.31, 0.0, 0) };
}

export default function ProcessLineOverview() {
  const mount = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!mount.current) return;
    const element = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080f12);
    scene.fog = new THREE.Fog(0x080f12, 12, 32);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdcebe8, 0x11191c, 1.6));
    const key = new THREE.DirectionalLight(0xf5eee1, 3.5); key.position.set(2, 8, 9); key.castShadow = true; scene.add(key);
    const fill = new THREE.DirectionalLight(0x72b6aa, 1.1); fill.position.set(-8, 4, -5); scene.add(fill);

    const animated: Animated[] = [];
    const factory = buildFactory(animated); scene.add(factory);
    const hits = stages.map((_, index) => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(1.95, 3.4, 2.5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      h.position.set(xs[index], 0.3, 0); h.userData.stageIndex = index; factory.add(h); return h;
    });
    const markers = stages.map((_, index) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 10, 32), new THREE.MeshStandardMaterial({ color: 0x71cbbd, emissive: 0x164c44, emissiveIntensity: 1.2 }));
      m.rotation.x = Math.PI / 2; m.position.set(xs[index], -1.08, 0); m.visible = index === 0; factory.add(m); return m;
    });

    let goal = cameraPose(0); let target = goal.target.clone();
    camera.position.copy(goal.position); camera.lookAt(goal.target);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const pointerCoords = (e: MouseEvent | PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      raycaster.setFromCamera(pointer, camera);
    };
    const selectScene = (index: number) => {
      setSelected(index); markers.forEach((m, i) => { m.visible = i === index; });
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

    const clock = new THREE.Clock(); let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05); const elapsed = clock.elapsedTime;
      camera.position.lerp(goal.position, 1 - Math.pow(0.001, delta * 1.35));
      target.lerp(goal.target, 1 - Math.pow(0.001, delta * 1.5)); camera.lookAt(target);
      markers.forEach(m => { if (m.visible) m.scale.setScalar(1 + Math.sin(elapsed * 3.5) * 0.09); });

      animated.forEach(item => {
        const { object, kind, stage, phase, speed } = item;
        const cycle = (elapsed * speed + phase) % 1; const x = xs[stage];
        if (kind === "flow") {
          object.position.lerpVectors(object.userData.a as THREE.Vector3, object.userData.b as THREE.Vector3, cycle);
        } else if (kind === "whole-cane") {
          object.position.x = x - 1.15 + cycle * 1.35; object.rotation.x += delta * 0.5;
        } else if (kind === "cut-cane") {
          object.position.x = x + 0.45 + cycle * 0.75; object.position.y = 0.03 + Math.sin(cycle * 5 + phase) * 0.04;
        } else if (kind === "rotate-x") {
          object.rotation.x += delta * speed;
        } else if (kind === "cutter" || kind === "cutter-blade") {
          object.rotation.x += delta * speed;
        } else if (kind === "shred-blade") {
          object.rotation.z += delta * speed;
        } else if (kind === "shred-input") {
          object.position.y = 1.0 - cycle * 1.0; object.position.x = x - 0.15 + Math.sin(cycle * 5 + phase) * 0.16;
        } else if (kind === "fiber") {
          object.position.x = x + 0.25 + cycle * 0.9; object.position.y = -0.45 - cycle * 0.2;
          object.rotation.z += delta * 2;
        } else if (kind === "mill-roll") {
          object.rotation.z += delta * speed;
        } else if (kind === "pressed-fiber") {
          object.position.x = x - 0.8 + cycle * 0.85; object.scale.x = 1 - cycle * 0.25;
        } else if (kind === "juice-drop") {
          object.position.set(x - 0.5 + (phase * 13 % 4) * 0.24, -0.05 - cycle * 0.95, -0.28 + (phase * 7 % 3) * 0.2);
        } else if (kind === "bagasse") {
          object.position.x = x + 0.45 + cycle * 0.9; object.position.y = -0.18 + Math.sin(cycle * 6 + phase) * 0.06;
        } else if (kind === "clarifier-rake" || kind === "rake") {
          object.rotation.y += delta * speed;
        } else if (kind === "settle") {
          object.position.set(x - 0.45 + (phase * 17 % 4) * 0.24, 0.55 - cycle * 1.32, -0.25 + (phase * 11 % 3) * 0.22);
        } else if (kind === "bubble") {
          object.position.set(x + ((phase * 9) % 3) * 0.2 - 0.2, -0.35 + cycle * 0.92, 0.02); object.scale.setScalar(0.45 + Math.sin(cycle * Math.PI) * 0.7);
        } else if (kind === "vapor") {
          object.position.set(x - 0.65 + ((phase * 11) % 5) * 0.3, 0.85 + cycle * 1.4, 0); object.scale.setScalar(0.5 + Math.sin(cycle * Math.PI) * 0.7);
        } else if (kind === "agitator" || kind === "agitator-blade") {
          object.rotation.y += delta * speed;
        } else if (kind === "crystal") {
          const a = phase * Math.PI * 2 + elapsed * 0.12; const r = 0.1 + ((phase * 23) % 6) * 0.075;
          object.position.set(x + Math.cos(a) * r, -0.66 + ((phase * 19) % 8) * 0.14, Math.sin(a) * r); object.scale.setScalar(0.35 + cycle * 1.0);
        } else if (kind === "centrifuge" || kind === "centrifuge-cake") {
          object.rotation.x += delta * speed;
        } else if (kind === "mother-liquor") {
          const a = elapsed * speed + phase * Math.PI * 2; const r = 0.18 + cycle * 0.65;
          object.position.set(x + Math.cos(a) * r, 0.12 + Math.sin(a * 2) * 0.07, Math.sin(a) * r);
        } else if (kind === "dry-grain") {
          object.position.set(x - 0.55 + cycle * 1.1, -0.6 + cycle * 1.3, -0.42 + (phase * 13 % 5) * 0.18); object.rotation.x += delta; object.rotation.y += delta;
        } else if (kind === "hot-air") {
          object.position.set(x - 0.48 + (phase * 11 % 5) * 0.2, -0.9 + cycle * 1.75, -0.38 + (phase * 7 % 4) * 0.2); object.scale.setScalar(0.5 + Math.sin(cycle * Math.PI) * 0.6);
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
        <div><span>3D PROCESS LAB · MATERIAL TRANSFORMATION</span><h2>See what happens to the sugarcane</h2></div>
        <p>Each station exposes the physical action: cane is cut, fibers are shredded, juice is squeezed out, solids settle, water boils away, crystals grow, liquor separates and sugar dries.</p>
      </div>
      <div ref={mount} className="process-line-canvas" aria-label="Interactive 3D sugarcane transformation process" />
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
