"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const mat = (color: number, metalness = 0.7, roughness = 0.32) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const STEEL = mat(0x718082, 0.9, 0.24);
const STEEL_DARK = mat(0x263437, 0.88, 0.28);
const FRAME = mat(0x455457, 0.78, 0.3);
const SHAFT = mat(0xb0b8b5, 0.95, 0.18);
const GEAR = mat(0x566366, 0.92, 0.22);
const BRASS = mat(0xb57b42, 0.72, 0.28);
const RUBBER = mat(0x111617, 0.12, 0.86);
const CANE = mat(0x91a94a, 0.05, 0.72);
const CANE_DARK = mat(0x65782f, 0.04, 0.82);
const FIBER = mat(0x9b7248, 0.04, 0.9);
const FIBER_DARK = mat(0x684c32, 0.03, 0.94);
const JUICE = new THREE.MeshPhysicalMaterial({ color: 0x79aa38, roughness: 0.18, transmission: 0.08, transparent: true, opacity: 0.92 });
const JUICE_GLOW = new THREE.MeshBasicMaterial({ color: 0xb4e36c, transparent: true, opacity: 0.58 });
const GLASS = new THREE.MeshPhysicalMaterial({ color: 0x8eddd0, roughness: 0.05, transmission: 0.45, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide });
const GLOW = new THREE.MeshBasicMaterial({ color: 0x5ee0b4, transparent: true, opacity: 0.22, side: THREE.DoubleSide });

function box(g: THREE.Object3D, size: [number, number, number], p: [number, number, number], material: THREE.Material, bevel = 0) {
  const geometry = new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...p);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function cyl(g: THREE.Object3D, radius: number, depth: number, p: [number, number, number], material: THREE.Material, radial = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, radial), material);
  mesh.position.set(...p);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function pipe(g: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
  const d = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 16), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function gearGeometry(radius: number, teeth: number, thickness: number) {
  const shape = new THREE.Shape();
  const inner = radius * 0.77;
  const count = teeth * 4;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = i % 4 === 1 || i % 4 === 2 ? radius : inner;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.025, bevelThickness: 0.025 });
}

function addGear(g: THREE.Object3D, radius: number, teeth: number, p: [number, number, number]) {
  const mesh = new THREE.Mesh(gearGeometry(radius, teeth, 0.16), GEAR);
  mesh.position.set(...p);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function addBolts(g: THREE.Object3D, x: number, y: number, z: number, radius = 0.055) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const b = cyl(g, radius, 0.08, [x + Math.cos(a) * 0.28, y + Math.sin(a) * 0.28, z], SHAFT, 12);
    b.rotation.x = Math.PI / 2;
  }
}

function addRoll(g: THREE.Group, x: number, y: number, rolls: THREE.Mesh[]) {
  const rollGroup = new THREE.Group();
  rollGroup.position.set(x, y, 0);
  g.add(rollGroup);
  const shell = cyl(rollGroup, 0.62, 2.72, [0, 0, 0], STEEL, 64);
  shell.rotation.x = Math.PI / 2;
  rolls.push(shell);
  for (let i = -6; i <= 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.615, 0.035, 8, 64), i % 3 === 0 ? BRASS : STEEL_DARK);
    ring.position.z = i * 0.19;
    ring.castShadow = ring.receiveShadow = true;
    rollGroup.add(ring);
  }
  for (const z of [-1.42, 1.42]) {
    const hub = cyl(rollGroup, 0.75, 0.11, [0, 0, z], STEEL_DARK, 48);
    hub.rotation.x = Math.PI / 2;
  }
  return rollGroup;
}

