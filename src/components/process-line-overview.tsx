"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const model = buildSugarcaneVisualizationModel();
const stages = model.stages;
const xs = stages.map((_, i) => -8.4 + i * 2.4);

const mat = (color: number, metalness = 0.45, roughness = 0.42) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });

const addBox = (
  g: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
};

const addCylinder = (
  g: THREE.Group,
  radius: number,
  height: number,
  position: [number, number, number],
  material: THREE.Material,
  radialSegments = 24,
) => {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, radialSegments),
    material,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
};

const addPipe = (
  g: THREE.Group,
  a: THREE.Vector3,
  b: THREE.Vector3,
  material: THREE.Material,
  radius = 0.055,
) => {
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 12),
    material,
  );
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  g.add(mesh);
  return mesh;
};

type Animated = { object: THREE.Object3D; kind: string; stage: number; phase: number; speed: number };

function buildFactory(animated: Animated[]) {
  const group = new THREE.Group();
  const steel = mat(0x71898d, 0.82, 0.28);
  const dark = mat(0x101f24, 0.72, 0.34);
  const copper = mat(0x9a704b, 0.7, 0.34);
  const cane = mat(0xb18a54, 0.05, 0.82);
  const sugar = mat(0xf1dda0, 0.05, 0.24);
  const juice = new THREE.MeshStandardMaterial({
    color: 0x48c28d,
    transparent: true,
    opacity: 0.72,
    emissive: 0x123d2d,
    emissiveIntensity: 0.45,
  });
  const hot = new THREE.MeshStandardMaterial({
    color: 0xf0b56a,
    transparent: true,
    opacity: 0.65,
    emissive: 0x6b3215,
    emissiveIntensity: 0.75,
  });
  const vapor = new THREE.MeshStandardMaterial({
    color: 0xc4eeeb,
    transparent: true,
    opacity: 0.22,
    emissive: 0x5baaa5,
    emissiveIntensity: 1.2,
  });

  addBox(group, [20.5, 0.18, 4.8], [0, -1.3, 0], dark);
  addBox(group, [20, 0.12, 0.12], [0, 3, -0.85], steel);
  addBox(group, [20, 0.08, 0.08], [0, 2.78, -0.85], steel);

  for (const x of xs) {
    addBox(group, [1.72, 0.12, 1.8], [x, -1.19, 0], steel);
    addBox(group, [0.07, 4.2, 0.07], [x, 0.8, -0.85], dark);
  }

  // A visible process spine. The moving dots are intentionally oversized so the
  // transformation is readable even before the learner enters a machine.
  const pipeMaterial = mat(0x3f9c8a, 0.7, 0.3);
  for (let i = 0; i < xs.length - 1; i += 1) {
    addPipe(
      group,
      new THREE.Vector3(xs[i] + 0.72, -0.02, 0),
      new THREE.Vector3(xs[i + 1] - 0.72, -0.02, 0),
      pipeMaterial,
      0.075,
    );
    for (let p = 0; p < 5; p += 1) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), juice);
      group.add(particle);
      animated.push({ object: particle, kind: "main-flow", stage: i, phase: p / 5, speed: 0.12 });
    }
  }

  // 01 Preparation: rotating feed rollers + cane pieces entering the rollers.
  {
    const x = xs[0];
    for (let i = -3; i <= 3; i += 1) {
      const roller = addCylinder(group, 0.18, 1.35, [x + i * 0.2, 0.3, 0], steel, 18);
      roller.rotation.z = Math.PI / 2;
      animated.push({ object: roller, kind: "roller", stage: 0, phase: i * 0.08, speed: 1 });
    }
    addBox(group, [0.9, 0.8, 1.2], [x - 0.78, 1.1, 0], dark);
    for (let i = 0; i < 8; i += 1) {
      const piece = addBox(group, [0.42, 0.08, 0.08], [x - 1.1 + (i % 4) * 0.22, 1.38 + Math.floor(i / 4) * 0.12, 0], cane);
      animated.push({ object: piece, kind: "cane", stage: 0, phase: i / 8, speed: 0.35 });
    }
  }

  // 02 Shredding: horizontal drum and cutter paddles visibly rotate.
  {
    const x = xs[1];
    const drum = addCylinder(group, 0.76, 1.55, [x, 0.65, 0], dark, 32);
    drum.rotation.z = Math.PI / 2;
    animated.push({ object: drum, kind: "shred-drum", stage: 1, phase: 0, speed: 1.2 });
    const shaft = addCylinder(group, 0.09, 1.9, [x, 0.65, 0], steel, 14);
    shaft.rotation.z = Math.PI / 2;
    animated.push({ object: shaft, kind: "shred-shaft", stage: 1, phase: 0, speed: 1.2 });
    for (let i = 0; i < 8; i += 1) {
      const cutter = addBox(group, [0.14, 0.09, 0.52], [x - 0.55 + i * 0.15, 0.68, 0.46], copper);
      cutter.rotation.y = i * 0.22;
      animated.push({ object: cutter, kind: "cutter", stage: 1, phase: i / 8, speed: 1.2 });
    }
    for (let i = 0; i < 10; i += 1) {
      const fiber = addBox(group, [0.22, 0.06, 0.06], [x - 0.55 + (i % 5) * 0.26, 0.2 + (i % 2) * 0.12, 0.55], cane);
      animated.push({ object: fiber, kind: "fiber", stage: 1, phase: i / 10, speed: 0.5 });
    }
  }

  // 03 Juice extraction: two rollers + juice collecting below them.
  {
    const x = xs[2];
    for (const z of [-0.38, 0.38]) {
      const roller = addCylinder(group, 0.43, 1.48, [x, 0.62, z], steel, 32);
      roller.rotation.z = Math.PI / 2;
      animated.push({ object: roller, kind: "press-roller", stage: 2, phase: z, speed: 0.9 });
    }
    addBox(group, [1.75, 0.16, 1.25], [x, -0.72, 0], dark);
    addBox(group, [1.35, 0.08, 0.85], [x, -0.62, 0], juice);
    for (let i = 0; i < 8; i += 1) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), juice);
      drop.position.set(x - 0.55 + (i % 4) * 0.36, -0.45 - Math.floor(i / 4) * 0.16, 0);
      group.add(drop);
      animated.push({ object: drop, kind: "juice-drop", stage: 2, phase: i / 8, speed: 0.65 });
    }
  }

  // 04 Clarification: settling tank, circulating liquid and descending solids.
  {
    const x = xs[3];
    addCylinder(group, 0.7, 2.55, [x, 0.15, 0], steel, 36);
    addCylinder(group, 0.58, 1.15, [x, -0.5, 0], juice, 28);
    const mixer = addCylinder(group, 0.055, 1.6, [x, 0.3, 0], dark, 12);
    animated.push({ object: mixer, kind: "clarifier-mixer", stage: 3, phase: 0, speed: 0.45 });
    for (let i = 0; i < 12; i += 1) {
      const solid = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), copper);
      solid.position.set(x - 0.42 + (i % 4) * 0.28, 0.8 - Math.floor(i / 4) * 0.32, -0.25 + (i % 3) * 0.22);
      group.add(solid);
      animated.push({ object: solid, kind: "settling-solid", stage: 3, phase: i / 12, speed: 0.08 });
    }
  }

  // 05 Evaporation: three vessels, heating bands, rising vapour and boiling bubbles.
  {
    const x = xs[4];
    for (let i = -1; i <= 1; i += 1) {
      const vx = x + i * 0.48;
      addCylinder(group, 0.43, 1.95, [vx, 0.22, 0], steel, 28);
      for (let j = 0; j < 4; j += 1) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 24), copper);
        ring.position.set(vx, -0.38 + j * 0.28, 0);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        animated.push({ object: ring, kind: "heat-ring", stage: 4, phase: j / 4, speed: 0.5 });
      }
      for (let j = 0; j < 4; j += 1) {
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), hot);
        bubble.position.set(vx, -0.25 + j * 0.22, 0.05);
        group.add(bubble);
        animated.push({ object: bubble, kind: "boil", stage: 4, phase: (j + i + 3) / 8, speed: 0.32 });
      }
    }
    for (let i = 0; i < 20; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), vapor);
      puff.position.set(x - 0.75 + (i % 5) * 0.38, 1.05 + (i % 4) * 0.27, -0.05 + (i % 3) * 0.08);
      group.add(puff);
      animated.push({ object: puff, kind: "vapor", stage: 4, phase: i / 20, speed: 0.22 });
    }
  }

  // 06 Crystallization: agitated vessel with visible crystal growth.
  {
    const x = xs[5];
    addCylinder(group, 0.74, 2.1, [x, 0.15, 0], steel, 32);
    addCylinder(group, 0.62, 1.2, [x, -0.32, 0], juice, 28);
    const shaft = addCylinder(group, 0.07, 2.7, [x, 0.5, 0], dark, 12);
    animated.push({ object: shaft, kind: "crystal-shaft", stage: 5, phase: 0, speed: 0.55 });
    for (const y of [-0.38, 0.08, 0.54]) {
      const blade = addBox(group, [1.18, 0.08, 0.1], [x, y, 0], steel);
      animated.push({ object: blade, kind: "crystal-blade", stage: 5, phase: y, speed: 0.55 });
    }
    for (let i = 0; i < 24; i += 1) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), sugar);
      crystal.position.set(
        x - 0.5 + (i % 6) * 0.2,
        -0.62 + Math.floor(i / 6) * 0.18,
        0.22 * Math.sin(i),
      );
      group.add(crystal);
      animated.push({ object: crystal, kind: "crystal", stage: 5, phase: i / 24, speed: 0.18 });
    }
  }

  // 07 Centrifugation: rotating basket and separated sugar solids around the basket.
  {
    const x = xs[6];
    const basket = addCylinder(group, 0.78, 1.35, [x, 0.2, 0], steel, 38);
    basket.rotation.z = Math.PI / 2;
    animated.push({ object: basket, kind: "centrifuge", stage: 6, phase: 0, speed: 2.2 });
    for (let r = 0.3; r < 0.75; r += 0.17) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 32), copper);
      ring.position.set(x, 0.2, 0);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      animated.push({ object: ring, kind: "centrifuge-ring", stage: 6, phase: r, speed: 2.2 });
    }
    for (let i = 0; i < 16; i += 1) {
      const grain = new THREE.Mesh(new THREE.OctahedronGeometry(0.042), sugar);
      group.add(grain);
      animated.push({ object: grain, kind: "centrifuge-grain", stage: 6, phase: i / 16, speed: 2.2 });
    }
  }

  // 08 Drying: chamber + visible upward hot-air movement and finished crystals.
  {
    const x = xs[7];
    addBox(group, [1.55, 2.15, 1.5], [x, 0.12, 0], dark);
    addBox(group, [1.25, 1.55, 1.2], [x, 0.12, 0], steel);
    for (let i = 0; i < 18; i += 1) {
      const grain = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), sugar);
      group.add(grain);
      animated.push({ object: grain, kind: "dry-grain", stage: 7, phase: i / 18, speed: 0.24 });
    }
    for (let i = 0; i < 12; i += 1) {
      const air = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), vapor);
      group.add(air);
      animated.push({ object: air, kind: "hot-air", stage: 7, phase: i / 12, speed: 0.4 });
    }
  }

  return group;
}

