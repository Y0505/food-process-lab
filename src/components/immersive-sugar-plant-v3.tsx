"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { getEquipmentInspection, type InspectionVisualKind } from "@/domain/equipment-inspection";

const stages = [
  ["preparation", "01", "Cane Preparation", "Whole sugarcane", "Prepared billets"],
  ["shredding", "02", "Shredding", "Prepared billets", "Opened fiber"],
  ["extraction", "03", "Juice Extraction", "Shredded cane", "Juice + bagasse"],
  ["clarification", "04", "Juice Clarification", "Raw juice", "Clarified juice"],
  ["evaporation", "05", "Evaporation", "Clarified juice", "Concentrated syrup"],
  ["crystallization", "06", "Crystallization", "Syrup", "Massecuite"],
  ["centrifugation", "07", "Centrifugation", "Massecuite", "Sugar + molasses"],
  ["drying", "08", "Sugar Drying", "Wet sugar", "Dry sugar"],
] as const;
type StageId = (typeof stages)[number][0];

type Palette = Record<string, THREE.Material>;
function makePalette(): Palette {
  return {
    steel: new THREE.MeshStandardMaterial({ color: 0x7d898b, metalness: 0.93, roughness: 0.23 }),
    bright: new THREE.MeshStandardMaterial({ color: 0xcbd1cf, metalness: 0.97, roughness: 0.16 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x151e20, metalness: 0.82, roughness: 0.3 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x354447, metalness: 0.76, roughness: 0.32 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb47c43, metalness: 0.82, roughness: 0.25 }),
    cane: new THREE.MeshStandardMaterial({ color: 0x9baa50, roughness: 0.76 }),
    fiber: new THREE.MeshStandardMaterial({ color: 0x8d6641, roughness: 0.92 }),
    juice: new THREE.MeshPhysicalMaterial({ color: 0x76a93b, roughness: 0.2, transmission: 0.08, transparent: true, opacity: 0.9 }),
    syrup: new THREE.MeshPhysicalMaterial({ color: 0x754321, roughness: 0.24, transmission: 0.02, transparent: true, opacity: 0.94 }),
    sugar: new THREE.MeshStandardMaterial({ color: 0xf0dfae, roughness: 0.38 }),
    liquor: new THREE.MeshStandardMaterial({ color: 0x2c1b14, roughness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x8fd3c7, transmission: 0.74, roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    steam: new THREE.MeshBasicMaterial({ color: 0xe9f5f2, transparent: true, opacity: 0.16, depthWrite: false }),
  };
}

function mesh(g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, p: [number, number, number] = [0, 0, 0]) {
  const o = new THREE.Mesh(geo, mat); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function box(g: THREE.Object3D, s: [number, number, number], p: [number, number, number], m: THREE.Material) { return mesh(g, new THREE.BoxGeometry(...s), m, p); }
function cyl(g: THREE.Object3D, r: number, h: number, p: [number, number, number], m: THREE.Material, n = 32) { return mesh(g, new THREE.CylinderGeometry(r, r, h, n), m, p); }
function torus(g: THREE.Object3D, r: number, tube: number, p: [number, number, number], m: THREE.Material, rot: [number, number, number] = [0, 0, 0]) { const o = mesh(g, new THREE.TorusGeometry(r, tube, 10, 48), m, p); o.rotation.set(...rot); return o; }
function sphere(g: THREE.Object3D, r: number, p: [number, number, number], m: THREE.Material) { return mesh(g, new THREE.SphereGeometry(r, 14, 10), m, p); }
function pipe(g: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) { const d = b.clone().sub(a); const o = mesh(g, new THREE.CylinderGeometry(r, r, d.length(), 18), m); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o; }
function bolts(g: THREE.Object3D, p: [number, number, number], count = 8, spread = 0.7, m?: THREE.Material) { for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count; sphere(g, 0.028, [p[0] + Math.cos(a) * spread, p[1], p[2] + Math.sin(a) * spread], m ?? makePalette().bright); } }

function factoryMachine(id: StageId, p: Palette) {
  const g = new THREE.Group();
  box(g, [3.6, 0.18, 2.55], [0, -1.25, 0], p.dark);
  box(g, [3.2, 0.18, 2.2], [0, -1.12, 0], p.frame);
  const body = box(g, [2.6, 1.35, 1.75], [0, -0.05, 0], p.steel);
  if (id === "preparation") {
    box(g, [2.15, 0.18, 1.4], [0, 0.72, 0], p.bright);
    for (let i = 0; i < 9; i++) { const c = cyl(g, .07, .85, [-1.15 + i * .27, .88, -.45 + (i % 3) * .45], p.cane, 12); c.rotation.z = Math.PI / 2; }
    const wheel = cyl(g, .65, .16, [.55, -.05, 0], p.bright, 40); wheel.rotation.x = Math.PI / 2; for (let i = 0; i < 8; i++) { const b = box(g, [.62,.06,.08],[.78,-.05,0],p.dark); b.rotation.z=i*Math.PI/4; }
  } else if (id === "shredding") {
    box(g, [2.15, .18, 1.5], [0, .86, 0], p.bright);
    const rotor = new THREE.Group(); rotor.rotation.z = Math.PI / 2; g.add(rotor); cyl(rotor, .1, 1.75, [0,0,0], p.brass, 18); for(let i=0;i<12;i++){const t=box(rotor,[.78,.08,.11],[.2,0,0],p.bright);t.rotation.z=i*Math.PI/6;}
    for(let i=0;i<18;i++) sphere(g,.045,[-.8+(i%6)*.27,-.8,-.5+(i%5)*.25],p.fiber);
  } else if (id === "extraction") {
    body.material = p.dark;
    for (const y of [-.48,0,.48]) { const r=cyl(g,.46,1.9,[0,y,0],p.steel,48); r.rotation.x=Math.PI/2; torus(g,.42,.025,[0,y,0],p.bright,[Math.PI/2,0,0]); }
    pipe(g,new THREE.Vector3(-1.65,.45,0),new THREE.Vector3(-.65,.45,0),.11,p.cane); pipe(g,new THREE.Vector3(.55,-.82,0),new THREE.Vector3(1.55,-.82,0),.09,p.juice);
  } else if (id === "clarification") {
    cyl(g,1.02,2.2,[0,.02,0],p.glass,56); cyl(g,.84,.75,[0,-.48,0],p.juice,48); cyl(g,.82,.2,[0,-.94,0],p.liquor,48); cyl(g,.05,1.9,[0,.42,0],p.brass,16); torus(g,1.02,.05,[0,1.1,0],p.bright); torus(g,1.02,.05,[0,-1.08,0],p.bright);
  } else if (id === "evaporation") {
    for(const x of [-.75,0,.75]) { cyl(g,.57,2.25,[x,.02,0],p.glass,48); cyl(g,.46,.92,[x,-.5,0],p.syrup,40); for(let j=0;j<4;j++) torus(g,.38,.025,[x,-.72+j*.22,0],p.brass); }
  } else if (id === "crystallization") {
    cyl(g,1.0,1.85,[0,0,0],p.steel,52); cyl(g,.84,.9,[0,-.45,0],p.syrup,44); cyl(g,.05,1.8,[0,.6,0],p.brass,16); for(let i=0;i<28;i++) sphere(g,.04,[Math.sin(i*2)*.68,-.15+(i%8)*.08,Math.cos(i*1.6)*.68],p.sugar);
  } else if (id === "centrifugation") {
    box(g,[2.4,1.65,1.95],[0,0,0],p.frame); box(g,[2.05,1.35,1.65],[0,.05,0],p.dark); const b=cyl(g,.76,1.35,[0,0,0],p.bright,48); b.rotation.x=Math.PI/2; for(let i=0;i<22;i++) sphere(g,.035,[Math.cos(i)*.62,Math.sin(i*1.7)*.55,.1],p.sugar);
  } else {
    const d=cyl(g,.76,2.25,[0,0,0],p.bright,48); d.rotation.z=Math.PI/2; for(let i=0;i<7;i++) torus(g,.79,.035,[-.9+i*.3,0,0],p.dark,[0,Math.PI/2,0]); for(let i=0;i<24;i++) sphere(g,.04,[-.8+(i%8)*.2,-.35+(i%4)*.2,.05],p.sugar);
  }
  bolts(g,[0,.95,0],8,.75,p.bright);
  return g;
}

function inspectionMachine(kind: InspectionVisualKind, p: Palette) {
  const g = new THREE.Group();
  box(g,[7,.18,5.2],[0,-2.35,0],p.dark);
  box(g,[6.7,.18,4.9],[0,-2.18,0],p.frame);
  const plate = box(g,[5.8,.08,.08],[0,2.25,-2.35],p.brass); plate.name="inspection-label";
  if (kind === "cutting") {
    box(g,[4.9,2.2,3.0],[0,.15,0],p.dark); const wheel=cyl(g,1.2,.35,[0,.1,0],p.bright,48); wheel.rotation.x=Math.PI/2; for(let i=0;i<10;i++){const b=box(g,[1.1,.09,.13],[.35,.1,0],p.brass);b.rotation.z=i*Math.PI/5;}
    for(let i=0;i<14;i++){const c=cyl(g,.09,.8,[-2.7+i*.4,1.5,-1.2+(i%3)*.7],p.cane,12);c.rotation.z=Math.PI/2;}
  } else if (kind === "shredding") {
    box(g,[5.2,2.5,3.3],[0,.1,0],p.dark); const rotor=new THREE.Group();rotor.rotation.z=Math.PI/2;g.add(rotor);cyl(rotor,.14,3,[0,0,0],p.brass,20);for(let i=0;i<18;i++){const t=box(rotor,[1.35,.12,.16],[.35,0,0],p.bright);t.rotation.z=i*Math.PI/9;} for(let i=0;i<55;i++)sphere(g,.055,[-2.3+(i%11)*.43,-1.2+(i%6)*.32,-1.1+(i%5)*.5],p.fiber);
  } else if (kind === "pressing") {
    for(const y of [-.72,0,.72]){const r=cyl(g,.68,3.5,[0,y,0],p.bright,64);r.rotation.x=Math.PI/2;torus(g,.6,.035,[0,y,0],p.dark,[Math.PI/2,0,0]);} pipe(g,new THREE.Vector3(-3,1,0),new THREE.Vector3(-1.7,1,0),.2,p.cane); pipe(g,new THREE.Vector3(1.3,-1.2,0),new THREE.Vector3(3,-1.2,0),.18,p.juice); for(let i=0;i<35;i++)sphere(g,.05,[-1.6+(i%9)*.38,-1.7+(i%4)*.18,-.8+(i%5)*.4],p.fiber);
  } else if (kind === "settling") {
    cyl(g,2.0,4.0,[0,0,0],p.glass,64); cyl(g,1.7,1.15,[0,-.8,0],p.juice,56); cyl(g,1.65,.35,[0,-1.55,0],p.fiber,56); cyl(g,.07,3.3,[0,.3,0],p.brass,16); for(const y of [-.75,-1.1]){const rake=box(g,[3,.09,.12],[0,y,0],p.bright);rake.rotation.z=y*.6;} pipe(g,new THREE.Vector3(1.7,.5,0),new THREE.Vector3(3,.5,0),.14,p.juice);
  } else if (kind === "evaporation") {
    for(const x of [-1.5,0,1.5]){cyl(g,.9,3.8,[x,0,0],p.glass,56);cyl(g,.7,1.5,[x,-.85,0],p.syrup,48);for(let j=0;j<6;j++)torus(g,.58,.04,[x,-1.2+j*.28,0],p.brass);for(let j=0;j<5;j++)sphere(g,.06,[x+Math.sin(j)*.3,.8+j*.25,Math.cos(j)*.3],p.steam);}
  } else if (kind === "crystallization") {
    cyl(g,2.0,3.6,[0,-.05,0],p.steel,64); cyl(g,1.7,1.55,[0,-.75,0],p.syrup,56); cyl(g,.08,3.4,[0,.45,0],p.brass,18); const imp=new THREE.Group();g.add(imp);for(let i=0;i<6;i++){const arm=box(imp,[1.65,.1,.1],[.7,-.65,0],p.bright);arm.rotation.y=i*Math.PI/3;}for(let i=0;i<75;i++){const c=sphere(g,.05,[Math.sin(i*2.1)*1.35,-.25+(i%10)*.09,Math.cos(i*1.7)*1.35],p.sugar);c.scale.setScalar(.6+(i%4)*.15);}
  } else if (kind === "separation") {
    box(g,[5.2,3.8,3.8],[0,0,0],p.dark); const basket=cyl(g,1.65,2.5,[0,0,0],p.bright,64);basket.rotation.x=Math.PI/2;for(let i=0;i<48;i++){const a=i*Math.PI*2/48;pipe(g,new THREE.Vector3(Math.cos(a)*1.35,-1.2,Math.sin(a)*1.35),new THREE.Vector3(Math.cos(a)*1.35,1.2,Math.sin(a)*1.35),.025,p.dark);}for(let i=0;i<42;i++)sphere(g,.055,[Math.cos(i)*1.25,Math.sin(i*1.8)*.95,.2],p.sugar);pipe(g,new THREE.Vector3(1.6,-1.5,0),new THREE.Vector3(3,-1.5,0),.14,p.liquor);
  } else {
    const drum=new THREE.Group();g.add(drum);const d=cyl(drum,1.65,4.8,[0,0,0],p.bright,64);d.rotation.z=Math.PI/2;for(let i=0;i<9;i++)torus(drum,1.68,.07,[-2+i*.5,0,0],p.dark,[0,Math.PI/2,0]);for(let i=0;i<65;i++)sphere(drum,.055,[-2.1+(i%14)*.3,-.65+(i%6)*.25,.1],p.sugar);pipe(g,new THREE.Vector3(-3,-.2,0),new THREE.Vector3(-2,-.2,0),.18,p.steel);pipe(g,new THREE.Vector3(2,-.2,0),new THREE.Vector3(3,-.2,0),.18,p.steel);
  }
  return g;
}

export function ImmersiveSugarPlant() {
  const mount = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<StageId | null>(null);
  const [inside, setInside] = useState(false);
  const selectedRef = useRef<StageId | null>(null);
  const insideRef = useRef(false);

  useEffect(() => {
    const host = mount.current; if (!host) return;
    const palette = makePalette();
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x061012); scene.fog = new THREE.Fog(0x061012, 20, 48);
    const camera = new THREE.PerspectiveCamera(46, 1, .1, 100); camera.position.set(15,11,18);
    const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"}); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.06; controls.minDistance=3; controls.maxDistance=35;
    scene.add(new THREE.HemisphereLight(0xbad8d2,0x101719,1.6)); const key=new THREE.DirectionalLight(0xfff0d0,3.4);key.position.set(8,15,9);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);const fill=new THREE.PointLight(0x58cbb5,32,24);fill.position.set(0,5,2);scene.add(fill);
    const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.36,.62,.8));composer.addPass(new OutputPass());
    const factory=new THREE.Group();scene.add(factory);box(factory,[36,.25,24],[0,-1.5,0],palette.dark);
    for(let x=-15;x<=15;x+=5){for(const z of [-9,9]){box(factory,[.18,8,.18],[x,2.4,z],palette.frame);box(factory,[.18,8,.18],[x,2.4,0],palette.frame);}}
    box(factory,[34,.18,.18],[0,6.8,-9],palette.frame);box(factory,[34,.18,.18],[0,6.8,9],palette.frame);box(factory,[34,.12,.12],[0,5.9,0],palette.steel);
    const positions:[number,number][]=[[-11,-5],[-4,-5],[3,-5],[10,-5],[-8,4],[-1,4],[6,4],[13,4]];
    const machines=stages.map(([id],i)=>{const m=factoryMachine(id,palette);m.position.set(...positions[i],0);m.userData.stageId=id; m.traverse(o=>o.userData.stageId=id);factory.add(m);return m;});
    for(let i=0;i<positions.length-1;i++){const a=new THREE.Vector3(positions[i][0]+1.7,.3,positions[i][1]);const b=new THREE.Vector3(positions[i+1][0]-1.7,.3,positions[i+1][1]);pipe(factory,a,new THREE.Vector3((a.x+b.x)/2,1.35,a.z),.055,p.steel);pipe(factory,new THREE.Vector3((a.x+b.x)/2,1.35,a.z),new THREE.Vector3((a.x+b.x)/2,1.35,b.z),.055,p.steel);pipe(factory,new THREE.Vector3((a.x+b.x)/2,1.35,b.z),b,.055,p.steel);}
    const flow=Array.from({length:90},(_,i)=>{const o=sphere(factory,.045+(i%3)*.012,[0,0,0],i%3===0?palette.cane:i%3===1?palette.juice:palette.sugar);o.userData.phase=i/90;return o;});
    const inspection=new THREE.Group();inspection.visible=false;scene.add(inspection);
    let targetPos=camera.position.clone(),targetLook=new THREE.Vector3(0,0,0);const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let raf=0;
    const focus=(id:StageId,detail:boolean)=>{const idx=stages.findIndex(s=>s[0]===id);const m=machines[idx];const wp=new THREE.Vector3();m.getWorldPosition(wp);return detail?{p:wp.clone().add(new THREE.Vector3(7,4.5,8)),l:wp}:{p:wp.clone().add(new THREE.Vector3(6,4,7)),l:wp};};
    const select=(e:PointerEvent)=>{if(insideRef.current)return;const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(machines,true).find(h=>typeof h.object.userData.stageId==="string");if(!hit)return;const id=hit.object.userData.stageId as StageId;selectedRef.current=id;setSelected(id);const f=focus(id,false);targetPos=f.p;targetLook=f.l;};
    renderer.domElement.addEventListener("pointerup",select);
    const enter=()=>{const id=selectedRef.current;if(!id)return;const def=getEquipmentInspection(id);if(!def)return;inspection.clear();inspection.add(inspectionMachine(def.visualKind,palette));inspection.visible=true;factory.visible=false;flow.forEach(o=>o.visible=false);insideRef.current=true;setInside(true);targetPos.set(10,5.5,11);targetLook.set(0,0,0);};
    const exit=()=>{insideRef.current=false;setInside(false);inspection.visible=false;factory.visible=true;flow.forEach(o=>o.visible=true);targetPos.set(15,11,18);targetLook.set(0,0,0);};
    (host as HTMLDivElement & {enter?:()=>void;exit?:()=>void}).enter=enter;(host as HTMLDivElement & {enter?:()=>void;exit?:()=>void}).exit=exit;
    const clock=new THREE.Clock();
    const animate=()=>{raf=requestAnimationFrame(animate);const t=clock.getElapsedTime();flow.forEach((o,i)=>{const u=(o.userData.phase+t*.045)%1;const a=positions[i%8],b=positions[(i+1)%8];o.position.set(THREE.MathUtils.lerp(a[0],b[0],u),.05+Math.sin(t*2+i)*.07,THREE.MathUtils.lerp(a[1],b[1],u));});camera.position.lerp(targetPos,.045);controls.target.lerp(targetLook,.055);controls.update();composer.render();};
    animate();
    const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);composer.setSize(w,h);};resize();window.addEventListener("resize",resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);renderer.domElement.removeEventListener("pointerup",select);controls.dispose();composer.dispose();renderer.dispose();host.innerHTML="";};
  },[]);

  const stage=stages.find(s=>s[0]===selected);
  const host=mount.current as (HTMLDivElement & {enter?:()=>void;exit?:()=>void})|null;
  return <section className="immersive-plant">
    <div className="immersive-plant-top"><div><span className="eyebrow">FOODPROCESSLAB · SUGARCANE FACTORY</span><h1>Walk through the process.</h1><p>Start with the whole production floor. Select a unit, move into its cutaway, and inspect the mechanism that transforms the material.</p></div><div className="plant-status"><i/> LIVE PROCESS MODEL <b>08 UNITS</b></div></div>
    <div className="plant-viewport" ref={mount} aria-label="Interactive sugar factory 3D experience" />
    <div className="plant-hint"><span>SELECT A UNIT</span><b>→</b><span>ENTER CUTAWAY</span><b>→</b><span>ROTATE + ZOOM</span></div>
    {stage&&<aside className="unit-panel"><div className="unit-panel-kicker">UNIT {stage[1]} · {stage[2].toUpperCase()}</div><h2>{stage[2]}</h2><p>The selected unit is now the focus. Enter it to see the working mechanism and material path instead of a decorative exterior.</p><div className="unit-flow"><div><small>INPUT</small><strong>{stage[3]}</strong></div><span>→</span><div><small>OUTPUT</small><strong>{stage[4]}</strong></div></div>{!inside?<button type="button" onClick={()=>host?.enter?.()}>ENTER CUTAWAY ↗</button>:<button type="button" className="secondary" onClick={()=>host?.exit?.()}>← RETURN TO FACTORY</button>}</aside>}
    {inside&&stage&&<div className="inside-badge"><span>INSPECTION MODE · UNIT {stage[1]}</span><strong>{stage[2]}</strong><small>Cutaway view · drag to orbit · scroll to zoom</small></div>}
    {!selected&&<div className="plant-intro-card"><span>THE FACTORY IS THE INTERFACE</span><strong>Every machine is a process.</strong><p>Click a unit and follow what happens to the material inside it.</p></div>}
  </section>;
}
