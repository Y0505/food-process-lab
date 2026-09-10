"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { sugarcaneToSugar } from "@/processes/sugarcane";

export default function ProcessViewport() {
  const mountRef = useRef<HTMLDivElement>(null);

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
    sugarcaneToSugar.steps.forEach((step, index) => {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 1.6, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x5f7479, roughness: 0.7 }),
      );
      body.position.set((index - 3.5) * spacing, 0, 0);
      body.userData.stepId = step.id;
      group.add(body);

      if (index < sugarcaneToSugar.steps.length - 1) {
        const pipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, spacing - 1.65, 16),
          new THREE.MeshStandardMaterial({ color: 0xb3c8cc, roughness: 0.55 }),
        );
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set((index - 3) * spacing, 0.25, 0);
        group.add(pipe);
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
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      group.rotation.y += 0.0015;
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

  return (
    <section style={{ padding: "0 28px 32px" }}>
      <div ref={mountRef} style={{ width: "100%", minHeight: 420, overflow: "hidden", borderRadius: 16 }} />
      <p style={{ margin: "12px 0 0", opacity: 0.65, fontSize: 13 }}>
        Foundation slice: the visible units are generated from the sugarcane process definition. Detailed equipment and simulation come later.
      </p>
    </section>
  );
}
