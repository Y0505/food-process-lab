"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Stage = {
  id: string;
  no: string;
  name: string;
  input: string;
  output: string;
  x: number;
  color: number;
};

const STAGES: Stage[] = [
  { id: "preparation", no: "01", name: "Cane Preparation", input: "Whole cane", output: "Prepared billets", x: -14, color: 0x9eaf5b },
  { id: "shredding", no: "02", name: "Shredding", input: "Billets", output: "Opened fiber", x: -10, color: 0xb9a56b },
  { id: "extraction", no: "03", name: "Juice Extraction", input: "Shredded cane", output: "Juice + bagasse", x: -6, color: 0x8c6834 },
  { id: "clarification", no: "04", name: "Juice Clarification", input: "Raw juice", output: "Clarified juice", x: -2, color: 0x72b8bd },
  { id: "evaporation", no: "05", name: "Evaporation", input: "Clarified juice", output: "Syrup", x: 2, color: 0x75471f },
  { id: "crystallization", no: "06", name: "Crystallization", input: "Syrup", output: "Massecuite", x: 6, color: 0xb58b49 },
  { id: "centrifugation", no: "07", name: "Centrifugation", input: "Massecuite", output: "Sugar + molasses", x: 10, color: 0xf1dca0 },
  { id: "drying", no: "08", name: "Sugar Drying", input: "Wet sugar", output: "Dry sugar", x: 14, color: 0xc7d1cf },
];

function material(color: number, metalness = 0.72, roughness = 0.3) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function addMachine(scene: THREE.Scene, stage: Stage) {
  const group = new THREE.Group();
  group.position.set(stage.x, 0, 0);
  group.userData.stageId = stage.id;

  const body = material(0x182326, 0.65, 0.42);
  const steel = material(0x65767a, 0.82, 0.27);
  const accent = material(stage.color, 0.18, 0.58);

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 2.6), body);
  base.position.y = 0.1;
  group.add(base);

  for (const x of [-1.45, 1.45]) {
    for (const z of [-0.85, 0.85]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.8, 0.12), steel);
      leg.position.set(x, 1.9, z);
      group.add(leg);
    }
  }

  if (stage.id === "extraction") {
    for (let i = -1; i <= 1; i++) {
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.7, 32), steel);
      roll.rotation.z = Math.PI / 2;
      roll.position.set(i * 0.78, 2.0, 0);
      group.add(roll);
    }
    const juice = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.32, 1.5), accent);
    juice.position.y = 0.72;
    group.add(juice);
  } else if (stage.id === "shredding") {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.3, 1.7), body);
    housing.position.y = 2;
    group.add(housing);
    for (let i = -2; i <= 2; i++) {
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.45, 24), accent);
      rotor.rotation.z = Math.PI / 2;
      rotor.position.set(i * 0.42, 2, 0);
      group.add(rotor);
    }
  } else if (stage.id === "preparation") {
    const conveyor = new THREE.Mesh(new THREE.BoxGeometry(3, 0.28, 1.45), body);
    conveyor.position.y = 1;
    group.add(conveyor);
    for (let i = -5; i <= 5; i++) {
      const cane = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 1.05), accent);
      cane.position.set(i * 0.25, 1.25, 0);
      group.add(cane);
    }
  } else if (stage.id === "clarification") {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3.1, 40), new THREE.MeshPhysicalMaterial({ color: 0x72b8bd, transparent: true, opacity: 0.34, transmission: 0.35, roughness: 0.2 }));
    tank.position.y = 2;
    group.add(tank);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.65, 40), accent);
    liquid.position.y = 1.1;
    group.add(liquid);
  } else if (stage.id === "evaporation") {
    for (let i = -1; i <= 1; i++) {
      const bodyPart = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 32), steel);
      bodyPart.position.set(i * 1.05, 2, 0);
      group.add(bodyPart);
      const syrup = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.22, 32), accent);
      syrup.position.set(i * 1.05, 0.95, 0);
      group.add(syrup);
    }
  } else if (stage.id === "crystallization") {
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 3, 36), steel);
    vessel.position.y = 2;
    group.add(vessel);
    const massecuite = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.04, 0.65, 36), accent);
    massecuite.position.y = 1;
    group.add(massecuite);
  } else if (stage.id === "centrifugation") {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 2.7, 36), body);
    shell.position.y = 2;
    group.add(shell);
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.9, 36), accent);
    basket.position.y = 2;
    group.add(basket);
  } else {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 3, 36), steel);
    drum.rotation.z = Math.PI / 2;
    drum.position.y = 2;
    group.add(drum);
    const sugar = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.9), accent);
    sugar.position.y = 1.25;
    group.add(sugar);
  }

  scene.add(group);
  return group;
}

