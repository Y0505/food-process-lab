"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const stages = [
  ["PREPARATION", "Feed"],
  ["SHREDDING", "Size reduction"],
  ["EXTRACTION", "Juice + fiber"],
  ["CLARIFICATION", "Solid removal"],
  ["EVAPORATION", "Concentration"],
  ["CRYSTALLIZATION", "Crystal growth"],
  ["CENTRIFUGATION", "Separation"],
  ["DRYING", "Final moisture removal"],
] as const;

function material(color: number, metalness = 0.55, roughness = 0.4) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function pipe(group: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, color = 0x587d7e) {
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, direction.length(), 10), material(color, 0.7, 0.3));
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  group.add(mesh);
}

function buildLine(flow: THREE.Object3D[]) {
  const root = new THREE.Group();
  const steel = material(0x667d80, 0.85, 0.3);
  const dark = material(0x17272c, 0.7, 0.34);
  const copper = material(0x9b7149, 0.7, 0.34);
  const cane = material(0xa47b4c, 0.05, 0.82);
  const sugar = material(0xe8d89c, 0.05, 0.3);
  const liquid = new THREE.MeshStandardMaterial({ color: 0x49b887, transparent: true, opacity: 0.72, roughness: 0.18, emissive: 0x123b2c, emissiveIntensity: 0.35 });
  const vapor = new THREE.MeshStandardMaterial({ color: 0xb8e7e4, transparent: true, opacity: 0.32, emissive: 0x5aa7a2, emissiveIntensity: 0.8 });

  const xs = stages.map((_, i) => -8.4 + i * 2.4);
  const bases = xs.map((x) => new THREE.Vector3(x, -1.2, 0));

  // Main material path: this is the visual spine of the factory.
  for (let i = 0; i < xs.length - 1; i++) pipe(root, new THREE.Vector3(xs[i] + 0.75, -0.35, 0), new THREE.Vector3(xs[i + 1] - 0.75, -0.35, 0), 0x4b9e86);

  // Preparation: feed table and rollers.
  {
    const x = xs[0];
    for (let i = -2; i <= 2; i++) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.45, 18), steel);
      roller.position.set(x + i * 0.28, -0.72, 0); roller.rotation.z = Math.PI / 2; root.add(roller); flow.push(roller);
    }
    for (let i = 0; i < 7; i++) {
      const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.62, 8), cane);
      piece.position.set(x - 0.62 + i * 0.2, -0.45 + (i % 2) * 0.08, 0.2); piece.rotation.z = Math.PI / 2; root.add(piece); flow.push(piece);
    }
  }

  // Shredder: drum and cutting elements.
  {
    const x = xs[1];
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 1.35, 28), dark);
    drum.position.set(x, -0.05, 0); drum.rotation.z = Math.PI / 2; root.add(drum); flow.push(drum);
    for (let i = 0; i < 7; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.48), copper);
      blade.position.set(x - 0.5 + i * 0.16, 0.08, 0.43); blade.rotation.y = i * 0.18; root.add(blade); flow.push(blade);
    }
  }

  // Extraction: two rollers with juice collection below.
  {
    const x = xs[2];
    for (const z of [-0.38, 0.38]) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.35, 30), steel);
      roller.position.set(x, 0, z); roller.rotation.z = Math.PI / 2; root.add(roller); flow.push(roller);
    }
    const pan = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 1.05), dark); pan.position.set(x, -0.9, 0); root.add(pan);
    for (let i = 0; i < 9; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), liquid);
      drop.position.set(x - 0.45 + (i % 5) * 0.22, -0.65 - (i % 3) * 0.1, 0); root.add(drop); flow.push(drop);
    }
  }

  // Clarifier: tank, baffles, liquid and settling solids.
  {
    const x = xs[3];
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.9, 32), steel); tank.position.set(x, -0.05, 0); root.add(tank);
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.72, 28), liquid); fill.position.set(x, -0.45, 0); root.add(fill); flow.push(fill);
    for (const y of [-0.18, 0.18]) { const baffle = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.08), dark); baffle.position.set(x, y, 0); root.add(baffle); }
  }

  // Evaporator train: three vessels + rising vapor.
  {
    const x = xs[4];
    for (let i = -1; i <= 1; i++) {
      const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 1.55, 24), steel);
      vessel.position.set(x + i * 0.52, -0.05, 0); root.add(vessel); flow.push(vessel);
      const heat = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.035, 8, 22), copper); heat.position.set(x + i * 0.52, -0.42, 0); heat.rotation.x = Math.PI / 2; root.add(heat); flow.push(heat);
    }
    for (let i = 0; i < 10; i++) {
      const v = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), vapor);
      v.position.set(x - 0.6 + (i % 4) * 0.4, 0.6 + (i % 3) * 0.22, 0); root.add(v); flow.push(v);
    }
  }

  // Crystallizer: vessel + agitator + crystal population.
  {
    const x = xs[5];
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 1.85, 32), steel); tank.position.set(x, -0.05, 0); root.add(tank);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.8, 12), dark); shaft.position.set(x, 0.1, 0); root.add(shaft); flow.push(shaft);
    for (let i = 0; i < 18; i++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.055), sugar);
      c.position.set(x - 0.48 + (i % 6) * 0.18, -0.5 + Math.floor(i / 6) * 0.22, 0.2); root.add(c); flow.push(c);
    }
  }

  // Centrifuge: rotating basket and crystal ring.
  {
    const x = xs[6];
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 1.15, 36), steel); basket.position.set(x, -0.05, 0); basket.rotation.z = Math.PI / 2; root.add(basket); flow.push(basket);
    for (let r = 0.3; r < 0.72; r += 0.18) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 28), copper); ring.position.set(x, -0.05, 0); ring.rotation.x = Math.PI / 2; root.add(ring); flow.push(ring);
    }
  }

  // Dryer: chamber with final sugar stream.
  {
    const x = xs[7];
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.7, 1.2), dark); chamber.position.set(x, -0.05, 0); root.add(chamber);
    for (let i = 0; i < 16; i++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), sugar);
      c.position.set(x - 0.58 + (i % 8) * 0.16, -0.45 + (i % 2) * 0.28, 0.2); root.add(c); flow.push(c);
    }
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
    scene.fog = new THREE.Fog(0x071114, 11, 28);
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 60);
    camera.position.set(0, 4.2, 18); camera.lookAt(0, -0.2, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);
    const ambient = new THREE.HemisphereLight(0xbfdad8, 0x132024, 1.7); scene.add(ambient);
    const key = new THREE.DirectionalLight(0xdceee8, 3.2); key.position.set(4, 8, 8); key.castShadow = true; scene.add(key);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshStandardMaterial({ color: 0x0c1b20, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.35; floor.receiveShadow = true; scene.add(floor);
    const flow: THREE.Object3D[] = [];
    const line = buildLine(flow); scene.add(line);
    const onResize = () => { camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight); camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight, false); };
    onResize();
    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      line.rotation.y = Math.sin(t * 0.12) * 0.055;
      flow.forEach((object, index) => {
        if (index % 5 === 0) object.rotation.y += 0.012;
        if (object.position.y > 0.3) object.position.y += Math.sin(t * 1.5 + index) * 0.0015;
      });
      renderer.render(scene, camera);
    };
    animate();
    return () => { cancelAnimationFrame(frame); renderer.dispose(); mount.removeChild(renderer.domElement); };
  }, []);

  return (
    <section className="process-line-overview">
      <div className="process-line-heading">
        <div><span>PRODUCTION LINE</span><h2>Follow the material from cane to sugar</h2></div>
        <p>The whole factory stays visible here. Then enter any unit below to inspect what happens inside it.</p>
      </div>
      <div ref={mountRef} className="process-line-canvas" aria-label="3D sugar production line" />
      <div className="process-line-stages">
        {stages.map(([name, detail], index) => (
          <button key={name} type="button" className={selected === index ? "process-line-stage active" : "process-line-stage"} onClick={() => setSelected(index)}>
            <strong>{String(index + 1).padStart(2, "0")}</strong><span>{name}</span><small>{detail}</small>
          </button>
        ))}
      </div>
      <div className="process-line-selected"><span>SELECTED UNIT</span><strong>{stages[selected][0]}</strong><p>{stages[selected][1]} · Use the explorer below to enter this equipment and inspect the transformation.</p></div>
    </section>
  );
}