function cameraPose(index: number) {
  const x = xs[index];
  return {
    position: new THREE.Vector3(x * 0.42, 3.55, 17.2),
    target: new THREE.Vector3(x * 0.38, 0.1 + (index === 3 ? 0.18 : 0), 0),
  };
}

export default function ProcessLineOverview() {
  const mount = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!mount.current) return;
    const element = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071114);
    scene.fog = new THREE.Fog(0x071114, 12, 32);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xc5dfdd, 0x101d22, 1.7));
    const keyLight = new THREE.DirectionalLight(0xe2f2ed, 3.5);
    keyLight.position.set(4, 8, 7);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 9),
      mat(0x0b191e, 0.15, 0.9),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.42;
    floor.receiveShadow = true;
    scene.add(floor);

    const animated: Animated[] = [];
    const factory = buildFactory(animated);
    scene.add(factory);

    const hits = stages.map((_, index) => {
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 3.7, 2.4),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hit.position.set(xs[index], 0.45, 0);
      hit.userData.stageIndex = index;
      factory.add(hit);
      return hit;
    });

    const markers = stages.map((_, index) => {
      const marker = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.045, 8, 32),
        new THREE.MeshStandardMaterial({
          color: 0x70cdbd,
          emissive: 0x194b43,
          emissiveIntensity: 1.1,
          transparent: true,
          opacity: 0.95,
        }),
      );
      marker.position.set(xs[index], -1.08, 0);
      marker.rotation.x = Math.PI / 2;
      marker.visible = index === 0;
      factory.add(marker);
      return marker;
    });

    const selectionBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 2.6, 8),
      new THREE.MeshBasicMaterial({ color: 0x70cdbd, transparent: true, opacity: 0.45 }),
    );
    selectionBeam.position.set(xs[0], 0.2, 0);
    factory.add(selectionBeam);

    let goal = cameraPose(0);
    let currentTarget = goal.target.clone();
    camera.position.copy(goal.position);
    camera.lookAt(goal.target);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getPointer = (event: MouseEvent | PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
      raycaster.setFromCamera(pointer, camera);
    };

    const selectScene = (index: number) => {
      setSelected(index);
      markers.forEach((marker, markerIndex) => {
        marker.visible = markerIndex === index;
      });
      selectionBeam.position.x = xs[index];
      window.dispatchEvent(new CustomEvent("food-process-stage-select", { detail: index }));
    };

    const onPointerMove = (event: PointerEvent) => {
      getPointer(event);
      renderer.domElement.style.cursor = raycaster.intersectObjects(hits, false).length ? "pointer" : "default";
    };

    const onClick = (event: MouseEvent) => {
      getPointer(event);
      const hit = raycaster.intersectObjects(hits, false)[0];
      if (hit) selectScene(Number(hit.object.userData.stageIndex));
    };

    const onStage = (event: Event) => {
      const index = Math.max(0, Math.min(7, Number((event as CustomEvent<number>).detail)));
      selectScene(index);
      goal = cameraPose(index);
    };

    const onOpenInspection = (event: Event) => {
      const index = Math.max(0, Math.min(7, Number((event as CustomEvent<number>).detail)));
      selectScene(index);
      window.setTimeout(() => {
        const cards = document.querySelectorAll<HTMLButtonElement>(".stage-card");
        cards[index]?.click();
        cards[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
          document.querySelector<HTMLButtonElement>(".explorer-stage .enter-equipment")?.click();
        }, 80);
      }, 0);
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);
    window.addEventListener("food-process-stage-select", onStage);
    window.addEventListener("food-process-open-inspection", onOpenInspection);

    const clock = new THREE.Clock();
    let animationId = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      factory.rotation.y = Math.sin(elapsed * 0.12) * 0.025;
      camera.position.lerp(goal.position, 1 - Math.pow(0.001, delta * 1.5));
      currentTarget.lerp(goal.target, 1 - Math.pow(0.001, delta * 1.7));
      camera.lookAt(currentTarget);

      markers.forEach((marker, index) => {
        if (marker.visible) {
          const pulse = 1 + Math.sin(elapsed * 3.2) * 0.12;
          marker.scale.setScalar(pulse);
          (marker.material as THREE.MeshStandardMaterial).opacity = 0.65 + Math.sin(elapsed * 3.2) * 0.2;
        } else {
          marker.scale.setScalar(1);
        }
      });

      selectionBeam.scale.y = 0.88 + Math.sin(elapsed * 2.4) * 0.12;
      (selectionBeam.material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(elapsed * 2.4) * 0.12;

      animated.forEach(({ object, kind, stage, phase, speed }) => {
        const cycle = (elapsed * speed + phase) % 1;
        const x = xs[stage];

        if (kind === "main-flow") {
          object.position.x = xs[stage] + 0.72 + cycle * (xs[stage + 1] - xs[stage] - 1.44);
          object.position.y = -0.02 + Math.sin(cycle * Math.PI * 4 + phase * 10) * 0.025;
        } else if (kind === "cane") {
          object.position.x = x - 1.1 + cycle * 1.05;
          object.rotation.z = Math.sin(elapsed * 2 + phase * 6) * 0.12;
          object.position.y = 1.3 + Math.sin(cycle * Math.PI) * 0.1;
        } else if (kind === "roller" || kind === "shred-drum" || kind === "shred-shaft" || kind === "cutter" || kind === "press-roller" || kind === "crystal-shaft" || kind === "crystal-blade" || kind === "centrifuge" || kind === "centrifuge-ring") {
          object.rotation.x += delta * speed * (kind === "centrifuge" || kind === "centrifuge-ring" ? 2.2 : 1.2);
          object.rotation.y += delta * speed * 0.35;
        } else if (kind === "fiber") {
          object.position.x = x - 0.62 + cycle * 1.2;
          object.position.z = 0.48 - cycle * 0.7;
        } else if (kind === "juice-drop") {
          object.position.y = -0.35 - cycle * 0.6;
          object.position.x = x - 0.55 + ((phase * 8) % 4) * 0.36;
        } else if (kind === "settling-solid") {
          object.position.y = 0.8 - cycle * 1.25;
          object.scale.setScalar(0.7 + cycle * 0.5);
        } else if (kind === "heat-ring") {
          object.rotation.z = Math.sin(elapsed * speed * 2 + phase * 5) * 0.05;
        } else if (kind === "boil") {
          object.position.y = -0.28 + cycle * 1.15;
          object.position.x = x + Math.sin(cycle * 7 + phase * 5) * 0.13;
          object.scale.setScalar(0.65 + Math.sin(cycle * Math.PI) * 0.75);
        } else if (kind === "vapor") {
          object.position.y = 1.0 + cycle * 1.8;
          object.position.x = x - 0.8 + ((phase * 7) % 6) * 0.27 + Math.sin(elapsed * 1.5 + phase * 8) * 0.08;
          object.scale.setScalar(0.55 + Math.sin(cycle * Math.PI) * 0.7);
        } else if (kind === "crystal") {
          object.scale.setScalar(0.45 + cycle * 1.2);
          object.rotation.x += delta * 0.3;
          object.rotation.y += delta * 0.45;
        } else if (kind === "centrifuge-grain") {
          const angle = elapsed * 2.2 + phase * Math.PI * 2;
          const radius = 0.35 + cycle * 0.6;
          object.position.set(x + Math.cos(angle) * radius, 0.2 + Math.sin(angle * 2) * 0.12, Math.sin(angle) * radius);
          object.rotation.x += delta * 2;
          object.rotation.y += delta * 2;
        } else if (kind === "dry-grain") {
          object.position.set(x - 0.45 + (phase * 6) % 0.9, -0.55 + cycle * 1.45, -0.38 + ((phase * 5) % 0.75));
          object.rotation.x += delta * 0.8;
          object.rotation.y += delta * 1.1;
        } else if (kind === "hot-air") {
          object.position.set(x - 0.42 + (phase * 5) % 0.84, -0.9 + cycle * 2.1, -0.35 + ((phase * 3) % 0.7));
          object.scale.setScalar(0.5 + Math.sin(cycle * Math.PI) * 0.6);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const resize = () => {
      camera.aspect = element.clientWidth / Math.max(1, element.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(element.clientWidth, element.clientHeight, false);
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("food-process-stage-select", onStage);
      window.removeEventListener("food-process-open-inspection", onOpenInspection);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (element.contains(renderer.domElement)) element.removeChild(renderer.domElement);
    };
  }, []);

  const stage = stages[selected];
  const select = (index: number) => {
    setSelected(index);
    window.dispatchEvent(new CustomEvent("food-process-stage-select", { detail: index }));
  };
  const openInspection = () =>
    window.dispatchEvent(new CustomEvent("food-process-open-inspection", { detail: selected }));

  return (
    <section className="process-line-overview">
      <div className="process-line-heading">
        <div>
          <span>PRODUCTION LINE · PROCESS ANIMATION</span>
          <h2>Watch the material transform through the factory</h2>
        </div>
        <p>
          Every machine now has a visible mechanical action and material movement. Select a unit to understand what changes here, then open its internal process.
        </p>
      </div>

      <div ref={mount} className="process-line-canvas" aria-label="Interactive animated 3D sugar production line" />

      <div className="process-line-stages">
        {stages.map((stageItem, index) => (
          <button
            key={stageItem.stepId}
            type="button"
            className={selected === index ? "process-line-stage active" : "process-line-stage"}
            onClick={() => select(index)}
          >
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <span>{stageItem.name}</span>
            <small>{stageItem.equipmentId}</small>
          </button>
        ))}
      </div>

      <div className="process-line-selected">
        <div>
          <span>SELECTED EQUIPMENT · STAGE {selected + 1}</span>
          <strong>{stage.equipmentId}</strong>
          <h3>{stage.name}</h3>
          <p>{stage.description}</p>
        </div>
        <div className="selected-flow">
          <span>INPUT · {stage.inputStreams.map((stream) => stream.materialId).join(" + ")}</span>
          <span>OUTPUT · {stage.outputStreams.map((stream) => stream.materialId).join(" + ")}</span>
          <button type="button" onClick={openInspection}>View Details · نمایش جزئیات</button>
        </div>
      </div>
    </section>
  );
}
