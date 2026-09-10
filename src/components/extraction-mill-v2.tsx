"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const mat = (color: number, metalness = 0.15, roughness = 0.5) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });

const STEEL = mat(0x647174, 0.88, 0.28);
const DARK = mat(0x202c2f, 0.9, 0.25);
const FRAME = mat(0x39484a, 0.78, 0.34);
const COPPER = mat(0xa86d3f, 0.72, 0.3);
const RUBBER = mat(0x171b1c, 0.05, 0.82);
const CANE = mat(0x91a84d, 0, 0.86);
const FIBER = mat(0x987149, 0, 0.92);
const JUICE = mat(0x5c963f, 0, 0.3);
const TRAY = mat(0x35494a, 0.72, 0.32);
const GLASS = new THREE.MeshPhysicalMaterial({
  color: 0xa8ded8,
  transparent: true,
  opacity: 0.12,
  roughness: 0.08,
  transmission: 0.2,
  depthWrite: false,
  side: THREE.DoubleSide,
});

function addBox(g: THREE.Group, size: [number, number, number], pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function addCylinder(g: THREE.Group, radius: number, length: number, pos: [number, number, number], material: THREE.Material, radial = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, radial), material);
  mesh.position.set(...pos);
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

function addTorus(g: THREE.Group, radius: number, tube: number, pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 48), material);
  mesh.position.set(...pos);
  mesh.castShadow = mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

