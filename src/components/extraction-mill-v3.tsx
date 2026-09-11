"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const steel = new THREE.MeshStandardMaterial({ color: 0x6f7c7d, metalness: 0.92, roughness: 0.23 });
const steelDark = new THREE.MeshStandardMaterial({ color: 0x202a2c, metalness: 0.86, roughness: 0.29 });
const painted = new THREE.MeshStandardMaterial({ color: 0x3f5556, metalness: 0.78, roughness: 0.3 });
const edge = new THREE.MeshStandardMaterial({ color: 0xa9b1ad, metalness: 0.96, roughness: 0.18 });
const brass = new THREE.MeshStandardMaterial({ color: 0xb9864d, metalness: 0.78, roughness: 0.25 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x101718, metalness: 0.08, roughness: 0.88 });
const cane = new THREE.MeshStandardMaterial({ color: 0x8da84a, metalness: 0.02, roughness: 0.76 });
const caneDark = new THREE.MeshStandardMaterial({ color: 0x5e702c, metalness: 0.02, roughness: 0.82 });
const fiber = new THREE.MeshStandardMaterial({ color: 0x9a724b, metalness: 0.02, roughness: 0.92 });
const fiberDark = new THREE.MeshStandardMaterial({ color: 0x60442e, metalness: 0.02, roughness: 0.96 });
const juice = new THREE.MeshPhysicalMaterial({ color: 0x83b83d, roughness: 0.16, metalness: 0, transmission: 0.08, clearcoat: 0.5, transparent: true, opacity: 0.9 });
const juiceGlow = new THREE.MeshBasicMaterial({ color: 0xb8ee68, transparent: true, opacity: 0.75 });
const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x5ee0bf, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x9fe3d6, roughness: 0.04, transmission: 0.7, thickness: 0.02, transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide });

function roundedBox(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material, radius = 0.035) {
  const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent: THREE.Object3D, radius: number, depth: number, position: [number, number, number], material: THREE.Material, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function pipe(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
  const delta = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 20), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function flange(parent: THREE.Object3D, position: [number, number, number], axis: "x" | "y" | "z", radius = 0.19) {
  const group = new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  const disk = cylinder(group, radius, 0.1, [0, 0, 0], steel, 40);
  if (axis === "x") disk.rotation.z = Math.PI / 2;
  if (axis === "z") disk.rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const bolt = cylinder(group, 0.028, 0.075, [Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72, 0], edge, 10);
    if (axis === "x") bolt.rotation.z = Math.PI / 2;
    if (axis === "z") bolt.rotation.x = Math.PI / 2;
  }
  return group;
}

function gearGeometry(radius: number, teeth: number, thickness: number) {
  const shape = new THREE.Shape();
  const inner = radius * 0.76;
  const count = teeth * 4;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = i % 4 === 1 || i % 4 === 2 ? radius : inner;
    const point = new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
    if (i === 0) shape.moveTo(point.x, point.y); else shape.lineTo(point.x, point.y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.018, bevelThickness: 0.02 });
}

function addGear(parent: THREE.Object3D, radius: number, teeth: number, position: [number, number, number]) {
  const mesh = new THREE.Mesh(gearGeometry(radius, teeth, 0.14), steelDark);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRoll(parent: THREE.Group, position: [number, number], material: THREE.Material, rollMeshes: THREE.Mesh[]) {
  const group = new THREE.Group();
  group.position.set(position[0], position[1], 0);
  parent.add(group);

  const shell = cylinder(group, 0.63, 2.75, [0, 0, 0], material, 64);
  shell.rotation.x = Math.PI / 2;
  rollMeshes.push(shell);

  for (let i = -7; i <= 7; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.622, i % 3 === 0 ? 0.027 : 0.014, 8, 64), i % 3 === 0 ? brass : steelDark);
    ring.position.z = i * 0.18;
    ring.castShadow = true;
    group.add(ring);
  }

  for (const z of [-1.45, 1.45]) {
    const hub = cylinder(group, 0.73, 0.13, [0, 0, z], steelDark, 48);
    hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bolt = cylinder(group, 0.026, 0.08, [Math.cos(angle) * 0.49, Math.sin(angle) * 0.49, z + (z > 0 ? 0.075 : -0.075)], edge, 10);
      bolt.rotation.x = Math.PI / 2;
    }
  }

  return group;
}

