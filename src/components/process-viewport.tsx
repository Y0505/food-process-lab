"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const visualizationModel = buildSugarcaneVisualizationModel();

function formatMass(value: number) {
  return `${value.toFixed(1)} kg/h`;
}

function material(color: number, metalness = 0.65, roughness = 0.3) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function addBox(group: THREE.Group, size: [number, number, number], position: [number, number, number], mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addCylinder(group: THREE.Group, radius: number, height: number, position: [number, number, number], mat: THREE.Material, radial = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radial), mat);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addPipe(group: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, radius = 0.09, color = 0x8ea9ad) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 12), material(color, 0.82, 0.24));
  pipe.position.copy(start).add(end).multiplyScalar(0.5);
  pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  pipe.castShadow = true;
  group.add(pipe);
  return pipe;
}

function addPipeRun(group: THREE.Group, points: Array<[number, number, number]>, radius = 0.07) {
  for (let i = 0; i < points.length - 1; i += 1) {
    addPipe(group, new THREE.Vector3(...points[i]), new THREE.Vector3(...points[i + 1]), radius);
  }
}

function addSupportLegs(group: THREE.Group, width = 1.25, depth = 0.85, height = 0.85) {
  const steel = material(0x6d8589, 0.88, 0.25);
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) addBox(group, [0.09, height, 0.09], [x, -0.5, z], steel);
  }
  addBox(group, [width + 0.16, 0.08, depth + 0.16], [0, -0.93, 0], steel);
}

function addFlange(group: THREE.Group, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) {
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 16), material(0x849b9f, 0.9, 0.22));
  flange.position.set(...position);
  flange.rotation.set(...rotation);
  group.add(flange);
  return flange;
}

function addValve(group: THREE.Group, position: [number, number, number], scale = 1) {
  const valve = new THREE.Group();
  valve.position.set(...position);
  const dark = material(0x21383e, 0.82, 0.25);
  const steel = material(0x9ab2b5, 0.9, 0.2);
  addCylinder(valve, 0.14 * scale, 0.24 * scale, [0, 0, 0], dark, 12).rotation.z = Math.PI / 2;
  const stem = addCylinder(valve, 0.035 * scale, 0.38 * scale, [0, 0.16 * scale, 0], steel, 10);
  stem.rotation.z = Math.PI / 2;
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.17 * scale, 0.035 * scale, 8, 18), steel);
  wheel.position.set(0, 0.31 * scale, 0);
  wheel.rotation.x = Math.PI / 2;
  valve.add(wheel);
  group.add(valve);
  return valve;
}

function addGauge(group: THREE.Group, position: [number, number, number], rotationY = 0, scale = 1) {
  const gauge = new THREE.Group();
  gauge.position.set(...position);
  gauge.rotation.y = rotationY;
  gauge.scale.setScalar(scale);
  const dark = material(0x17272c, 0.75, 0.24);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), new THREE.MeshStandardMaterial({ color: 0xe6f3f1, roughness: 0.4 }));
  face.position.z = 0.035;
  gauge.add(new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.1, 24), dark));
  gauge.add(face);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, 0.025), material(0x24464d, 0.2, 0.45));
  needle.position.set(0, 0.025, 0.06);
  needle.rotation.z = -0.75;
  gauge.add(needle);
  group.add(gauge);
  return gauge;
}

function addLabelSprite(scene: THREE.Scene, text: string, position: THREE.Vector3) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(5, 13, 17, 0.88)";
  context.roundRect(8, 8, 496, 112, 22);
  context.fill();
  context.strokeStyle = "rgba(185, 221, 226, 0.36)";
  context.lineWidth = 3;
  context.stroke();
  context.font = "600 30px Arial";
  context.fillStyle = "#e8f5f7";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.position.copy(position);
  sprite.scale.set(2.35, 0.58, 1);
  sprite.userData.labelTexture = texture;
  scene.add(sprite);
}