export default function ExtractionMillV2() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071013);
    scene.fog = new THREE.Fog(0x071013, 8, 20);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    camera.position.set(5.4, 3.8, 7.7);
    camera.lookAt(0, 0.15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xd9ebe7, 0x101719, 1.8));
    const key = new THREE.DirectionalLight(0xfff0d8, 3.5);
    key.position.set(5, 8, 7);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x69aaa2, 1.15);
    fill.position.set(-5, 4, -4);
    scene.add(fill);

    const root = new THREE.Group();
    root.rotation.y = -0.22;
    scene.add(root);

    addBox(root, [8.6, 0.18, 4.8], [0, -1.35, 0], mat(0x10191c, 0.05, 0.94));

    // Heavy structural frame: columns, cross members and bearing supports.
    for (const x of [-2.85, -1.0, 1.0, 2.85]) {
      for (const z of [-1.35, 1.35]) addBox(root, [0.22, 2.65, 0.22], [x, -0.02, z], FRAME);
    }
    for (const y of [-1.0, 1.08]) {
      for (const z of [-1.35, 1.35]) addBox(root, [6.0, 0.2, 0.2], [0, y, z], FRAME);
    }
    addBox(root, [6.0, 0.18, 0.18], [0, 0.05, -1.35], STEEL);
    addBox(root, [6.0, 0.18, 0.18], [0, 0.05, 1.35], STEEL);

    // Feed chute and throat guide the shredded cane into the compression nip.
    const chute = new THREE.Group();
    chute.position.set(-2.2, 1.15, 0);
    root.add(chute);
    addBox(chute, [1.35, 0.08, 1.55], [0, 0, -0.68], STEEL).rotation.z = -0.18;
    addBox(chute, [1.35, 0.08, 1.55], [0, 0, 0.68], STEEL).rotation.z = 0.18;
    addBox(chute, [1.25, 0.12, 1.3], [0, -0.72, 0], DARK);
    addBox(root, [0.18, 0.75, 1.65], [-1.45, 0.1, 0], STEEL);

    // Three heavy rollers form the recognizable extraction mechanism.
    const rolls = new THREE.Group();
    rolls.position.set(0.15, 0, 0);
    root.add(rolls);
    const rollMeshes: THREE.Mesh[] = [];
    const rollX = [-0.82, 0, 0.82];
    const rollY = [0.02, 0.55, 0.02];
    rollX.forEach((x, i) => {
      const roll = addCylinder(rolls, 0.57, 2.55, [x, rollY[i], 0], STEEL, 40);
      roll.rotation.x = Math.PI / 2;
      rollMeshes.push(roll);
      for (let ring = 0; ring < 7; ring++) {
        const groove = addTorus(rolls, 0.51, 0.022, [x, rollY[i], 0], COPPER);
        groove.rotation.x = Math.PI / 2;
        groove.rotation.z = (ring * Math.PI) / 7;
      }
      // Bearing housings at both ends make the rotating shafts readable.
      for (const z of [-1.42, 1.42]) {
        addCylinder(root, 0.25, 0.32, [x, rollY[i], z], DARK, 24).rotation.x = Math.PI / 2;
        addBox(root, [0.46, 0.5, 0.25], [x, rollY[i], z], FRAME);
      }
    });

    // Shafts extend through the bearings and connect the rolls to the drive train.
    for (const [x, y] of rollX.map((x, i) => [x, rollY[i]] as const)) {
      const shaft = addCylinder(root, 0.11, 3.45, [x, y, 0], DARK, 20);
      shaft.rotation.x = Math.PI / 2;
    }

    // Side drive train: motor -> coupling -> gearbox -> mill rolls.
    addBox(root, [1.2, 0.85, 1.15], [2.55, -0.48, -1.62], DARK);
    addBox(root, [0.72, 0.65, 0.78], [2.55, 0.25, -1.62], STEEL);
    addCylinder(root, 0.42, 0.72, [2.55, 0.24, -1.1], COPPER, 32).rotation.x = Math.PI / 2;
    addCylinder(root, 0.52, 0.95, [2.55, 0.24, -1.98], RUBBER, 32).rotation.x = Math.PI / 2;
    addPipe(root, new THREE.Vector3(2.15, 0.25, -1.1), new THREE.Vector3(1.05, 0.55, -1.1), 0.08, DARK);
    addPipe(root, new THREE.Vector3(1.05, 0.55, -1.1), new THREE.Vector3(0.2, 0.55, -1.1), 0.08, DARK);

    // Juice collection tray below the nip, with a visible outlet pipe.
    addBox(root, [3.25, 0.12, 2.0], [0, -0.72, 0], TRAY);
    addBox(root, [3.25, 0.2, 0.12], [0, -0.5, -0.96], STEEL);
    addBox(root, [3.25, 0.2, 0.12], [0, -0.5, 0.96], STEEL);
    addPipe(root, new THREE.Vector3(1.35, -0.76, 0), new THREE.Vector3(2.1, -0.76, 0), 0.09, STEEL);
    addPipe(root, new THREE.Vector3(2.1, -0.76, 0), new THREE.Vector3(2.1, -1.18, 0), 0.09, STEEL);
    addPipe(root, new THREE.Vector3(2.1, -1.18, 0), new THREE.Vector3(2.95, -1.18, 0), 0.09, STEEL);

    // Transparent inspection panels expose the compression zone without turning the whole machine into glass.
    const frontPanel = addBox(root, [3.7, 1.95, 0.035], [0, 0.02, -1.46], GLASS);
    frontPanel.castShadow = false;
    addBox(root, [0.08, 2.05, 1.95], [-1.95, 0.02, 0], GLASS).castShadow = false;
    addBox(root, [0.08, 2.05, 1.95], [1.95, 0.02, 0], GLASS).castShadow = false;

    // Feed material: long fibrous pieces visibly converge into the first nip.
    const canePieces: THREE.Mesh[] = [];
    for (let i = 0; i < 22; i++) {
      const piece = addBox(root, [0.48, 0.075, 0.07], [-2.72 + (i % 7) * 0.17, 0.58 + (i % 3) * 0.16, -0.42 + (i % 5) * 0.21], FIBER);
      piece.rotation.z = (i % 3 - 1) * 0.15;
      canePieces.push(piece);
    }

    // Compressed fiber/bagasse exits the final roll.
    const bagasse: THREE.Mesh[] = [];
    for (let i = 0; i < 18; i++) {
      const piece = addBox(root, [0.34, 0.06, 0.09], [1.45 + (i % 6) * 0.15, -0.05 + (i % 4) * 0.09, -0.5 + (i % 5) * 0.24], FIBER);
      bagasse.push(piece);
    }

    // Juice droplets visibly leave the compression zone and fall into the collection tray.
    const droplets: THREE.Mesh[] = [];
    for (let i = 0; i < 28; i++) droplets.push(addCylinder(root, 0.026, 0.08, [0, 0, 0], JUICE, 10));

    // A thin juice level makes the collected liquid readable without hiding the tray.
    const juiceLevel = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.055, 1.55), JUICE);
    juiceLevel.position.set(-0.15, -0.63, 0);
    juiceLevel.material.transparent = true;
    juiceLevel.material.opacity = 0.82;
    root.add(juiceLevel);

    // Small safety guards and handrails add scale and industrial context.
    for (const x of [-2.8, 2.8]) {
      addBox(root, [0.08, 1.15, 0.08], [x, 0.35, -1.65], COPPER);
      addBox(root, [0.7, 0.08, 0.08], [x, 0.9, -1.65], COPPER);
    }

    let animationId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Counter-rotation is the key mechanical event: the rolls pull and compress the fiber between them.
      rollMeshes.forEach((roll, i) => {
        roll.rotation.z = elapsed * (i === 1 ? -1.65 : 1.65);
      });

      canePieces.forEach((piece, i) => {
        const cycle = (elapsed * 0.24 + i / canePieces.length) % 1;
        piece.position.x = -2.72 + cycle * 2.0;
        piece.position.y = 0.45 + Math.sin(cycle * Math.PI) * 0.22 + (i % 3) * 0.12;
        piece.position.z = -0.46 + (i % 5) * 0.22;
        piece.scale.x = 1 - Math.max(0, cycle - 0.62) * 1.4;
      });

      bagasse.forEach((piece, i) => {
        const cycle = (elapsed * 0.2 + i / bagasse.length) % 1;
        piece.position.x = 1.35 + cycle * 1.55;
        piece.position.y = -0.02 - cycle * 0.2 + (i % 4) * 0.08;
        piece.rotation.z = Math.sin(elapsed * 1.7 + i) * 0.18;
        piece.scale.x = 0.9 + cycle * 0.35;
      });

      droplets.forEach((drop, i) => {
        const cycle = (elapsed * 0.52 + i / droplets.length) % 1;
        const lane = (i % 7) / 6;
        drop.position.x = -1.05 + lane * 2.1;
        drop.position.z = -0.7 + ((i * 13) % 10) * 0.14;
        drop.position.y = 0.0 - cycle * 0.82;
        drop.scale.setScalar(0.55 + Math.sin(cycle * Math.PI) * 0.7);
      });

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
      cancelAnimationFrame(animationId);
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
          <h2>Extraction Mill V2</h2>
        </div>
        <p>
          Educational 3-roll mill model: feed enters the nip, rotating rolls compress the fiber,
          juice falls into the collection tray, and bagasse leaves the machine.
        </p>
      </div>
      <div ref={mount} className="extraction-mill-v2-canvas" aria-label="Interactive 3D sugarcane extraction mill model" />
      <div className="extraction-mill-v2-legend">
        <span><i /> Feed fiber</span>
        <span><i /> Counter-rotating rolls</span>
        <span><i /> Extracted juice</span>
        <span><i /> Bagasse outlet</span>
      </div>
    </section>
  );
}