function addMotor(parent: THREE.Object3D) {
  const group = new THREE.Group();
  group.position.set(2.65, -0.45, 1.7);
  parent.add(group);

  roundedBox(group, [1.25, 1.15, 1.05], [0, 0, 0], steelDark, 0.08);
  for (let i = -3; i <= 3; i++) {
    const rib = roundedBox(group, [0.07, 0.9, 1.08], [i * 0.13, 0, 0], painted, 0.018);
    rib.castShadow = true;
  }
  cylinder(group, 0.42, 0.18, [0, 0, 0.57], edge, 36).rotation.x = Math.PI / 2;
  cylinder(group, 0.18, 0.25, [0, 0, 0.69], brass, 32).rotation.x = Math.PI / 2;
  const fan = new THREE.Group();
  fan.position.z = 0.79;
  group.add(fan);
  for (let i = 0; i < 6; i++) {
    const blade = roundedBox(fan, [0.07, 0.45, 0.025], [0, 0.22, 0], rubber, 0.012);
    blade.rotation.z = (i / 6) * Math.PI * 2;
  }
  cylinder(fan, 0.09, 0.08, [0, 0, 0], edge, 20).rotation.x = Math.PI / 2;
  return group;
}

export default function ExtractionMillV3() {
  const mount = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);
  const pausedRef = useRef(false);
  const slowRef = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { slowRef.current = slow; }, [slow]);

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02080b);
    scene.fog = new THREE.Fog(0x02080b, 11, 25);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(5.8, 3.15, 8.9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    host.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.48, 0.72);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 5.6;
    controls.maxDistance = 13.5;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0.25, 0.05, 0);

    scene.add(new THREE.HemisphereLight(0xeaf7f2, 0x061013, 2.25));
    const key = new THREE.DirectionalLight(0xffe0bd, 4.5);
    key.position.set(5, 8, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 22;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x49d4bb, 2.25);
    rim.position.set(-6, 5, -5);
    scene.add(rim);
    const fill = new THREE.PointLight(0x7de0c8, 1.3, 12);
    fill.position.set(-1.5, 2.5, 4);
    scene.add(fill);

    const root = new THREE.Group();
    root.rotation.y = -0.12;
    scene.add(root);

    roundedBox(root, [9.8, 0.22, 5.5], [0, -1.6, 0], rubber, 0.06);
    roundedBox(root, [7.3, 0.3, 3.1], [0.1, -1.38, 0], steelDark, 0.06);

    // Structural frame and maintenance platforms.
    for (const x of [-2.95, 2.65]) {
      for (const z of [-1.55, 1.55]) {
        roundedBox(root, [0.34, 3.05, 0.38], [x, -0.03, z], painted, 0.045);
        roundedBox(root, [0.84, 0.18, 0.84], [x, -1.16, z], steelDark, 0.04);
        roundedBox(root, [0.7, 0.18, 0.7], [x, 1.34, z], steelDark, 0.035);
      }
    }
    for (const z of [-1.55, 1.55]) {
      roundedBox(root, [5.8, 0.3, 0.34], [-0.15, 1.29, z], painted, 0.04);
      roundedBox(root, [5.8, 0.2, 0.3], [-0.15, -0.98, z], painted, 0.035);
    }
    roundedBox(root, [4.9, 0.13, 1.15], [-0.25, 1.12, 0], steelDark, 0.035);
    for (let i = 0; i < 7; i++) roundedBox(root, [0.07, 0.07, 1.0], [-2.45 + i * 0.73, 1.21, 0], edge, 0.015);

    // Feed chute with visible cane bundles.
    const feed = new THREE.Group();
    feed.position.set(-2.25, 1.65, 0);
    root.add(feed);
    const feedFloor = roundedBox(feed, [1.95, 0.15, 1.78], [0, -0.48, 0], steel, 0.035);
    feedFloor.rotation.z = -0.28;
    for (const z of [-0.84, 0.84]) {
      const wall = roundedBox(feed, [1.98, 0.13, 0.13], [0, 0.13, z], steel, 0.025);
      wall.rotation.z = -0.28;
    }
    roundedBox(feed, [0.2, 1.02, 1.9], [-0.94, 0, 0], steelDark, 0.035);

    const rollAssembly = new THREE.Group();
    root.add(rollAssembly);
    const rolls: THREE.Mesh[] = [];
    const rollGroups = [
      addRoll(rollAssembly, [-0.82, -0.02], steel, rolls),
      addRoll(rollAssembly, [0, 0.68], steel, rolls),
      addRoll(rollAssembly, [0.82, -0.02], steel, rolls),
    ];

    // Bearing blocks, shafts and grease fittings.
    for (const [x, y] of [[-0.82, -0.02], [0, 0.68], [0.82, -0.02]]) {
      for (const z of [-1.62, 1.62]) {
        roundedBox(root, [0.58, 0.72, 0.4], [x, y, z], painted, 0.05);
        cylinder(root, 0.31, 0.18, [x, y, z > 0 ? z + 0.12 : z - 0.12], edge, 32).rotation.x = Math.PI / 2;
        cylinder(root, 0.055, 0.16, [x, y + 0.4, z], brass, 12);
        const cap = cylinder(root, 0.07, 0.08, [x, y + 0.5, z], brass, 12);
        cap.rotation.z = Math.PI / 2;
      }
      const shaft = cylinder(root, 0.15, 3.78, [x, y, 0], edge, 28);
      shaft.rotation.x = Math.PI / 2;
    }

    // Front cutaway guard with a clear working window.
    roundedBox(root, [3.65, 0.13, 0.16], [0, 1.36, 1.48], edge, 0.03);
    roundedBox(root, [3.65, 0.13, 0.16], [0, -1.18, 1.48], edge, 0.03);
    roundedBox(root, [0.16, 2.55, 0.13], [-1.8, 0.09, 1.48], edge, 0.03);
    roundedBox(root, [0.16, 2.55, 0.13], [1.8, 0.09, 1.48], edge, 0.03);
    const cutaway = roundedBox(root, [3.42, 2.27, 0.04], [0, 0.09, 1.43], glass, 0.018);
    cutaway.castShadow = false;

    // Drive train and motor side.
    const drive = new THREE.Group();
    drive.position.set(2.7, 0.1, 1.63);
    root.add(drive);
    roundedBox(drive, [1.5, 1.25, 0.7], [0.05, -0.48, 0], steelDark, 0.06);
    const gears = [
      addGear(drive, 0.31, 14, [-0.36, 0.16, 0]),
      addGear(drive, 0.45, 20, [0.28, 0.16, 0]),
      addGear(drive, 0.33, 15, [0.92, 0.16, 0]),
    ];
    const gearGuard = roundedBox(drive, [1.48, 1.02, 0.08], [0.3, 0.16, 0.39], glass, 0.02);
    gearGuard.castShadow = false;
    addMotor(drive);
    pipe(drive, new THREE.Vector3(-0.35, -0.48, 0), new THREE.Vector3(-0.35, -0.05, 0), 0.1, edge);

    // Product collection: juice goes down, bagasse goes forward.
    roundedBox(root, [3.8, 0.14, 2.42], [0, -0.78, 0], steelDark, 0.04);
    roundedBox(root, [3.8, 0.2, 0.12], [0, -0.54, -1.15], steel, 0.025);
    roundedBox(root, [3.8, 0.2, 0.12], [0, -0.54, 1.15], steel, 0.025);
    const juicePool = roundedBox(root, [3.15, 0.06, 1.68], [-0.08, -0.68, 0], juice, 0.025);
    juicePool.castShadow = false;
    pipe(root, new THREE.Vector3(1.05, -0.81, 0), new THREE.Vector3(2.05, -0.81, 0), 0.12, steel);
    pipe(root, new THREE.Vector3(2.05, -0.81, 0), new THREE.Vector3(2.05, -1.22, 0), 0.12, steel);
    flange(root, [2.05, -0.81, 0], "x", 0.18);
    pipe(root, new THREE.Vector3(2.05, -1.22, 0), new THREE.Vector3(3.15, -1.22, 0), 0.12, steel);
    flange(root, [2.05, -1.22, 0], "y", 0.18);

    const bagasse = new THREE.Group();
    bagasse.position.set(1.78, -0.02, 0);
    root.add(bagasse);
    const bagFloor = roundedBox(bagasse, [1.72, 0.16, 1.22], [0.55, -0.46, 0], steel, 0.035);
    bagFloor.rotation.z = -0.3;
    for (const z of [-0.61, 0.61]) {
      const wall = roundedBox(bagasse, [1.74, 0.1, 0.1], [0.55, 0.03, z], steel, 0.02);
      wall.rotation.z = -0.3;
    }

    // Material-first animation: the model is readable without the text panel.
    type Particle = { mesh: THREE.Mesh; phase: number; lane: number; seed: number };
    const caneParticles: Particle[] = [];
    const fibers: Particle[] = [];
    const juiceDrops: THREE.Mesh[] = [];
    const juiceJets: THREE.Mesh[] = [];

    for (let i = 0; i < 38; i++) {
      const segment = cylinder(root, 0.105, 0.7 + (i % 3) * 0.11, [0, 0, 0], i % 5 === 0 ? caneDark : cane, 14);
      segment.rotation.z = Math.PI / 2;
      for (let n = -1; n <= 1; n++) {
        const node = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.012, 6, 14), caneDark);
        node.rotation.x = Math.PI / 2;
        node.position.x = n * 0.19;
        segment.add(node);
      }
      caneParticles.push({ mesh: segment, phase: i / 38, lane: (i % 11) / 10, seed: i * 1.91 });
    }

    for (let i = 0; i < 58; i++) {
      const strand = roundedBox(root, [0.56, 0.045, 0.07], [0, 0, 0], i % 5 === 0 ? fiberDark : fiber, 0.018);
      fibers.push({ mesh: strand, phase: i / 58, lane: (i % 15) / 14, seed: i * 2.13 });
    }
    for (let i = 0; i < 72; i++) juiceDrops.push(cylinder(root, 0.027, 0.1, [0, 0, 0], juiceGlow, 10));
    for (let i = 0; i < 22; i++) juiceJets.push(cylinder(root, 0.017, 0.25, [0, 0, 0], juiceGlow, 8));

    const nipGlow = new THREE.Mesh(new THREE.RingGeometry(0.56, 0.78, 48, 1, 0, Math.PI), cyanGlow);
    nipGlow.position.set(0, 0.1, 1.5);
    nipGlow.rotation.x = Math.PI / 2;
    root.add(nipGlow);

    // Small warning/inspection lights make the industrial scale legible.
    const statusLights: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), i === 2 ? juiceGlow : cyanGlow);
      light.position.set(-2.1 + i * 1.05, 1.45, 1.58);
      root.add(light);
      statusLights.push(light);
    }

    const timer = new THREE.Timer();
    let animationFrame = 0;
    let previousTime = 0;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      timer.update();
      const raw = timer.getElapsed();
      const delta = Math.min(raw - previousTime, 0.05);
      previousTime = raw;
      const speed = slowRef.current ? 0.28 : 1;
      const t = raw * speed;

      if (!pausedRef.current) {
        rollGroups[0].rotation.z = t * 1.62;
        rollGroups[1].rotation.z = -t * 1.44;
        rollGroups[2].rotation.z = t * 1.62;
        gears[0].rotation.z = -t * 2.8;
        gears[1].rotation.z = t * 1.92;
        gears[2].rotation.z = -t * 2.58;
        statusLights.forEach((light, i) => { light.scale.setScalar(0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * 3 + i))); });

        caneParticles.forEach(({ mesh, phase, lane, seed }) => {
          const cycle = (t * 0.13 + phase) % 1;
          const approach = Math.min(cycle / 0.56, 1);
          const jitter = Math.sin(seed + t * 2.2) * 0.035;
          mesh.position.x = -3.1 + approach * 2.25;
          mesh.position.y = 1.08 - approach * 0.82 + jitter;
          mesh.position.z = (lane - 0.5) * 1.1;
          mesh.rotation.y = Math.sin(seed + t * 1.8) * 0.18;
          const squeeze = Math.max(0, Math.min(1, (cycle - 0.5) / 0.17));
          mesh.scale.set(1 - squeeze * 0.52, 1 - squeeze * 0.16, 1 - squeeze * 0.34);
        });

        fibers.forEach(({ mesh, phase, lane, seed }) => {
          const cycle = (t * 0.16 + phase) % 1;
          const laneOffset = (lane - 0.5) * 1.04;
          if (cycle < 0.43) {
            const p = cycle / 0.43;
            mesh.position.set(-1.25 + p * 1.08, 0.22 - p * 0.27, laneOffset * (1 - p * 0.45));
            mesh.scale.set(0.58 + p * 0.42, 1.08, 1);
          } else {
            const p = (cycle - 0.43) / 0.57;
            mesh.position.set(-0.06 + p * 2.3, -0.05 - p * 0.53, laneOffset * 1.08);
            mesh.scale.set(1 + p * 0.7, 0.9 - p * 0.2, 1.08);
            mesh.rotation.z = Math.sin(seed + t * 3) * 0.28;
          }
        });

        juiceDrops.forEach((drop, i) => {
          const cycle = (t * 0.38 + i / juiceDrops.length) % 1;
          drop.position.set(-1.1 + (i % 13) * 0.18, 0.13 - cycle * 0.82, -0.72 + ((i * 5) % 14) * 0.105);
          drop.scale.setScalar(0.5 + Math.sin(cycle * Math.PI) * 1.2);
        });

        juiceJets.forEach((jet, i) => {
          const cycle = (t * 0.28 + i / juiceJets.length) % 1;
          jet.position.set(-0.9 + (i % 7) * 0.3, 0.12 - cycle * 0.45, -0.45 + ((i * 3) % 7) * 0.15);
          jet.rotation.z = Math.sin(t * 2 + i) * 0.25;
          jet.scale.y = 0.45 + Math.sin(cycle * Math.PI) * 1.7;
        });

        juicePool.scale.y = 1 + Math.sin(t * 1.4) * 0.014;
        nipGlow.scale.setScalar(0.94 + Math.sin(t * 4.5) * 0.045);
      }

      controls.update();
      composer.render(delta);
    };
    animate();

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      controls.dispose();
      composer.dispose();
      renderer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <section className="extraction-mill-v2">
      <div className="extraction-mill-v2-heading">
        <div><span>REALISM BENCHMARK · EXTRACTION</span><h2>Extraction Mill · Material Transformation</h2></div>
        <p>A detailed cutaway model where the machine, the material and the separation event are all visible together. The goal is to understand the process before reading the explanation.</p>
      </div>
      <div className="extraction-mill-v2-process">
        <div className="extraction-step active"><b>01</b><span>CANE ENTERS</span><small>Segmented fibrous feed</small></div>
        <div className="extraction-step"><b>02</b><span>COMPRESSION</span><small>Three rolls deform the cane</small></div>
        <div className="extraction-step"><b>03</b><span>JUICE RELEASE</span><small>Liquid falls into the pan</small></div>
        <div className="extraction-step"><b>04</b><span>BAGASSE EXITS</span><small>Fiber leaves as a solid stream</small></div>
      </div>
      <div ref={mount} className="extraction-mill-v2-canvas" aria-label="Detailed interactive 3D sugarcane extraction mill showing cane compression, juice release and bagasse output" />
      <div className="extraction-mill-v2-info">
        <div className="extraction-material-card"><span>THE TRANSFORMATION</span><strong>SUGARCANE → JUICE + BAGASSE</strong><p><b>What you can see:</b> whole cane enters the roll nip, is visibly compressed, liquid separates downward, and the remaining fibrous material continues into the bagasse outlet.</p><p><b>Model scope:</b> this is a process-teaching visualization, not a plant-design calculation. Engineering values remain in the process model rather than being invented by the renderer.</p></div>
        <div className="extraction-output-card"><span>OUTPUT STREAMS</span><div><i className="juice-dot" /><b>Sugarcane juice</b><small>→ clarification</small></div><div><i className="fiber-dot" /><b>Bagasse</b><small>→ fibrous solid</small></div></div>
      </div>
      <div className="extraction-mill-v2-controls"><button type="button" onClick={() => setPaused(v => !v)}>{paused ? "▶ RESUME" : "Ⅱ PAUSE"}</button><button type="button" className={slow ? "selected" : ""} onClick={() => setSlow(v => !v)}>◷ {slow ? "NORMAL SPEED" : "SLOW MOTION"}</button><span>Drag to inspect the cutaway · Scroll to zoom</span></div>
    </section>
  );
}
