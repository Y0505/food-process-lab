"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const metal = (color: number, metalness = 0.75, roughness = 0.3) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const matte = (color: number, roughness = 0.7) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.02, roughness });

const STEEL = metal(0x7d8888, 0.9, 0.24);
const STEEL_DARK = metal(0x364447, 0.86, 0.3);
const FRAME = metal(0x425255, 0.72, 0.34);
const SHAFT = metal(0x9ba4a2, 0.92, 0.2);
const GEAR = metal(0x59686a, 0.88, 0.25);
const COPPER = metal(0xb8783f, 0.72, 0.3);
const RUBBER = matte(0x171b1c, 0.88);
const CANE = matte(0x9aac4c, 0.78);
const FIBER = matte(0x9b754b, 0.92);
const FIBER_DARK = matte(0x765638, 0.94);
const JUICE = new THREE.MeshPhysicalMaterial({
  color: 0x73a33d,
  roughness: 0.2,
  metalness: 0,
  transmission: 0.05,
  transparent: true,
  opacity: 0.9,
});
const JUICE_GLOW = new THREE.MeshBasicMaterial({ color: 0x9fca55, transparent: true, opacity: 0.45 });
const GLASS = new THREE.MeshPhysicalMaterial({
  color: 0x8fd8cc,
  transparent: true,
  opacity: 0.09,
  roughness: 0.08,
  transmission: 0.12,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const DARK_BEARING = metal(0x222c2e, 0.82, 0.34);

function addBox(g: THREE.Group, size: [number, number, number], position: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function addCylinder(g: THREE.Group, radius: number, depth: number, position: [number, number, number], material: THREE.Material, radial = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, radial), material);
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function addPipe(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material) {
  const delta = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 16), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function addGear(g: THREE.Group, radius: number, teeth: number, position: [number, number, number], material: THREE.Material) {
  const shape = new THREE.Shape();
  const inner = radius * 0.78;
  for (let i = 0; i < teeth * 4; i++) {
    const angle = (i / (teeth * 4)) * Math.PI * 2;
    const phase = i % 4;
    const r = phase === 1 || phase === 2 ? radius : inner;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  });
  geometry.center();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function addRollGrooves(g: THREE.Group, x: number, y: number, z: number) {
  for (let i = 0; i < 9; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.59, 0.026, 8, 48), COPPER);
    ring.position.set(x, y, z);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = (i - 4) * 0.04;
    ring.castShadow = ring.receiveShadow = true;
    g.add(ring);
  }
}

