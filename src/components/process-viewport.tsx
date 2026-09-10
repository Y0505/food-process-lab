"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const visualizationModel = buildSugarcaneVisualizationModel();

function formatMass(value: number) {
  return `${value.toFixed(1)} kg/h`;
}

function addLabelSprite(scene: THREE.Scene, text: string, position: THREE.Vector3) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(5, 13, 17, 0.82)";
  context.roundRect(8, 8, 496, 112, 22);
  context.fill();
  context.strokeStyle = "rgba(185, 221, 226, 0.34)";
  context.lineWidth = 3;
  context.stroke();
  context.font = "600 30px Arial";
  context.fillStyle = "#e8f5f7";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(2.5, 0.62, 1);
  sprite.userData.labelTexture = texture;
  sprite.userData.labelMaterial = material;
  scene.add(sprite);
}

function makeEquipment(stageIndex: number, active: boolean) {
  const group = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0x587177,
    metalness: 0.72,
    roughness: 0.3,
    emissive: active ? 0x174f58 : 0x000000,
    emissiveIntensity: active ? 1.1 : 0,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2d33, metalness: 0.8, roughness: 0.24 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9dd8dc,
    transparent: true,
    opacity: 0.2,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.35,
  });

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    group.add(mesh);
    return mesh;
  };

  if (stageIndex === 0) {
    add(new THREE.BoxGeometry(1.8, 0.72, 1.35), shellMaterial, -0.15);
    add(new THREE.BoxGeometry(1.35, 0.24, 0.95), darkMaterial, 0.34);
    for (let i = -2; i <= 2; i += 1) add(new THREE.CylinderGeometry(0.08, 0.08, 1.15, 10), darkMaterial, 0.48).rotation.z = Math.PI / 2;
  } else if (stageIndex === 1) {
    add(new THREE.CylinderGeometry(0.64, 0.7, 1.45, 20), shellMaterial, 0.05);
    const drum = add(new THREE.CylinderGeometry(0.5, 0.5, 1.5, 20), darkMaterial, 0.05);
    drum.rotation.z = Math.PI / 2;
    add(new THREE.TorusGeometry(0.67, 0.07, 10, 28), shellMaterial, 0.08);
    add(new THREE.TorusGeometry(0.67, 0.07, 10, 28), shellMaterial, 0.08).rotation.x = Math.PI / 2;
  } else if (stageIndex === 2) {
    add(new THREE.CylinderGeometry(0.68, 0.68, 1.6, 24), shellMaterial, 0);
    add(new THREE.ConeGeometry(0.68, 0.45, 24), shellMaterial, 1.02);
    add(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 16), darkMaterial, 1.62);
    add(new THREE.CylinderGeometry(0.24, 0.24, 0.25, 16), darkMaterial, -0.92);
  } else if (stageIndex === 3) {
    add(new THREE.CylinderGeometry(0.72, 0.72, 1.7, 24), glassMaterial, 0);
    add(new THREE.CylinderGeometry(0.79, 0.79, 0.12, 24), shellMaterial, 0.88);
    add(new THREE.CylinderGeometry(0.79, 0.79, 0.12, 24), shellMaterial, -0.88);
    for (let i = 0; i < 3; i += 1) {
      const plate = add(new THREE.CylinderGeometry(0.7, 0.7, 0.07, 24), darkMaterial, -0.45 + i * 0.45);
      plate.scale.set(1, 1, 0.86);
    }
  } else if (stageIndex === 4) {
    for (let i = 0; i < 3; i += 1) {
      const body = add(new THREE.CylinderGeometry(0.48, 0.48, 1.65, 20), shellMaterial, 0);
      body.position.x = (i - 1) * 0.58;
      body.position.z = i === 1 ? 0.12 : -0.08;
      const coil = new THREE.TorusGeometry(0.4, 0.045, 8, 24);
      for (let j = 0; j < 3; j += 1) {
        const ring = add(coil, darkMaterial, -0.42 + j * 0.42);
        ring.position.x = body.position.x;
      }
    }
  } else if (stageIndex === 5) {
    add(new THREE.CylinderGeometry(0.8, 0.62, 1.5, 24), glassMaterial, 0);
    add(new THREE.CylinderGeometry(0.88, 0.7, 0.13, 24), shellMaterial, 0.78);
    add(new THREE.CylinderGeometry(0.88, 0.7, 0.13, 24), shellMaterial, -0.78);
    const shaft = add(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 12), darkMaterial, 0);
    shaft.rotation.z = Math.PI / 2;
  } else if (stageIndex === 6) {
    add(new THREE.CylinderGeometry(0.72, 0.72, 1.3, 24), shellMaterial, 0);
    const bowl = add(new THREE.CylinderGeometry(0.48, 0.48, 0.5, 24), darkMaterial, 0.12);
    bowl.scale.z = 0.8;
    add(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 12), darkMaterial, 0.15).rotation.z = Math.PI / 2;
    add(new THREE.TorusGeometry(0.74, 0.06, 10, 28), shellMaterial, 0.5);
  } else {
    add(new THREE.BoxGeometry(1.5, 1.45, 1.15), shellMaterial, 0);
    add(new THREE.BoxGeometry(1.15, 0.86, 0.84), glassMaterial, 0.08);
    add(new THREE.CylinderGeometry(0.12, 0.12, 1.45, 12), darkMaterial, 0).rotation.z = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 12), shellMaterial, 0.78);
  }

  const foot = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.16, 1.05), darkMaterial);
  foot.position.y = -0.92;
  group.add(foot);
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
    scene.fog = new THREE.Fog(0x050d11, 15, 34);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 6.5, 15.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xaed7dd, 0x081014, 1.8));
    const key = new THREE.DirectionalLight(0xe8fbff, 3.2);
    key.position.set(-5, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new THREE.PointLight(0x4fb8c4, 18, 18, 2);
    rim.position.set(0, 4, 4);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 18),
      new THREE.MeshStandardMaterial({ color: 0x101c21, roughness: 0.82, metalness: 0.12 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x2a4a50, 0x183036);
    grid.position.y = -0.985;
    scene.add(grid);

    const group = new THREE.Group();
    const spacing = 2.8;
    const equipment: THREE.Group[] = [];
    const flowMarkers: THREE.Mesh[] = [];
    const pipes: THREE.Mesh[] = [];
    const processY = 0;

    visualizationModel.stages.forEach((stage, index) => {
      const body = makeEquipment(index, index === 0);
      body.position.set((index - 3.5) * spacing, processY, 0);
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
      addLabelSprite(scene, stage.name, new THREE.Vector3((index - 3.5) * spacing, 1.65, 0));

      if (index < visualizationModel.stages.length - 1) {
        const pipeLength = spacing - 1.55;
        const pipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, pipeLength, 16),
          new THREE.MeshStandardMaterial({ color: 0x9fbcc0, metalness: 0.8, roughness: 0.24 }),
        );
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set((index - 3) * spacing, 0.18, 0);
        pipe.castShadow = true;
        pipes.push(pipe);
        group.add(pipe);

        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 14, 14),
          new THREE.MeshStandardMaterial({ color: 0xd9fff3, emissive: 0x2a8d75, emissiveIntensity: 2.4 }),
        );
        marker.position.set((index - 3) * spacing - pipeLength / 2, 0.18, 0);
        flowMarkers.push(marker);
        group.add(marker);
      }
    });

    const headerPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x9fbcc0, metalness: 0.8, roughness: 0.24 }),
    );
    headerPipe.rotation.z = Math.PI / 2;
    headerPipe.position.set(-11.0, 0.18, 0);
    group.add(headerPipe);

    const outletPipe = headerPipe.clone();
    outletPipe.position.x = 11.0;
    group.add(outletPipe);
    scene.add(group);

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 260;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = Math.random() * 8 - 0.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0x9bc9cd, size: 0.035, transparent: true, opacity: 0.32 }),
    );
    scene.add(particles);

    const resize = () => {
      const width = mount.clientWidth;
      const height = Math.max(500, Math.min(680, width * 0.5));
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
      group.rotation.y = Math.sin(elapsed * 0.12) * 0.035;
      particles.rotation.y = elapsed * 0.008;

      equipment.forEach((body, index) => {
        const isActive = index === currentStageIndex;
        body.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const material = child.material;
          if (!(material instanceof THREE.MeshStandardMaterial)) return;
          material.emissive.setHex(isActive ? 0x1b6470 : 0x000000);
          material.emissiveIntensity = isActive ? 1.15 + Math.sin(elapsed * 4) * 0.25 : 0;
        });
        body.scale.y = isActive ? 1.03 + Math.sin(elapsed * 2.8) * 0.015 : 1;
      });

      flowMarkers.forEach((marker, index) => {
        const stage = visualizationModel.stages[index];
        const output = stage.outputStreams[0];
        const massFactor = output ? Math.min(output.massFlowKgPerHour / 1000, 1.5) : 0.5;
        const phase = (elapsed * (0.3 + massFactor * 0.22) + index * 0.17) % 1;
        const pipeLength = spacing - 1.55;
        marker.position.x = (index - 3) * spacing - pipeLength / 2 + phase * pipeLength;
        marker.position.y = 0.18 + Math.sin(elapsed * 4 + index) * 0.045;
        marker.scale.setScalar(1 + Math.sin(elapsed * 6 + index) * 0.12);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
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
          object.userData.labelMaterial?.dispose();
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
    }, 3500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section style={{ padding: "0 28px 36px" }}>
      <div className="process-shell">
        <div ref={mountRef} className="process-canvas" />
        {activeStage && (
          <aside className="process-panel">
            <div className="process-kicker">LIVE PROCESS · {activeStageIndex + 1}/{visualizationModel.stages.length}</div>
            <h2>{activeStage.name}</h2>
            <p>{activeStage.description}</p>
            <div className="process-data">
              <span>Equipment</span><strong>{activeStage.equipmentId}</strong>
              <span>Input</span><strong>{activeStage.inputStreams.map((stream) => `${stream.id} · ${formatMass(stream.massFlowKgPerHour)}`).join(", ") || "—"}</strong>
              <span>Output</span><strong>{activeStage.outputStreams.map((stream) => `${stream.id} · ${formatMass(stream.massFlowKgPerHour)}`).join(", ") || "—"}</strong>
            </div>
          </aside>
        )}
        <div className="process-status">
          <span className="status-dot" /> Deterministic simulation · live visualization
        </div>
      </div>
      <p style={{ margin: "12px 0 0", opacity: 0.6, fontSize: 13 }}>
        Procedural equipment, animated material flow, lighting and stage state are generated from the process model — no external 3D assets.
      </p>
    </section>
  );
}
