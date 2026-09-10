"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const visualizationModel = buildSugarcaneVisualizationModel();

function formatMass(value: number) {
  return `${value.toFixed(1)} kg/h`;
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
    scene.background = new THREE.Color(0x071014);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 7, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.7);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 8, 6);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 10),
      new THREE.MeshStandardMaterial({ color: 0x152329, roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    scene.add(floor);

    const group = new THREE.Group();
    const spacing = 2.8;
    const equipment: THREE.Mesh[] = [];
    const flowMarkers: THREE.Mesh[] = [];

    visualizationModel.stages.forEach((stage, index) => {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 1.6, 1.3),
        new THREE.MeshStandardMaterial({
          color: 0x5f7479,
          roughness: 0.7,
          emissive: 0x000000,
        }),
      );
      body.position.set((index - 3.5) * spacing, 0, 0);
      body.userData.stepId = stage.stepId;
      body.userData.stageIndex = index;
      equipment.push(body);
      group.add(body);

      if (index < visualizationModel.stages.length - 1) {
        const pipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, spacing - 1.65, 16),
          new THREE.MeshStandardMaterial({ color: 0xb3c8cc, roughness: 0.55 }),
        );
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set((index - 3) * spacing, 0.25, 0);
        group.add(pipe);

        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.17, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xd8f3dc, emissive: 0x23412b }),
        );
        marker.position.set((index - 3) * spacing - (spacing - 1.65) / 2, 0.25, 0);
        flowMarkers.push(marker);
        group.add(marker);
      }
    });
    scene.add(group);

    const resize = () => {
      const width = mount.clientWidth;
      const height = Math.max(420, Math.min(620, width * 0.48));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentStageIndex = activeStageIndexRef.current;
      group.rotation.y = Math.sin(elapsed * 0.12) * 0.08;

      equipment.forEach((body, index) => {
        const material = body.material as THREE.MeshStandardMaterial;
        const isActive = index === currentStageIndex;
        material.emissive.setHex(isActive ? 0x1f5b63 : 0x000000);
        material.emissiveIntensity = isActive ? 0.9 : 0;
      });

      flowMarkers.forEach((marker, index) => {
        const stage = visualizationModel.stages[index];
        const output = stage.outputStreams[0];
        const massFactor = output ? Math.min(output.massFlowKgPerHour / 1000, 1.5) : 0.5;
        const phase = (elapsed * (0.35 + massFactor * 0.25) + index * 0.17) % 1;
        marker.position.x = (index - 3) * spacing - (spacing - 1.65) / 2 + phase * (spacing - 1.65);
        marker.position.y = 0.25 + Math.sin(elapsed * 3 + index) * 0.025;
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
      });
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
    <section style={{ padding: "0 28px 32px" }}>
      <div style={{ position: "relative" }}>
        <div ref={mountRef} style={{ width: "100%", minHeight: 420, overflow: "hidden", borderRadius: 16 }} />
        {activeStage && (
          <aside
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              width: "min(320px, calc(100% - 32px))",
              padding: 16,
              borderRadius: 14,
              background: "rgba(7, 16, 20, 0.88)",
              border: "1px solid rgba(179, 200, 204, 0.22)",
              backdropFilter: "blur(8px)",
              color: "#e7f0f2",
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.6 }}>
              Active process stage {activeStageIndex + 1}/{visualizationModel.stages.length}
            </div>
            <h2 style={{ margin: "7px 0 4px", fontSize: 21 }}>{activeStage.name}</h2>
            <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.5, opacity: 0.75 }}>
              {activeStage.description}
            </p>
            <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <div>Equipment: {activeStage.equipmentId}</div>
              <div>
                Input: {activeStage.inputStreams.map((stream) => `${stream.id} · ${formatMass(stream.massFlowKgPerHour)}`).join(", ") || "—"}
              </div>
              <div>
                Output: {activeStage.outputStreams.map((stream) => `${stream.id} · ${formatMass(stream.massFlowKgPerHour)}`).join(", ") || "—"}
              </div>
            </div>
          </aside>
        )}
      </div>
      <p style={{ margin: "12px 0 0", opacity: 0.65, fontSize: 13 }}>
        The viewport is driven by the deterministic process model: stage state feeds the equipment view and material-flow markers.
      </p>
    </section>
  );
}