export default function ExtractionMillV2() {
  const mount = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);
  const pausedRef = useRef(false);
  const slowRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
    slowRef.current = slow;
  }, [paused, slow]);

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b0d);
    scene.fog = new THREE.Fog(0x050b0d, 9, 22);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 35);
    const baseCamera = new THREE.Vector3(5.6, 3.35, 8.9);
    camera.position.copy(baseCamera);
    camera.lookAt(0.15, 0.05, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe1eee9, 0x0a1114, 2.05));
    const key = new THREE.DirectionalLight(0xffe6c5, 4.0);
    key.position.set(5, 8, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6ec7b6, 1.5);
    rim.position.set(-6, 4, -6);
    scene.add(rim);
    const warm = new THREE.PointLight(0xffa55e, 1.2, 10);
    warm.position.set(0, 1.6, 2.8);
    scene.add(warm);

    const root = new THREE.Group();
    root.rotation.y = -0.18;
    scene.add(root);

    // Industrial base and heavy welded frame.
    addBox(root, [9.2, 0.18, 5.6], [0, -1.48, 0], matte(0x11191b, 0.92));
    addBox(root, [7.1, 0.26, 2.85], [0.35, -1.28, 0], STEEL_DARK);
    for (const x of [-2.85, 2.55]) {
      for (const z of [-1.42, 1.42]) {
        addBox(root, [0.32, 2.9, 0.34], [x, -0.02, z], FRAME);
        addBox(root, [0.78, 0.18, 0.78], [x, -1.14, z], STEEL_DARK);
      }
    }
    for (const z of [-1.42, 1.42]) {
      addBox(root, [5.72, 0.3, 0.34], [-0.15, 1.1, z], FRAME);
      addBox(root, [5.72, 0.22, 0.28], [-0.15, -0.98, z], FRAME);
    }
    addBox(root, [0.34, 2.1, 0.3], [-2.15, 0.08, -1.42], FRAME);
    addBox(root, [0.34, 2.1, 0.3], [2.0, 0.08, -1.42], FRAME);

    // Large feed chute: the input material is intentionally exposed.
    const feed = new THREE.Group();
    feed.position.set(-2.05, 1.55, 0);
    root.add(feed);
    const feedFloor = addBox(feed, [1.65, 0.16, 1.65], [0, -0.48, 0], STEEL);
    feedFloor.rotation.z = -0.28;
    const feedWallA = addBox(feed, [1.7, 0.12, 0.12], [0, 0.12, -0.82], STEEL);
    feedWallA.rotation.z = -0.28;
    const feedWallB = addBox(feed, [1.7, 0.12, 0.12], [0, 0.12, 0.82], STEEL);
    feedWallB.rotation.z = -0.28;
    addBox(feed, [0.18, 0.95, 1.8], [-0.82, 0.02, 0], STEEL_DARK);

    // Educational three-roll arrangement: feed roll, top roll, discharge roll.
    const rollGroup = new THREE.Group();
    root.add(rollGroup);
    const rollPositions: Array<[number, number]> = [[-0.78, -0.02], [0, 0.64], [0.78, -0.02]];
    const rolls: THREE.Mesh[] = [];
    rollPositions.forEach(([x, y], index) => {
      const roll = addCylinder(rollGroup, 0.62, 2.7, [x, y, 0], STEEL, 48);
      roll.rotation.x = Math.PI / 2;
      rolls.push(roll);
      addRollGrooves(rollGroup, x, y, 0);
      for (const z of [-1.37, 1.37]) {
        addCylinder(rollGroup, 0.72, 0.07, [x, y, z], STEEL_DARK, 40).rotation.x = Math.PI / 2;
      }
      for (const z of [-1.53, 1.53]) {
        addCylinder(root, 0.28, 0.28, [x, y, z], DARK_BEARING, 24).rotation.x = Math.PI / 2;
        addBox(root, [0.5, 0.58, 0.3], [x, y, z], FRAME);
      }
      if (index === 1) addBox(root, [0.9, 0.7, 0.34], [x, y + 0.72, -1.42], STEEL_DARK);
    });

    // Shafts are visible through the bearing housings.
    for (const [x, y] of rollPositions) {
      const shaft = addCylinder(root, 0.13, 3.65, [x, y, 0], SHAFT, 24);
      shaft.rotation.x = Math.PI / 2;
    }

    // Simplified drive side. It communicates power transfer, but does not compete with the material view.
    const drive = new THREE.Group();
    drive.position.set(0.15, -0.08, -1.76);
    root.add(drive);
    addBox(drive, [1.45, 0.95, 0.95], [2.45, -0.55, 0], STEEL_DARK);
    addCylinder(drive, 0.48, 0.72, [1.7, 0.0, 0], STEEL_DARK, 32).rotation.z = Math.PI / 2;
    addBox(drive, [0.55, 0.7, 0.9], [2.85, -0.02, 0], FRAME);
    addCylinder(drive, 0.3, 0.35, [3.18, -0.02, 0], COPPER, 28).rotation.z = Math.PI / 2;
    addBox(drive, [1.25, 0.12, 0.8], [3.75, -0.68, 0], STEEL_DARK);

    const gearGroup = new THREE.Group();
    drive.add(gearGroup);
    const driveGears = [
      addGear(gearGroup, 0.28, 14, [0.35, 0.05, 0.52], GEAR),
      addGear(gearGroup, 0.4, 20, [0.35, 0.05, 1.12], GEAR),
      addGear(gearGroup, 0.31, 16, [1.0, 0.05, 1.12], GEAR),
      addGear(gearGroup, 0.43, 22, [1.62, 0.05, 1.12], GEAR),
    ];

    // Transparent guard/cutaway surface keeps the internals readable.
    const guard = addBox(root, [2.9, 1.9, 0.06], [0.1, 0.05, -1.59], GLASS);
    guard.castShadow = false;

    // Juice pan and outlet.
    addBox(root, [3.35, 0.12, 2.2], [0, -0.78, 0], STEEL_DARK);
    addBox(root, [3.35, 0.18, 0.12], [0, -0.54, -1.06], STEEL);
    addBox(root, [3.35, 0.18, 0.12], [0, -0.54, 1.06], STEEL);
    addPipe(root, new THREE.Vector3(1.35, -0.79, 0), new THREE.Vector3(2.25, -0.79, 0), 0.11, STEEL);
    addPipe(root, new THREE.Vector3(2.25, -0.79, 0), new THREE.Vector3(2.25, -1.18, 0), 0.11, STEEL);
    addPipe(root, new THREE.Vector3(2.25, -1.18, 0), new THREE.Vector3(3.2, -1.18, 0), 0.11, STEEL);
    const juicePool = addBox(root, [2.85, 0.055, 1.55], [-0.15, -0.68, 0], JUICE);
    juicePool.material.transparent = true;
    juicePool.material.opacity = 0.86;

    // Bagasse discharge chute is physically separate from the liquid outlet.
    const bagasseChute = new THREE.Group();
    bagasseChute.position.set(1.82, -0.03, 0);
    root.add(bagasseChute);
    const chuteFloor = addBox(bagasseChute, [1.45, 0.14, 1.15], [0.5, -0.45, 0], STEEL);
    chuteFloor.rotation.z = -0.3;
    const chuteSideA = addBox(bagasseChute, [1.5, 0.1, 0.1], [0.5, 0.0, -0.58], STEEL);
    chuteSideA.rotation.z = -0.3;
    const chuteSideB = addBox(bagasseChute, [1.5, 0.1, 0.1], [0.5, 0.0, 0.58], STEEL);
    chuteSideB.rotation.z = -0.3;

    type CaneParticle = { mesh: THREE.Mesh; phase: number; lane: number };
    type FiberParticle = { mesh: THREE.Mesh; phase: number; lane: number };
    const caneParticles: CaneParticle[] = [];
    const fiberParticles: FiberParticle[] = [];
    const juiceDrops: THREE.Mesh[] = [];
    const fiberDust: THREE.Mesh[] = [];

    // Cane pieces have visible segmented bodies rather than abstract cubes.
    for (let i = 0; i < 30; i++) {
      const cane = addCylinder(root, 0.095, 0.64 + (i % 3) * 0.12, [0, 0, 0], CANE, 12);
      cane.rotation.z = Math.PI / 2 + ((i % 3) - 1) * 0.15;
      for (let ring = 0; ring < 3; ring++) {
        const node = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.012, 6, 12), CANE_LIGHT);
        node.position.set(0, -0.18 + ring * 0.18, 0);
        node.rotation.x = Math.PI / 2;
        cane.add(node);
      }
      caneParticles.push({ mesh: cane, phase: i / 30, lane: (i % 7) / 6 });
    }

    // Fibers start thick and chaotic, then become flatter, longer bagasse ribbons after compression.
    for (let i = 0; i < 42; i++) {
      const fiber = addBox(root, [0.42, 0.055, 0.055], [0, 0, 0], i % 3 === 0 ? FIBER_DARK : FIBER);
      fiberParticles.push({ mesh: fiber, phase: i / 42, lane: (i % 11) / 10 });
    }

    for (let i = 0; i < 46; i++) juiceDrops.push(addCylinder(root, 0.025, 0.09, [0, 0, 0], JUICE_GLOW, 10));
    for (let i = 0; i < 18; i++) fiberDust.push(addBox(root, [0.12, 0.025, 0.025], [0, 0, 0], FIBER));

    // Visual flow markers point directly through the compression zone.
    const flowArrow = new THREE.Group();
    root.add(flowArrow);
    for (let i = 0; i < 5; i++) {
      const line = addBox(flowArrow, [0.3, 0.03, 0.03], [-1.25 + i * 0.42, 0.0, -1.7], COPPER);
      line.castShadow = false;
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.15, 8), COPPER);
      head.rotation.z = -Math.PI / 2;
      head.position.set(-1.07 + i * 0.42, 0.0, -1.7);
      flowArrow.add(head);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const timeScale = slowRef.current ? 0.3 : 1;
      const t = elapsed * timeScale;

      if (!pausedRef.current) {
        // Coherent mechanical chain: gears and rolls move continuously.
        const directions = [1, -1, 1, -1];
        driveGears.forEach((gear, i) => {
          gear.rotation.z = t * (2.5 / (i + 2)) * directions[i];
        });
        rolls.forEach((roll, i) => {
          roll.rotation.z = t * (i === 1 ? -1.55 : 1.55);
        });

        caneParticles.forEach(({ mesh, phase, lane }) => {
          const cycle = (t * 0.18 + phase) % 1;
          const approach = Math.min(cycle / 0.58, 1);
          mesh.position.x = -2.95 + approach * 2.25;
          mesh.position.z = (lane - 0.5) * 1.15;
          mesh.position.y = 0.98 - approach * 0.78 + Math.sin(cycle * 10 + phase * 8) * 0.035;
          const compression = Math.max(0, (cycle - 0.54) / 0.2);
          mesh.scale.set(1 - compression * 0.45, 1, 1 - compression * 0.15);
          mesh.rotation.y = Math.sin(t * 2 + phase * 9) * 0.16;
        });

        fiberParticles.forEach(({ mesh, phase, lane }) => {
          const cycle = (t * 0.16 + phase) % 1;
          const z = (lane - 0.5) * 1.02;
          if (cycle < 0.46) {
            const approach = cycle / 0.46;
            mesh.position.set(-1.15 + approach * 1.12, 0.25 - approach * 0.3, z * (1 - approach * 0.35));
            mesh.scale.set(0.45 + approach * 0.55, 1.2, 1);
          } else {
            const exit = (cycle - 0.46) / 0.54;
            mesh.position.set(-0.03 + exit * 2.18, -0.08 - exit * 0.48, z * 1.06);
            mesh.scale.set(0.95 + exit * 0.75, 0.95 - exit * 0.2, 1.15);
            mesh.rotation.z = Math.sin(t * 2.2 + phase * 14) * 0.24;
          }
        });

        juiceDrops.forEach((drop, i) => {
          const cycle = (t * 0.42 + i / juiceDrops.length) % 1;
          const x = -1.1 + (i % 9) * 0.25;
          const z = -0.7 + ((i * 7) % 12) * 0.12;
          drop.position.set(x, 0.04 - cycle * 0.8, z);
          drop.scale.setScalar(0.55 + Math.sin(cycle * Math.PI) * 0.9);
        });

        fiberDust.forEach((piece, i) => {
          const cycle = (t * 0.22 + i / fiberDust.length) % 1;
          piece.position.set(1.0 + cycle * 1.55, -0.08 - cycle * 0.35, -0.5 + ((i * 5) % 9) * 0.12);
          piece.rotation.z = t * (0.5 + i * 0.01);
        });

        juicePool.position.y = -0.68 + Math.sin(t * 1.1) * 0.008;
        flowArrow.position.x = Math.sin(t * 1.6) * 0.04;
      }

      camera.position.x = baseCamera.x + (pausedRef.current ? 0 : Math.sin(t * 0.22) * 0.06);
      camera.position.y = baseCamera.y + (pausedRef.current ? 0 : Math.sin(t * 0.16) * 0.025);
      camera.lookAt(0.15, -0.05, 0);
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <section className="extraction-mill-v2">
      <div className="extraction-mill-v2-heading">
        <div>
          <span>REALISM BENCHMARK · EXTRACTION</span>
          <h2>Extraction Mill · Inside the Transformation</h2>
        </div>
        <p>
          A cutaway learning model: watch sugarcane enter, get squeezed between three rolls, release juice, and leave as fibrous bagasse. The equipment is simplified so the material story stays visible.
        </p>
      </div>

      <div className="extraction-mill-v2-process">
        <div className="extraction-step active"><b>01</b><span>CANE ENTERS</span><small>Fibrous feed</small></div>
        <div className="extraction-step"><b>02</b><span>COMPRESSION</span><small>Cells are squeezed</small></div>
        <div className="extraction-step"><b>03</b><span>JUICE RELEASE</span><small>Liquid leaves fiber</small></div>
        <div className="extraction-step"><b>04</b><span>BAGASSE EXITS</span><small>Fiber stream remains</small></div>
      </div>

      <div ref={mount} className="extraction-mill-v2-canvas" aria-label="Interactive cutaway 3D sugarcane extraction mill showing cane compression, juice separation and bagasse output" />

      <div className="extraction-mill-v2-info">
        <div className="extraction-material-card">
          <span>WHAT HAPPENS TO THE MATERIAL?</span>
          <strong>SUGARCANE → JUICE + BAGASSE</strong>
          <p><b>Separates:</b> liquid sugarcane juice from the solid fibrous structure.</p>
          <p><b>Combines:</b> nothing is intentionally added in this unit. The key operation is mechanical separation by compression.</p>
        </div>
        <div className="extraction-output-card">
          <span>VISIBLE OUTPUT STREAMS</span>
          <div><i className="juice-dot" /><b>Sugarcane juice</b><small>→ clarification</small></div>
          <div><i className="fiber-dot" /><b>Bagasse</b><small>→ fibrous solid</small></div>
        </div>
      </div>

      <div className="extraction-mill-v2-controls">
        <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "▶ RESUME" : "Ⅱ PAUSE"}</button>
        <button type="button" className={slow ? "selected" : ""} onClick={() => setSlow((value) => !value)}>◷ {slow ? "NORMAL SPEED" : "SLOW MOTION"}</button>
        <span>Material-first animation · the machine motion supports the process story</span>
      </div>
    </section>
  );
}