export default function ExtractionMillV2() {
  const mount = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);
  const pausedRef = useRef(false);
  const slowRef = useRef(false);

  useEffect(() => { pausedRef.current = paused; slowRef.current = slow; }, [paused, slow]);

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03090c);
    scene.fog = new THREE.Fog(0x03090c, 10, 24);

    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40);
    camera.position.set(5.7, 3.0, 8.7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 5.7;
    controls.maxDistance = 13;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0.1, 0.05, 0);

    scene.add(new THREE.HemisphereLight(0xeaf6f1, 0x071013, 2.1));
    const key = new THREE.DirectionalLight(0xffe2c0, 4.8);
    key.position.set(5, 8, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 1; key.shadow.camera.far = 22; scene.add(key);
    const rim = new THREE.DirectionalLight(0x55d8bd, 2.0); rim.position.set(-6, 5, -5); scene.add(rim);
    const fill = new THREE.PointLight(0x82d9c7, 1.2, 12); fill.position.set(-1, 2, 4); scene.add(fill);

    const root = new THREE.Group(); root.rotation.y = -0.12; scene.add(root);
    box(root, [9.4, 0.22, 5.2], [0, -1.55, 0], RUBBER);
    box(root, [7.1, 0.3, 3.0], [0.2, -1.34, 0], STEEL_DARK);

    // Heavy frame: simple but unmistakably industrial.
    for (const x of [-2.9, 2.55]) for (const z of [-1.48, 1.48]) {
      box(root, [0.34, 3.0, 0.36], [x, -0.05, z], FRAME);
      box(root, [0.82, 0.18, 0.82], [x, -1.14, z], STEEL_DARK);
      box(root, [0.68, 0.18, 0.68], [x, 1.32, z], STEEL_DARK);
    }
    for (const z of [-1.48, 1.48]) { box(root, [5.7, 0.32, 0.34], [-0.15, 1.28, z], FRAME); box(root, [5.7, 0.2, 0.3], [-0.15, -0.98, z], FRAME); }

    // Feed chute, visibly carrying cane toward the nip.
    const feed = new THREE.Group(); feed.position.set(-2.05, 1.62, 0); root.add(feed);
    const feedFloor = box(feed, [1.85, 0.16, 1.72], [0, -0.52, 0], STEEL); feedFloor.rotation.z = -0.28;
    const wallA = box(feed, [1.88, 0.12, 0.12], [0, 0.12, -0.83], STEEL); wallA.rotation.z = -0.28;
    const wallB = box(feed, [1.88, 0.12, 0.12], [0, 0.12, 0.83], STEEL); wallB.rotation.z = -0.28;
    box(feed, [0.18, 0.98, 1.84], [-0.9, 0.02, 0], STEEL_DARK);

    // Three-roll compression cluster.
    const rollAssembly = new THREE.Group(); root.add(rollAssembly);
    const rolls: THREE.Mesh[] = [];
    const rollGroups = [addRoll(rollAssembly, -0.8, -0.02, rolls), addRoll(rollAssembly, 0, 0.68, rolls), addRoll(rollAssembly, 0.8, -0.02, rolls)];

    // Bearing blocks and exposed roll shafts.
    for (const [x, y] of [[-0.8, -0.02], [0, 0.68], [0.8, -0.02]]) {
      for (const z of [-1.58, 1.58]) {
        cyl(root, 0.3, 0.18, [x, y, z], SHAFT, 28).rotation.x = Math.PI / 2;
        box(root, [0.56, 0.68, 0.34], [x, y, z], FRAME);
        addBolts(root, x, y, z > 0 ? z + 0.1 : z - 0.1);
      }
      const shaft = cyl(root, 0.14, 3.7, [x, y, 0], SHAFT, 24); shaft.rotation.x = Math.PI / 2;
    }

    // Front cutaway frame: open enough to see the process, structured enough to read as a machine casing.
    box(root, [3.45, 0.12, 0.16], [0, 1.34, 1.47], STEEL);
    box(root, [3.45, 0.12, 0.16], [0, -1.18, 1.47], STEEL);
    box(root, [0.16, 2.5, 0.12], [-1.73, 0.08, 1.47], STEEL);
    box(root, [0.16, 2.5, 0.12], [1.73, 0.08, 1.47], STEEL);
    const cutaway = box(root, [3.2, 2.25, 0.035], [0, 0.08, 1.43], GLASS); cutaway.castShadow = false;

    // Drive side and working gears are visible through a second transparent guard.
    const drive = new THREE.Group(); drive.position.set(2.75, 0.08, 1.52); root.add(drive);
    box(drive, [1.35, 1.05, 0.72], [0.15, -0.55, 0], STEEL_DARK);
    const gears = [addGear(drive, 0.3, 14, [-0.25, 0.18, 0]), addGear(drive, 0.44, 20, [0.34, 0.18, 0]), addGear(drive, 0.32, 15, [0.95, 0.18, 0])];
    box(drive, [1.35, 0.1, 1.0], [0.35, 0.18, 0.38], GLASS).castShadow = false;
    box(drive, [0.8, 0.58, 0.9], [0.7, -0.8, 0], FRAME);
    cyl(drive, 0.31, 0.62, [0.0, -0.8, 0], STEEL_DARK, 32).rotation.z = Math.PI / 2;
    pipe(drive, new THREE.Vector3(-0.1, -0.8, 0), new THREE.Vector3(-0.1, -0.18, 0), 0.11, SHAFT);

    // Juice collection pan and clean liquid outlet.
    box(root, [3.55, 0.13, 2.35], [0, -0.78, 0], STEEL_DARK);
    box(root, [3.55, 0.2, 0.12], [0, -0.53, -1.12], STEEL);
    box(root, [3.55, 0.2, 0.12], [0, -0.53, 1.12], STEEL);
    pipe(root, new THREE.Vector3(1.05, -0.82, 0), new THREE.Vector3(2.05, -0.82, 0), 0.12, STEEL);
    pipe(root, new THREE.Vector3(2.05, -0.82, 0), new THREE.Vector3(2.05, -1.2, 0), 0.12, STEEL);
    pipe(root, new THREE.Vector3(2.05, -1.2, 0), new THREE.Vector3(3.1, -1.2, 0), 0.12, STEEL);
    const juicePool = box(root, [3.0, 0.055, 1.6], [-0.12, -0.69, 0], JUICE); juicePool.castShadow = false;

    // Separate bagasse discharge chute.
    const bagasse = new THREE.Group(); bagasse.position.set(1.78, -0.04, 0); root.add(bagasse);
    const bagFloor = box(bagasse, [1.6, 0.15, 1.18], [0.55, -0.46, 0], STEEL); bagFloor.rotation.z = -0.3;
    const bagWallA = box(bagasse, [1.62, 0.1, 0.1], [0.55, 0.02, -0.6], STEEL); bagWallA.rotation.z = -0.3;
    const bagWallB = box(bagasse, [1.62, 0.1, 0.1], [0.55, 0.02, 0.6], STEEL); bagWallB.rotation.z = -0.3;

    // Material particles: each particle has a visible before/after state.
    type CaneParticle = { mesh: THREE.Mesh; phase: number; lane: number; seed: number };
    type FiberParticle = { mesh: THREE.Mesh; phase: number; lane: number; seed: number };
    const caneParticles: CaneParticle[] = [];
    const fiberParticles: FiberParticle[] = [];
    const juiceDrops: THREE.Mesh[] = [];
    const juiceJets: THREE.Mesh[] = [];

    for (let i = 0; i < 34; i++) {
      const cane = cyl(root, 0.105, 0.7 + (i % 3) * 0.12, [0, 0, 0], i % 4 === 0 ? CANE_DARK : CANE, 14);
      cane.rotation.z = Math.PI / 2;
      for (let r = -1; r <= 1; r++) {
        const node = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.012, 6, 14), CANE_DARK);
        node.rotation.x = Math.PI / 2; node.position.x = r * 0.19; cane.add(node);
      }
      caneParticles.push({ mesh: cane, phase: i / 34, lane: (i % 9) / 8, seed: i * 1.71 });
    }
    for (let i = 0; i < 46; i++) {
      const f = box(root, [0.52, 0.045, 0.07], [0, 0, 0], i % 4 === 0 ? FIBER_DARK : FIBER);
      fiberParticles.push({ mesh: f, phase: i / 46, lane: (i % 13) / 12, seed: i * 2.37 });
    }
    for (let i = 0; i < 64; i++) juiceDrops.push(cyl(root, 0.027, 0.09, [0, 0, 0], JUICE_GLOW, 10));
    for (let i = 0; i < 18; i++) juiceJets.push(cyl(root, 0.018, 0.24, [0, 0, 0], JUICE_GLOW, 8));

    // Compression glow marks the exact transformation zone without hiding the machine.
    const nipGlow = new THREE.Mesh(new THREE.RingGeometry(0.58, 0.76, 48, 1, 0, Math.PI), GLOW);
    nipGlow.position.set(0, 0.1, 1.49); nipGlow.rotation.x = Math.PI / 2; root.add(nipGlow);

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const speed = slowRef.current ? 0.32 : 1;
      const t = clock.getElapsedTime() * speed;
      if (!pausedRef.current) {
        // Three rolls counter-rotate around their common longitudinal axis.
        rollGroups[0].rotation.z = t * 1.65;
        rollGroups[1].rotation.z = -t * 1.45;
        rollGroups[2].rotation.z = t * 1.65;
        // Real gear train animation is deliberately visible, but secondary to material flow.
        gears[0].rotation.z = -t * 2.8;
        gears[1].rotation.z = t * 1.9;
        gears[2].rotation.z = -t * 2.6;

        caneParticles.forEach(({ mesh, phase, lane, seed }) => {
          const cycle = (t * 0.13 + phase) % 1;
          const approach = Math.min(cycle / 0.54, 1);
          const jitter = Math.sin(seed + t * 2.4) * 0.035;
          mesh.position.x = -3.0 + approach * 2.2;
          mesh.position.y = 1.05 - approach * 0.78 + jitter;
          mesh.position.z = (lane - 0.5) * 1.12;
          mesh.rotation.y = Math.sin(seed + t * 1.8) * 0.18;
          const squeeze = Math.max(0, Math.min(1, (cycle - 0.5) / 0.18));
          mesh.scale.set(1 - squeeze * 0.5, 1 - squeeze * 0.12, 1 - squeeze * 0.32);
        });

        fiberParticles.forEach(({ mesh, phase, lane, seed }) => {
          const cycle = (t * 0.16 + phase) % 1;
          const z = (lane - 0.5) * 1.02;
          if (cycle < 0.43) {
            const p = cycle / 0.43;
            mesh.position.set(-1.22 + p * 1.08, 0.24 - p * 0.28, z * (1 - p * 0.42));
            mesh.scale.set(0.55 + p * 0.45, 1.1, 1);
          } else {
            const p = (cycle - 0.43) / 0.57;
            mesh.position.set(-0.05 + p * 2.25, -0.08 - p * 0.5, z * 1.08);
            mesh.scale.set(1.0 + p * 0.65, 0.9 - p * 0.2, 1.1);
            mesh.rotation.z = Math.sin(seed + t * 3) * 0.28;
          }
        });

        juiceDrops.forEach((drop, i) => {
          const cycle = (t * 0.38 + i / juiceDrops.length) % 1;
          const x = -1.05 + (i % 12) * 0.18;
          const z = -0.72 + ((i * 5) % 13) * 0.12;
          drop.position.set(x, 0.1 - cycle * 0.83, z);
          drop.scale.setScalar(0.5 + Math.sin(cycle * Math.PI) * 1.25);
        });
        juiceJets.forEach((jet, i) => {
          const cycle = (t * 0.28 + i / juiceJets.length) % 1;
          jet.position.set(-0.85 + (i % 6) * 0.34, 0.12 - cycle * 0.42, -0.45 + ((i * 3) % 6) * 0.18);
          jet.rotation.z = Math.sin(t * 2 + i) * 0.25;
          jet.scale.y = 0.45 + Math.sin(cycle * Math.PI) * 1.8;
        });
        juicePool.scale.y = 1 + Math.sin(t * 1.3) * 0.015;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => { const w = Math.max(1, host.clientWidth); const h = Math.max(1, host.clientHeight); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); };
    resize(); window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); controls.dispose(); renderer.dispose(); if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement); };
  }, []);

  return (
    <section className="extraction-mill-v2">
      <div className="extraction-mill-v2-heading">
        <div><span>REALISM BENCHMARK · EXTRACTION</span><h2>Extraction Mill · Material Transformation</h2></div>
        <p>Interactive cutaway model focused on the food, not decorative machinery: cane enters, the rolls compress it, juice separates from the fibrous structure, and bagasse exits as a separate stream.</p>
      </div>
      <div className="extraction-mill-v2-process">
        <div className="extraction-step active"><b>01</b><span>CANE ENTERS</span><small>Whole fibrous feed</small></div>
        <div className="extraction-step"><b>02</b><span>COMPRESSION</span><small>Rolls squeeze the cane</small></div>
        <div className="extraction-step"><b>03</b><span>JUICE RELEASE</span><small>Liquid separates downward</small></div>
        <div className="extraction-step"><b>04</b><span>BAGASSE EXITS</span><small>Fiber continues forward</small></div>
      </div>
      <div ref={mount} className="extraction-mill-v2-canvas" aria-label="Cutaway interactive 3D sugarcane extraction mill showing compression, juice separation and bagasse output" />
      <div className="extraction-mill-v2-info">
        <div className="extraction-material-card"><span>THE TRANSFORMATION</span><strong>SUGARCANE → JUICE + BAGASSE</strong><p><b>What separates:</b> liquid sugarcane juice leaves the solid fibrous structure during mechanical compression.</p><p><b>What combines:</b> no intentional additive is shown here. This unit is modeled as a mechanical separation step.</p></div>
        <div className="extraction-output-card"><span>OUTPUT STREAMS</span><div><i className="juice-dot" /><b>Sugarcane juice</b><small>→ clarification</small></div><div><i className="fiber-dot" /><b>Bagasse</b><small>→ fibrous solid</small></div></div>
      </div>
      <div className="extraction-mill-v2-controls"><button type="button" onClick={() => setPaused(v => !v)}>{paused ? "▶ RESUME" : "Ⅱ PAUSE"}</button><button type="button" className={slow ? "selected" : ""} onClick={() => setSlow(v => !v)}>◷ {slow ? "NORMAL SPEED" : "SLOW MOTION"}</button><span>Drag to inspect the cutaway · Scroll to zoom</span></div>
    </section>
  );
}