function makeEquipment(stageIndex: number, active: boolean) {
  const group = new THREE.Group();
  const shell = material(active ? 0x70959b : 0x526c72, 0.78, 0.27);
  const dark = material(0x17292f, 0.84, 0.22);
  const steel = material(0x9ab2b5, 0.9, 0.2);
  const copper = material(0x8f6d49, 0.78, 0.3);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x8fd4d9, transparent: true, opacity: 0.2, roughness: 0.08, transmission: 0.42 });
  const liquid = new THREE.MeshStandardMaterial({ color: 0x66b88d, transparent: true, opacity: 0.62, roughness: 0.18, emissive: 0x153d2d, emissiveIntensity: 0.45 });

  if (stageIndex === 0) {
    addBox(group, [1.85, 0.72, 1.3], [0, -0.05, 0], shell);
    addBox(group, [1.48, 0.16, 1.04], [0, 0.38, 0], dark);
    for (let i = -2; i <= 2; i += 1) {
      const roller = addCylinder(group, 0.065, 1.25, [i * 0.25, 0.54, 0], steel, 12);
      roller.rotation.z = Math.PI / 2;
    }
    addBox(group, [1.55, 0.12, 0.14], [0, 0.82, 0], dark);
    addSupportLegs(group, 1.55, 1.05, 0.78);
    addPipeRun(group, [[-0.92, 0.1, -0.56], [-1.22, 0.1, -0.56], [-1.22, 0.62, -0.56]], 0.07);
    addValve(group, [0.86, 0.1, 0.58], 0.8);
    addGauge(group, [0.72, 0.55, 0.68], 0.2);
  } else if (stageIndex === 1) {
    addCylinder(group, 0.72, 1.55, [0, 0.04, 0], shell);
    const drum = addCylinder(group, 0.52, 1.42, [0, 0.04, 0], dark);
    drum.rotation.z = Math.PI / 2;
    const shaft = addCylinder(group, 0.13, 1.9, [0, 0.04, 0], steel);
    shaft.rotation.z = Math.PI / 2;
    for (const y of [-0.55, 0.55]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.71, 0.065, 10, 28), steel);
      ring.position.y = y;
      group.add(ring);
    }
    for (const z of [-0.42, 0.42]) addPipeRun(group, [[-0.82, 0.65, z], [-1.1, 0.65, z], [-1.1, 0.2, z]], 0.06);
    addValve(group, [0.86, -0.05, 0.48], 0.7);
    addGauge(group, [0.62, 0.5, 0.55], 0.2);
    addSupportLegs(group, 1.28, 1.05, 0.76);
  } else if (stageIndex === 2) {
    addCylinder(group, 0.68, 1.55, [0, 0, 0], shell);
    addCylinder(group, 0.48, 1.15, [0, -0.02, 0], liquid);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.45, 24), shell);
    cone.position.y = 1.0;
    group.add(cone);
    addCylinder(group, 0.17, 0.8, [0, 1.58, 0], dark);
    addCylinder(group, 0.23, 0.25, [0, -0.92, 0], dark);
    addPipeRun(group, [[-0.72, 0.48, 0], [-1.0, 0.48, 0], [-1.0, 1.12, 0], [-0.42, 1.12, 0]], 0.07);
    addPipeRun(group, [[0.45, -0.92, 0], [0.45, -1.16, 0], [0.86, -1.16, 0]], 0.07);
    addValve(group, [0.83, -0.92, 0], 0.7);
    addGauge(group, [0.58, 0.42, 0.5], 0.2);
    addSupportLegs(group, 1.18, 1.0, 0.78);
  } else if (stageIndex === 3) {
    addCylinder(group, 0.78, 1.72, [0, 0, 0], glass, 24);
    addCylinder(group, 0.84, 0.12, [0, 0.88, 0], shell);
    addCylinder(group, 0.84, 0.12, [0, -0.88, 0], shell);
    for (let i = 0; i < 3; i += 1) {
      addCylinder(group, 0.7, 0.07, [0, -0.45 + i * 0.45, 0], dark);
    }
    addCylinder(group, 0.12, 1.9, [0, 0, 0], steel);
    for (const x of [-0.55, 0.55]) addPipeRun(group, [[x, 0.9, 0], [x, 1.18, 0], [x * 1.3, 1.18, 0]], 0.055);
    addPipeRun(group, [[-0.45, -0.9, 0], [-0.45, -1.18, 0], [0.35, -1.18, 0]], 0.065);
    addValve(group, [0.55, -0.9, 0], 0.7);
    addGauge(group, [0.68, 0.45, 0.48], 0.2);
    addSupportLegs(group, 1.35, 1.05, 0.82);
  } else if (stageIndex === 4) {
    for (let i = 0; i < 3; i += 1) {
      const x = (i - 1) * 0.58;
      addCylinder(group, 0.48, 1.62, [x, 0, i === 1 ? 0.1 : -0.08], shell);
      for (let j = 0; j < 4; j += 1) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.04, 8, 24), steel);
        ring.position.set(x, -0.52 + j * 0.34, i === 1 ? 0.1 : -0.08);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }
      addPipeRun(group, [[x, 0.75, -0.08], [x, 1.08, -0.08], [x + 0.18, 1.08, -0.08]], 0.055);
    }
    addPipe(group, new THREE.Vector3(-1.05, 0.95, 0), new THREE.Vector3(1.05, 0.95, 0), 0.085, 0x9a7750);
    addPipeRun(group, [[-1.2, -0.6, 0.1], [-1.2, -1.05, 0.1], [1.2, -1.05, 0.1], [1.2, -0.58, 0.1]], 0.07);
    addValve(group, [0, 0.95, 0], 0.75);
    addGauge(group, [0.72, 0.45, 0.55], 0.2);
    addSupportLegs(group, 2.0, 1.0, 0.75);
  } else if (stageIndex === 5) {
    addCylinder(group, 0.82, 1.48, [0, 0, 0], glass);
    addCylinder(group, 0.72, 0.9, [0, -0.18, 0], liquid);
    addCylinder(group, 0.88, 0.13, [0, 0.78, 0], shell);
    addCylinder(group, 0.88, 0.13, [0, -0.78, 0], shell);
    const shaft = addCylinder(group, 0.07, 1.95, [0, 0, 0], steel, 12);
    shaft.rotation.z = Math.PI / 2;
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 8, 48), copper);
    coil.position.y = -0.18;
    coil.rotation.x = Math.PI / 2;
    group.add(coil);
    addPipeRun(group, [[-0.82, 0.48, 0], [-1.12, 0.48, 0], [-1.12, 1.0, 0]], 0.07);
    addPipeRun(group, [[0.82, 0.3, 0], [1.12, 0.3, 0], [1.12, 0.85, 0]], 0.07);
    addValve(group, [-0.82, 0.48, 0], 0.65);
    addGauge(group, [0.72, 0.44, 0.48], 0.2);
    addSupportLegs(group, 1.4, 1.08, 0.8);
  } else if (stageIndex === 6) {
    addCylinder(group, 0.74, 1.32, [0, 0, 0], shell);
    addCylinder(group, 0.5, 0.42, [0, 0.1, 0], dark);
    addCylinder(group, 0.07, 1.25, [0, 0.16, 0], steel, 12).rotation.z = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.065, 10, 28), shell);
    ring.position.y = 0.52;
    group.add(ring);
    for (const x of [-0.52, 0.52]) addPipeRun(group, [[x, 0.55, 0], [x * 1.25, 0.55, 0], [x * 1.25, 1.0, 0]], 0.06);
    addPipeRun(group, [[-0.48, -0.68, 0], [-0.48, -1.08, 0], [0.55, -1.08, 0]], 0.07);
    addValve(group, [0.68, -0.68, 0], 0.65);
    addGauge(group, [0.62, 0.4, 0.58], 0.2);
    addSupportLegs(group, 1.3, 1.0, 0.8);
  } else {
    addBox(group, [1.55, 1.45, 1.16], [0, 0, 0], shell);
    addBox(group, [1.16, 0.82, 0.86], [0, 0.05, 0], glass);
    addBox(group, [1.0, 0.12, 0.76], [0, -0.28, 0], liquid);
    addCylinder(group, 0.12, 1.5, [0, 0, 0], steel, 12).rotation.z = Math.PI / 2;
    addCylinder(group, 0.18, 0.16, [0, 0.78, 0], shell);
    addPipeRun(group, [[-0.78, 0.35, 0], [-1.1, 0.35, 0], [-1.1, 0.82, 0]], 0.07);
    addPipeRun(group, [[0.78, -0.28, 0], [1.1, -0.28, 0], [1.1, 0.28, 0]], 0.07);
    addValve(group, [-0.78, 0.35, 0], 0.65);
    addGauge(group, [0.62, 0.48, 0.6], 0.2);
    addSupportLegs(group, 1.45, 1.05, 0.78);
  }

  addBox(group, [1.58, 0.14, 1.08], [0, -0.92, 0], dark);
  return group;
}

