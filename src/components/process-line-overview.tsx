"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const stages = [
  ["PREPARATION", "Feed conditioning"],
  ["SHREDDING", "Structure opening"],
  ["EXTRACTION", "Juice + fiber"],
  ["CLARIFICATION", "Suspended solids"],
  ["EVAPORATION", "Water removal"],
  ["CRYSTALLIZATION", "Crystal growth"],
  ["CENTRIFUGATION", "Phase separation"],
  ["DRYING", "Final moisture removal"],
] as const;

function material(color: number, metalness = 0.45, roughness = 0.42) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function box(g: THREE.Group, size: [number, number, number], position: [number, number, number], mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function cylinder(g: THREE.Group, radius: number, height: number, position: [number, number, number], mat: THREE.Material, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function pipe(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, color = 0x5a9990, radius = 0.055) {
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 12), material(color, 0.72, 0.3));
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function supportFrame(g: THREE.Group, x: number, width: number, height: number, mat: THREE.Material) {
  for (const z of [-0.72, 0.72]) {
    box(g, [0.09, height, 0.09], [x - width / 2, height / 2 - 1.2, z], mat);
    box(g, [0.09, height, 0.09], [x + width / 2, height / 2 - 1.2, z], mat);
  }
  box(g, [width + 0.18, 0.08, 1.62], [x, height - 1.2, 0], mat);
}

function buildLine(animated: THREE.Object3D[]) {
  const root = new THREE.Group();
  const steel = material(0x71898d, 0.82, 0.28);
  const steelDark = material(0x263b40, 0.78, 0.3);
  const dark = material(0x101f24, 0.72, 0.34);
  const copper = material(0x9a704b, 0.7, 0.34);
  const cane = material(0xb18a54, 0.05, 0.82);
  const crystal = material(0xf1dda0, 0.05, 0.24);
  const juice = new THREE.MeshStandardMaterial({ color: 0x48c28d, transparent: true, opacity: 0.74, roughness: 0.16, emissive: 0x123d2d, emissiveIntensity: 0.4 });
  const vapor = new THREE.MeshStandardMaterial({ color: 0xc4eeeb, transparent: true, opacity: 0.28, emissive: 0x5baaa5, emissiveIntensity: 0.9 });

  const xs = stages.map((_, i) => -8.4 + i * 2.4);
  const y = -0.05;

  // Factory floor, safety lanes and equipment foundations.
  box(root, [20.5, 0.18, 4.8], [0, -1.3, 0], dark);
  for (let i = 0; i < 9; i++) box(root, [1.7, 0.025, 0.035], [-9.5 + i * 2.4, -1.19, -1.72], material(0xb8a65c, 0.05, 0.65));
  for (const x of xs) box(root, [1.75, 0.12, 1.95], [x, -1.19, 0], steelDark);

  // Overhead utility rack gives the line a real spatial hierarchy.
  box(root, [20, 0.12, 0.12], [0, 3.0, -0.85], steelDark);
  box(root, [20, 0.08, 0.08], [0, 2.78, -0.85], steel);
  for (const x of xs) box(root, [0.08, 4.25, 0.08], [x, 0.85, -0.85], steelDark);

  // Main process spine: the material visibly travels from unit to unit.
  for (let i = 0; i < xs.length - 1; i++) {
    pipe(root, new THREE.Vector3(xs[i] + 0.72, y, 0), new THREE.Vector3(xs[i + 1] - 0.72, y, 0), 0x4fc09a, 0.075);
    for (let p = 0; p < 3; p++) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), juice);
      particle.position.set(xs[i] + 0.85 + p * 0.38, y, 0);
      root.add(particle);
      animated.push(particle);
    }
  }

  // 01 Preparation: receiving table, rollers, feed hopper.
  {
    const x = xs[0];
    supportFrame(root, x, 1.55, 1.35, steel);
    box(root, [1.7, 0.16, 1.55], [x, 0.15, 0], steel);
    for (let i = -3; i <= 3; i++) {
      const roller = cylinder(root, 0.18, 1.35, [x + i * 0.2, 0.3, 0], steel, 18);
      roller.rotation.z = Math.PI / 2;
      animated.push(roller);
    }
    box(root, [0.9, 0.8, 1.2], [x - 0.78, 1.1, 0], steelDark);
    for (let i = 0; i < 9; i++) {
      const piece = cylinder(root, 0.065, 0.65, [x - 0.7 + (i % 5) * 0.3, 0.58 + (i % 2) * 0.08, 0.18], cane, 8);
      piece.rotation.z = Math.PI / 2;
      animated.push(piece);
    }
  }

  // 02 Shredding: enclosed drum, drive motor and discharge chute.
  {
    const x = xs[1];
    supportFrame(root, x, 1.5, 2.1, steel);
    const drum = cylinder(root, 0.76, 1.55, [x, 0.65, 0], dark, 32);
    drum.rotation.z = Math.PI / 2;
    animated.push(drum);
    const shaft = cylinder(root, 0.09, 1.9, [x, 0.65, 0], steel, 14);
    shaft.rotation.z = Math.PI / 2;
    animated.push(shaft);
    for (let i = 0; i < 9; i++) {
      const blade = box(root, [0.14, 0.09, 0.52], [x - 0.58 + i * 0.15, 0.68, 0.46], copper);
      blade.rotation.y = i * 0.22;
      animated.push(blade);
    }
    const motor = cylinder(root, 0.32, 0.62, [x, -0.58, 0], steelDark, 20);
    motor.rotation.z = Math.PI / 2;
    animated.push(motor);
  }

  // 03 Extraction: paired rollers and visible juice collection.
  {
    const x = xs[2];
    supportFrame(root, x, 1.65, 2.0, steel);
    for (const z of [-0.38, 0.38]) {
      const roller = cylinder(root, 0.43, 1.48, [x, 0.62, z], steel, 32);
      roller.rotation.z = Math.PI / 2;
      animated.push(roller);
    }
    box(root, [1.75, 0.16, 1.25], [x, -0.72, 0], dark);
    cylinder(root, 0.67, 0.12, [x, -0.58, 0], juice, 28);
    for (let i = 0; i < 12; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), juice);
      drop.position.set(x - 0.45 + (i % 6) * 0.18, -0.28 - (i % 3) * 0.1, 0);
      root.add(drop);
      animated.push(drop);
    }
  }

  // 04 Clarification: tall vessel, feed/outlet pipes and settling zone.
  {
    const x = xs[3];
    supportFrame(root, x, 1.5, 2.75, steel);
    const tank = cylinder(root, 0.7, 2.55, [x, 0.15, 0], steel, 36);
    tank.material = new THREE.MeshStandardMaterial({ color: 0x60787b, metalness: 0.72, roughness: 0.3 });
    const fill = cylinder(root, 0.58, 1.15, [x, -0.5, 0], juice, 28);
    animated.push(fill);
    for (const yy of [-0.25, 0.12, 0.49]) box(root, [1.1, 0.055, 0.12], [x, yy, 0], dark);
    for (let i = 0; i < 18; i++) {
      const solid = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 7), cane);
      solid.position.set(x - 0.45 + (i % 6) * 0.18, -0.85 + (i % 5) * 0.16, 0.12);
      root.add(solid);
      animated.push(solid);
    }
  }

  // 05 Evaporation: three vessels, heating jackets and vapor plume.
  {
    const x = xs[4];
    for (let i = -1; i <= 1; i++) {
      const vx = x + i * 0.48;
      const vessel = cylinder(root, 0.43, 1.95, [vx, 0.22, 0], steel, 28);
      animated.push(vessel);
      for (let j = 0; j < 4; j++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 24), copper);
        ring.position.set(vx, -0.38 + j * 0.28, 0);
        ring.rotation.x = Math.PI / 2;
        root.add(ring);
        animated.push(ring);
      }
    }
    pipe(root, new THREE.Vector3(x - 1.0, 0.2, 0), new THREE.Vector3(x + 1.0, 0.2, 0), 0x53bf91, 0.07);
    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), vapor);
      p.position.set(x - 0.9 + (i % 7) * 0.3, 1.05 + (i % 5) * 0.27, 0);
      root.add(p);
      animated.push(p);
    }
  }

  // 06 Crystallization: jacketed vessel, agitator and visible crystal population.
  {
    const x = xs[5];
    const tank = cylinder(root, 0.74, 2.1, [x, 0.15, 0], steel, 32);
    animated.push(tank);
    const liquid = cylinder(root, 0.62, 1.2, [x, -0.32, 0], juice, 28);
    animated.push(liquid);
    const shaft = cylinder(root, 0.07, 2.7, [x, 0.5, 0], steelDark, 12);
    animated.push(shaft);
    for (const yy of [-0.38, 0.08, 0.54]) {
      const arm = box(root, [1.18, 0.08, 0.1], [x, yy, 0], steel);
      animated.push(arm);
    }
    for (let i = 0; i < 28; i++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), crystal);
      c.position.set(x - 0.48 + (i % 7) * 0.16, -0.68 + Math.floor(i / 7) * 0.17, 0.2 * Math.sin(i));
      root.add(c);
      animated.push(c);
    }
  }

  // 07 Centrifugation: basket, motor housing and liquid discharge.
  {
    const x = xs[6];
    const basket = cylinder(root, 0.78, 1.35, [x, 0.2, 0], steel, 38);
    basket.rotation.z = Math.PI / 2;
    animated.push(basket);
    for (let r = 0.3; r < 0.75; r += 0.17) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 32), copper);
      ring.position.set(x, 0.2, 0);
      ring.rotation.x = Math.PI / 2;
      root.add(ring);
      animated.push(ring);
    }
    const motor = cylinder(root, 0.3, 0.9, [x, -0.72, 0], dark, 22);
    motor.rotation.z = Math.PI / 2;
    animated.push(motor);
    pipe(root, new THREE.Vector3(x + 0.75, 0.15, 0), new THREE.Vector3(x + 1.25, -0.55, 0), 0x65c89b, 0.065);
  }

  // 08 Drying: chamber, air path and finished sugar discharge.
  {
    const x = xs[7];
    box(root, [1.55, 2.15, 1.5], [x, 0.12, 0], dark);
    box(root, [1.25, 1.55, 1.2], [x, 0.12, 0], steelDark);
    for (let i = 0; i < 24; i++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), crystal);
      c.position.set(x - 0.48 + (i % 8) * 0.14, -0.5 + (i % 5) * 0.2, -0.42 + (i % 4) * 0.28);
      root.add(c);
      animated.push(c);
    }
    pipe(root, new THREE.Vector3(x - 1.3, 0.65, 0), new THREE.Vector3(x - 0.78, 0.65, 0), 0xb6e5df, 0.09);
    pipe(root, new THREE.Vector3(x + 0.78, 0.65, 0), new THREE.Vector3(x + 1.35, 0.65, 0), 0xb6e5df, 0.075);
  }

  return root;
}