export function ImmersiveSugarPlant() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Stage>(STAGES[2]);
  const [inside, setInside] = useState(false);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let animation = 0;
    let disposed = false;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(host.clientWidth || 900, host.clientHeight || 620, false);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.touchAction = "none";
      renderer.domElement.setAttribute("aria-label", "3D sugar factory visualization");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x02080b);
      scene.fog = new THREE.Fog(0x02080b, 24, 60);

      const camera = new THREE.PerspectiveCamera(45, (host.clientWidth || 900) / (host.clientHeight || 620), 0.1, 120);
      camera.position.set(0, 11, 31);

      scene.add(new THREE.HemisphereLight(0xb9d9d8, 0x101719, 2.1));
      const key = new THREE.DirectionalLight(0xffffff, 3.2);
      key.position.set(8, 18, 14);
      scene.add(key);
      const fill = new THREE.PointLight(0x69d4c0, 18, 45);
      fill.position.set(0, 8, 8);
      scene.add(fill);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 22), new THREE.MeshStandardMaterial({ color: 0x071114, metalness: 0.35, roughness: 0.55 }));
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);

      const machines = STAGES.map((stage) => addMachine(scene, stage));
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      const onPointerDown = (event: PointerEvent) => {
        if (!renderer) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(machines, true)[0];
        if (!hit) return;
        let node: THREE.Object3D | null = hit.object;
        while (node && !node.userData.stageId) node = node.parent;
        const id = node?.userData.stageId;
        const stage = STAGES.find((item) => item.id === id);
        if (stage) {
          setSelected(stage);
          setInside(false);
        }
      };

      renderer.domElement.addEventListener("pointerdown", onPointerDown);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 2, 0);
      controls.minDistance = 12;
      controls.maxDistance = 45;
      controls.maxPolarAngle = Math.PI * 0.47;

      const resize = () => {
        if (!renderer || disposed) return;
        const width = host.clientWidth || 900;
        const height = host.clientHeight || 620;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", resize);

      const tick = () => {
        if (disposed || !renderer) return;
        controls?.update();
        renderer.render(scene, camera);
        animation = window.requestAnimationFrame(tick);
      };
      tick();

      return () => {
        disposed = true;
        window.cancelAnimationFrame(animation);
        window.removeEventListener("resize", resize);
        renderer?.domElement.removeEventListener("pointerdown", onPointerDown);
        controls?.dispose();
        scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else if (mesh.material) mesh.material.dispose();
        });
        renderer?.dispose();
        if (renderer?.domElement.parentElement === host) host.removeChild(renderer.domElement);
      };
    } catch (error) {
      console.error("FoodProcessLab WebGL initialization failed", error);
      setWebglError(true);
      if (renderer?.domElement.parentElement === host) host.removeChild(renderer.domElement);
      renderer?.dispose();
      return () => undefined;
    }
  }, []);

  const choose = (stage: Stage) => {
    setSelected(stage);
    setInside(false);
  };

  return (
    <section style={{ position: "relative", height: 620, overflow: "hidden", borderRadius: 24, border: "1px solid rgba(157,202,201,.14)", background: "#02080b", isolation: "isolate" }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0, zIndex: 0, background: "linear-gradient(180deg,#071216,#02080b)" }} />

      <div style={{ position: "absolute", zIndex: 30, top: 18, left: 18, width: 270, padding: 16, borderRadius: 16, background: "rgba(4,12,15,.94)", border: "1px solid rgba(160,215,208,.2)", boxShadow: "0 14px 40px rgba(0,0,0,.4)", pointerEvents: "auto" }}>
        <div style={{ color: "#70d0bd", fontSize: 9, fontWeight: 800, letterSpacing: 2 }}>PROCESS UNITS</div>
        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          {STAGES.map((stage) => (
            <button key={stage.id} type="button" onClick={() => choose(stage)} style={{ appearance: "none", width: "100%", padding: "9px 10px", borderRadius: 9, border: `1px solid ${selected.id === stage.id ? "rgba(112,208,189,.55)" : "rgba(255,255,255,.08)"}`, background: selected.id === stage.id ? "rgba(112,208,189,.13)" : "rgba(255,255,255,.035)", color: selected.id === stage.id ? "#effffc" : "rgba(235,245,244,.65)", cursor: "pointer", textAlign: "left", fontSize: 10 }}>
              <span style={{ display: "inline-block", width: 24, color: "#70d0bd", fontSize: 8 }}>{stage.no}</span>{stage.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", zIndex: 30, top: 18, right: 18, width: 285, padding: 18, borderRadius: 16, background: "rgba(4,12,15,.94)", border: "1px solid rgba(160,215,208,.2)", boxShadow: "0 14px 40px rgba(0,0,0,.4)", pointerEvents: "auto" }}>
        <div style={{ color: "#70d0bd", fontSize: 9, fontWeight: 800, letterSpacing: 1.6 }}>{selected.no} · {inside ? "CUTAWAY" : "SELECTED UNIT"}</div>
        <h2 style={{ margin: "8px 0 12px", fontSize: 19, lineHeight: 1.15 }}>{selected.name}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: "7px 8px", fontSize: 10 }}>
          <span style={{ color: "rgba(235,245,244,.4)" }}>IN</span><strong style={{ fontWeight: 500 }}>{selected.input}</strong>
          <span style={{ color: "rgba(235,245,244,.4)" }}>OUT</span><strong style={{ fontWeight: 500 }}>{selected.output}</strong>
        </div>
        <button type="button" onClick={() => setInside((value) => !value)} style={{ marginTop: 16, width: "100%", padding: "11px 12px", border: 0, borderRadius: 10, background: "#70d0bd", color: "#061011", cursor: "pointer", fontWeight: 800, fontSize: 10, letterSpacing: 0.7 }}>
          {inside ? "← RETURN TO FACTORY" : "ENTER CUTAWAY →"}
        </button>
        {webglError && <div style={{ marginTop: 10, color: "#e7c98d", fontSize: 9, lineHeight: 1.45 }}>3D rendering is unavailable in this browser. The process controls remain available.</div>}
      </div>

      {inside && (
        <div style={{ position: "absolute", zIndex: 20, left: "50%", bottom: 28, transform: "translateX(-50%)", padding: "9px 13px", borderRadius: 999, background: "rgba(4,12,15,.88)", border: "1px solid rgba(112,208,189,.2)", color: "rgba(235,245,244,.7)", fontSize: 9, pointerEvents: "none" }}>
          INTERNAL VIEW · {selected.name}
        </div>
      )}
    </section>
  );
}