export default function ProcessViewport() {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeStageIndexRef = useRef(0);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const activeStage = visualizationModel.stages[activeStageIndex];

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050d11);
    scene.fog = new THREE.Fog(0x050d11, 18, 40);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 6.8, 16.5);
    camera.lookAt(0, 0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xaed7dd, 0x081014, 1.7));
    const key = new THREE.DirectionalLight(0xe8fbff, 3.1);
    key.position.set(-6, 11, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -16;
    key.shadow.camera.right = 16;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -8;
    scene.add(key);
    const rim = new THREE.PointLight(0x4fb8c4, 16, 20, 2);
    rim.position.set(0, 4, 5);
    scene.add(rim);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 19), material(0x0e1a1f, 0.18, 0.78));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(32, 32, 0x2a4a50, 0x183036);
    grid.position.y = -0.985;
    scene.add(grid);

    const group = new THREE.Group();
    const spacing = 2.8;
    const equipment: THREE.Group[] = [];
    const flowMarkers: THREE.Mesh[] = [];
    const flowMaterials: THREE.MeshStandardMaterial[] = [];

    const gantry = new THREE.Group();
    const gantryMat = material(0x263b41, 0.72, 0.35);
    for (const x of [-12, 12]) {
      addBox(gantry, [0.18, 5.2, 0.18], [x, 1.6, -1.8], gantryMat);
      addBox(gantry, [0.18, 5.2, 0.18], [x, 1.6, 2.8], gantryMat);
    }
    addBox(gantry, [24, 0.18, 0.18], [0, 4.15, -1.8], gantryMat);
    addBox(gantry, [24, 0.18, 0.18], [0, 4.15, 2.8], gantryMat);
    addPipeRun(gantry, [[-12, 3.55, -1.8], [-7, 3.55, -1.8], [-7, 2.8, -1.8]], 0.07);
    addPipeRun(gantry, [[7, 3.55, -1.8], [12, 3.55, -1.8]], 0.07);
    scene.add(gantry);

    visualizationModel.stages.forEach((stage, index) => {
      const body = makeEquipment(index, index === 0);
      const x = (index - 3.5) * spacing;
      body.position.set(x, 0, 0);
      body.userData.stepId = stage.stepId;
      body.userData.stageIndex = index;
      body.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      equipment.push(body);
      group.add(body);
      addLabelSprite(scene, stage.name, new THREE.Vector3(x, 1.78, 0));

      if (index < visualizationModel.stages.length - 1) {
        const y = 0.18;
        const startX = x + 0.78;
        const endX = x + spacing - 0.78;
        addPipe(group, new THREE.Vector3(startX, y, 0), new THREE.Vector3(endX, y, 0), 0.105);
        addFlange(group, [startX + 0.08, y, 0], [0, 0, Math.PI / 2]);
        addFlange(group, [endX - 0.08, y, 0], [0, 0, Math.PI / 2]);
        addValve(group, [x + spacing / 2, y, 0], 0.58);

        const markerMat = new THREE.MeshStandardMaterial({ color: 0xd9fff3, emissive: 0x2a8d75, emissiveIntensity: 2.8 });
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), markerMat);
        marker.position.set(startX, y, 0);
        marker.userData.flowIndex = index;
        flowMarkers.push(marker);
        flowMaterials.push(markerMat);
        group.add(marker);
      }
    });

    addPipeRun(group, [[-13, 0.18, 0], [-11.2, 0.18, 0], [-10.8, 0.55, 0]], 0.12);
    addPipeRun(group, [[10.8, 0.55, 0], [11.2, 0.18, 0], [13, 0.18, 0]], 0.12);

    const steam = new THREE.Group();
    const steamMat = new THREE.MeshStandardMaterial({ color: 0xd9f5f4, emissive: 0x8bc6c4, emissiveIntensity: 1.5, transparent: true, opacity: 0.52 });
    for (let i = 0; i < 22; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (i % 4) * 0.025, 8, 8), steamMat);
      puff.userData.offset = i * 0.7;
      puff.position.set(2.8 + (i % 5) * 0.14, 1.05 + (i % 6) * 0.16, (i % 3) * 0.12 - 0.12);
      steam.add(puff);
    }
    group.add(steam);

    const materialParticles: THREE.Mesh[] = [];
    const materialColors = [0x9ad1c0, 0xf4d77a, 0xb4b9bd];
    for (let i = 0; i < 30; i += 1) {
      const particleMat = new THREE.MeshStandardMaterial({ color: materialColors[i % materialColors.length], emissive: materialColors[i % materialColors.length], emissiveIntensity: 0.45 });
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.035 + (i % 3) * 0.012, 8, 8), particleMat);
      particle.userData.phase = i / 30;
      materialParticles.push(particle);
      group.add(particle);
    }

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 27;
      positions[i * 3 + 1] = Math.random() * 7 - 0.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7 - 1.5;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x9bc9cd, size: 0.032, transparent: true, opacity: 0.24 }));
    scene.add(particles);
    scene.add(group);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(equipment, true);
      const hit = hits[0]?.object;
      if (!hit) return;
      let root: THREE.Object3D | null = hit;
      while (root && root.parent && root.parent !== group) root = root.parent;
      const index = Number(root?.userData.stageIndex);
      if (Number.isInteger(index) && index >= 0 && index < visualizationModel.stages.length) {
        activeStageIndexRef.current = index;
        setActiveStageIndex(index);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const resize = () => {
      const width = mount.clientWidth;
      const height = Math.max(500, Math.min(700, width * 0.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const timer = new THREE.Timer();
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      timer.update();
      const elapsed = timer.getElapsed();
      const currentStageIndex = activeStageIndexRef.current;
      group.rotation.y = Math.sin(elapsed * 0.11) * 0.025;
      particles.rotation.y = elapsed * 0.006;

      equipment.forEach((body, index) => {
        const isActive = index === currentStageIndex;
        body.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const mat = child.material;
          if (!(mat instanceof THREE.MeshStandardMaterial)) return;
          mat.emissive.setHex(isActive ? 0x1b6470 : 0x000000);
          mat.emissiveIntensity = isActive ? 1.05 + Math.sin(elapsed * 4) * 0.22 : 0;
        });
        body.scale.y = isActive ? 1.025 + Math.sin(elapsed * 2.8) * 0.012 : 1;
      });

      flowMarkers.forEach((marker, index) => {
        const stage = visualizationModel.stages[index];
        const output = stage.outputStreams[0];
        const massFactor = output ? Math.min(output.massFlowKgPerHour / 1000, 1.5) : 0.5;
        const startX = (index - 3.5) * spacing + 0.78;
        const pipeLength = spacing - 1.56;
        const phase = (elapsed * (0.3 + massFactor * 0.22) + index * 0.17) % 1;
        marker.position.x = startX + phase * pipeLength;
        marker.position.y = 0.18 + Math.sin(elapsed * 4 + index) * 0.035;
        marker.position.z = Math.sin(elapsed * 3 + index) * 0.05;
        marker.scale.setScalar(1 + Math.sin(elapsed * 6 + index) * 0.1);
        flowMaterials[index].emissiveIntensity = 2.4 + Math.sin(elapsed * 5 + index) * 0.5;
      });

      materialParticles.forEach((particle, index) => {
        const phase = (elapsed * (0.16 + (index % 5) * 0.018) + Number(particle.userData.phase)) % 1;
        const lane = index % (visualizationModel.stages.length - 1);
        const laneX = (lane - 3.5) * spacing + 0.9;
        particle.position.x = laneX + phase * (spacing - 1.8);
        particle.position.y = 0.16 + Math.sin(elapsed * 3 + index) * 0.09 + (index % 3) * 0.06;
        particle.position.z = (index % 3 - 1) * 0.11;
      });

      steam.children.forEach((puff, index) => {
        const offset = Number(puff.userData.offset ?? index);
        const phase = (elapsed * 0.22 + offset * 0.11) % 1.8;
        puff.position.y = 1.0 + phase;
        puff.position.x = 2.75 + Math.sin(elapsed * 0.8 + offset) * 0.24 + (index % 5) * 0.11;
        puff.scale.setScalar(0.7 + (phase / 1.8) * 0.45);
        (puff.material as THREE.MeshStandardMaterial).opacity = 0.5 - (phase / 1.8) * 0.34;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.cancelAnimationFrame(frame);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
          else object.material.dispose();
        }
        if (object instanceof THREE.Sprite) {
          object.userData.labelTexture?.dispose();
          object.material.dispose();
        }
      });
      particleGeometry.dispose();
      particles.material.dispose();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStageIndex((current) => {
        const next = (current + 1) % visualizationModel.stages.length;
        activeStageIndexRef.current = next;
        return next;
      });
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const selectStage = (index: number) => {
    activeStageIndexRef.current = index;
    setActiveStageIndex(index);
  };

  return (
    <section style={{ padding: "0 28px 36px" }}>
      <div className="process-shell">
        <div ref={mountRef} className="process-canvas" />

        <div className="process-stage-strip" aria-label="Process stages">
          {visualizationModel.stages.map((stage, index) => (
            <button
              key={stage.stepId}
              type="button"
              className={index === activeStageIndex ? "process-stage-button active" : "process-stage-button"}
              onClick={() => selectStage(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {stage.name}
            </button>
          ))}
        </div>

        {activeStage && (
          <aside className="process-panel">
            <div className="process-kicker">PROCESS STATION · {activeStageIndex + 1}/{visualizationModel.stages.length}</div>
            <h2>{activeStage.name}</h2>
            <p>{activeStage.description}</p>
            <div className="process-data">
              <span>Equipment</span><strong>{activeStage.equipmentId}</strong>
              <span>Input</span><strong>{activeStage.inputStreams.map((stream) => `${stream.id} · ${formatMass(stream.massFlowKgPerHour)}`).join(", ") || "—"}</strong>
              <span>Output</span><strong>{activeStage.outputStreams.map((stream) => `${stream.id} · ${formatMass(stream.massFlowKgPerHour)}`).join(", ") || "—"}</strong>
            </div>
            <div className="process-parameters">
              {activeStage.parameters.slice(0, 3).map((parameter) => (
                <div key={parameter.id}><span>{parameter.name}</span><strong>{parameter.value} {parameter.unit}</strong></div>
              ))}
            </div>
            <div className="process-hint">Click equipment or a stage below to inspect it.</div>
          </aside>
        )}

        <div className="process-legend">
          <span><i className="legend-dot material-flow" /> Material flow</span>
          <span><i className="legend-dot active-stage" /> Active station</span>
          <span><i className="legend-dot steam-flow" /> Steam / vapor</span>
        </div>
        <div className="process-status"><span className="status-dot" /> Deterministic simulation · procedural plant</div>
      </div>
      <p style={{ margin: "12px 0 0", opacity: 0.6, fontSize: 13 }}>
        Original runtime geometry: equipment internals, supports, pipes, valves, gauges, process-state lighting and animated material paths are generated from the process model.
      </p>
    </section>
  );
}