export default function ProcessLineOverview() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071114);
    scene.fog = new THREE.Fog(0x071114, 13, 31);
    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 60);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xc5dfdd, 0x101d22, 1.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xe2f2ed, 3.2);
    key.position.set(4, 8, 7);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight(0x4abda4, 2.2, 18);
    rim.position.set(0, 2.4, 3.5);
    scene.add(rim);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 9), material(0x0b191e, 0.15, 0.9));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.42;
    floor.receiveShadow = true;
    scene.add(floor);

    const flow: THREE.Object3D[] = [];
    const line = buildLine(flow);
    scene.add(line);

    const targetX = -8.4 + selected * 2.4;
    camera.position.set(targetX * 0.42, 3.5, 17.2);
    camera.lookAt(targetX * 0.38, 0.1, 0);

    const onResize = () => {
      camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    };
    onResize();
    window.addEventListener("resize", onResize);

    const timer = new THREE.Timer();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      timer.update();
      const t = timer.getElapsed();
      line.rotation.y = Math.sin(t * 0.12) * 0.035;
      flow.forEach((object, index) => {
        if (index % 7 === 0) object.rotation.y += 0.014;
        if (index % 11 === 0) object.position.y += Math.sin(t * 1.8 + index) * 0.0012;
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [selected]);

  const selectStage = (index: number) => {
    setSelected(index);
    window.dispatchEvent(new CustomEvent("food-process-stage-select", { detail: index }));
  };

  return (
    <section className="process-line-overview">
      <div className="process-line-heading">
        <div>
          <span>PRODUCTION LINE · FACTORY OVERVIEW</span>
          <h2>See the whole transformation before going inside</h2>
        </div>
        <p>Follow the material path from cane reception to finished sugar. Select a unit to move your viewpoint, understand its role, then enter the equipment for a close inspection.</p>
      </div>
      <div ref={mountRef} className="process-line-canvas" aria-label="Interactive 3D sugar production line" />
      <div className="process-line-stages">
        {stages.map(([name, detail], index) => (
          <button key={name} type="button" className={selected === index ? "process-line-stage active" : "process-line-stage"} onClick={() => selectStage(index)}>
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <span>{name}</span>
            <small>{detail}</small>
          </button>
        ))}
      </div>
      <div className="process-line-selected">
        <span>SELECTED UNIT</span>
        <strong>{stages[selected][0]}</strong>
        <p>{stages[selected][1]} · The production line remains the map; the equipment explorer below is where you inspect the mechanism.</p>
      </div>
    </section>
  );
}
