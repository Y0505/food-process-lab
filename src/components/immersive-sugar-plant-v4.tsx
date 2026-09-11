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

type Mats = Record<string, THREE.Material>;
const mats = (): Mats => ({
  metal:new THREE.MeshStandardMaterial({color:0x879294,metalness:.94,roughness:.2}),
  dark:new THREE.MeshStandardMaterial({color:0x172022,metalness:.8,roughness:.3}),
  frame:new THREE.MeshStandardMaterial({color:0x39494b,metalness:.76,roughness:.3}),
  brass:new THREE.MeshStandardMaterial({color:0xb67e45,metalness:.8,roughness:.24}),
  cane:new THREE.MeshStandardMaterial({color:0x9cac53,roughness:.75}),
  fiber:new THREE.MeshStandardMaterial({color:0x8d6742,roughness:.9}),
  juice:new THREE.MeshPhysicalMaterial({color:0x79aa3f,roughness:.18,transmission:.08,transparent:true,opacity:.9}),
  syrup:new THREE.MeshPhysicalMaterial({color:0x754522,roughness:.22,transparent:true,opacity:.94}),
  sugar:new THREE.MeshStandardMaterial({color:0xf1e0b0,roughness:.38}),
  liquor:new THREE.MeshStandardMaterial({color:0x281a14,roughness:.5}),
  glass:new THREE.MeshPhysicalMaterial({color:0x8ed2c7,transmission:.74,roughness:.04,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide}),
  steam:new THREE.MeshBasicMaterial({color:0xeaf5f2,transparent:true,opacity:.16,depthWrite:false}),
});
function add(g:THREE.Object3D,geo:THREE.BufferGeometry,m:THREE.Material,p:[number,number,number]=[0,0,0]){const o=new THREE.Mesh(geo,m);o.position.set(...p);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function box(g:THREE.Object3D,s:[number,number,number],p:[number,number,number],m:THREE.Material){return add(g,new THREE.BoxGeometry(...s),m,p)}
function cyl(g:THREE.Object3D,r:number,h:number,p:[number,number,number],m:THREE.Material,n=32){return add(g,new THREE.CylinderGeometry(r,r,h,n),m,p)}
function torus(g:THREE.Object3D,r:number,t:number,p:[number,number,number],m:THREE.Material,rot:[number,number,number]=[0,0,0]){const o=add(g,new THREE.TorusGeometry(r,t,10,40),m,p);o.rotation.set(...rot);return o}
function ball(g:THREE.Object3D,r:number,p:[number,number,number],m:THREE.Material){return add(g,new THREE.SphereGeometry(r,12,10),m,p)}
function pipe(g:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3,r:number,m:THREE.Material){const d=b.clone().sub(a);const o=add(g,new THREE.CylinderGeometry(r,r,d.length(),16),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o}

function factoryUnit(id:StageId,m:Mats){const g=new THREE.Group();box(g,[3.7,.18,2.6],[0,-1.25,0],m.dark);box(g,[3.35,.18,2.3],[0,-1.1,0],m.frame);
 if(id==="preparation"){box(g,[2.3,1.25,1.6],[0,-.05,0],m.metal);for(let i=0;i<8;i++){const c=cyl(g,.07,.85,[-1.1+i*.28,.8,-.45+(i%3)*.45],m.cane,12);c.rotation.z=Math.PI/2}const w=cyl(g,.62,.18,[.55,0,0],m.brass,40);w.rotation.x=Math.PI/2}
 if(id==="shredding"){box(g,[2.5,1.8,1.9],[0,-.05,0],m.frame);const r=cyl(g,.12,1.8,[0,0,0],m.brass,20);r.rotation.z=Math.PI/2;for(let i=0;i<12;i++){const t=box(g,[.75,.08,.1],[.22,0,0],m.metal);t.rotation.z=i*Math.PI/6}for(let i=0;i<18;i++)ball(g,.045,[-.8+(i%6)*.28,-.8,-.5+(i%5)*.25],m.fiber)}
 if(id==="extraction"){for(const y of[-.48,0,.48]){const r=cyl(g,.47,1.9,[0,y,0],m.metal,48);r.rotation.x=Math.PI/2;torus(g,.42,.025,[0,y,0],m.brass,[Math.PI/2,0,0])}pipe(g,new THREE.Vector3(-1.7,.5,0),new THREE.Vector3(-.7,.5,0),.1,m.cane);pipe(g,new THREE.Vector3(.6,-.85,0),new THREE.Vector3(1.6,-.85,0),.09,m.juice)}
 if(id==="clarification"){cyl(g,1.05,2.3,[0,0,0],m.glass,56);cyl(g,.85,.8,[0,-.5,0],m.juice,48);cyl(g,.82,.2,[0,-.98,0],m.liquor,48);cyl(g,.05,1.9,[0,.45,0],m.brass,16)}
 if(id==="evaporation"){for(const x of[-.75,0,.75]){cyl(g,.58,2.3,[x,0,0],m.glass,48);cyl(g,.46,.9,[x,-.5,0],m.syrup,40);for(let j=0;j<4;j++)torus(g,.38,.025,[x,-.7+j*.22,0],m.brass)}}
 if(id==="crystallization"){cyl(g,1,1.9,[0,0,0],m.metal,52);cyl(g,.84,.95,[0,-.45,0],m.syrup,44);for(let i=0;i<30;i++)ball(g,.04,[Math.sin(i*2)*.7,-.1+(i%8)*.08,Math.cos(i*1.7)*.7],m.sugar)}
 if(id==="centrifugation"){box(g,[2.5,1.7,2],[0,0,0],m.frame);const b=cyl(g,.8,1.4,[0,0,0],m.metal,48);b.rotation.x=Math.PI/2;for(let i=0;i<20;i++)ball(g,.04,[Math.cos(i)*.65,Math.sin(i*1.7)*.55,.1],m.sugar)}
 if(id==="drying"){const d=cyl(g,.78,2.4,[0,0,0],m.metal,48);d.rotation.z=Math.PI/2;for(let i=0;i<7;i++)torus(g,.8,.035,[-.9+i*.3,0,0],m.dark,[0,Math.PI/2,0]);for(let i=0;i<25;i++)ball(g,.04,[-.8+(i%8)*.2,-.35+(i%4)*.2,.05],m.sugar)}
 g.userData.stageId=id;g.traverse(o=>o.userData.stageId=id);return g}

function cutaway(kind:InspectionVisualKind,m:Mats){const g=new THREE.Group();box(g,[8,.2,5.8],[0,-2.45,0],m.dark);box(g,[7.6,.18,5.4],[0,-2.25,0],m.frame);
 if(kind==="cutting"){box(g,[5.5,2.8,3.5],[0,.1,0],m.dark);const w=cyl(g,1.35,.35,[0,.1,0],m.metal,48);w.rotation.x=Math.PI/2;for(let i=0;i<10;i++){const b=box(g,[1.2,.09,.12],[.35,.1,0],m.brass);b.rotation.z=i*Math.PI/5}for(let i=0;i<12;i++){const c=cyl(g,.1,.9,[-2.8+i*.5,1.45,-1+(i%3)*.8],m.cane,12);c.rotation.z=Math.PI/2}}
 else if(kind==="shredding"){box(g,[5.5,3,3.8],[0,0,0],m.dark);const r=cyl(g,.14,3,[0,0,0],m.brass,20);r.rotation.z=Math.PI/2;for(let i=0;i<18;i++){const t=box(g,[1.4,.1,.14],[.35,0,0],m.metal);t.rotation.z=i*Math.PI/9}for(let i=0;i<55;i++)ball(g,.055,[-2.4+(i%12)*.42,-1.3+(i%6)*.34,-1+(i%5)*.5],m.fiber)}
 else if(kind==="pressing"){for(const y of[-.75,0,.75]){const r=cyl(g,.7,3.7,[0,y,0],m.metal,56);r.rotation.x=Math.PI/2;torus(g,.61,.035,[0,y,0],m.brass,[Math.PI/2,0,0])}pipe(g,new THREE.Vector3(-3.2,.8,0),new THREE.Vector3(-1.7,.8,0),.18,m.cane);pipe(g,new THREE.Vector3(1.4,-1.25,0),new THREE.Vector3(3.2,-1.25,0),.15,m.juice);for(let i=0;i<35;i++)ball(g,.05,[-1.5+(i%9)*.38,-1.7+(i%4)*.2,-.8+(i%5)*.4],m.fiber)}
 else if(kind==="settling"){cyl(g,2.1,4.2,[0,0,0],m.glass,64);cyl(g,1.75,1.2,[0,-.8,0],m.juice,56);cyl(g,1.65,.35,[0,-1.55,0],m.fiber,56);cyl(g,.07,3.4,[0,.3,0],m.brass,16);for(const y of[-.75,-1.1])box(g,[3,.09,.12],[0,y,0],m.metal);pipe(g,new THREE.Vector3(1.7,.5,0),new THREE.Vector3(3,.5,0),.13,m.juice)}
 else if(kind==="evaporation"){for(const x of[-1.5,0,1.5]){cyl(g,.92,4,[x,0,0],m.glass,56);cyl(g,.7,1.5,[x,-.85,0],m.syrup,48);for(let j=0;j<5;j++)torus(g,.58,.04,[x,-1.2+j*.28,0],m.brass);for(let j=0;j<4;j++)ball(g,.06,[x+Math.sin(j)*.3,.8+j*.25,Math.cos(j)*.3],m.steam)}}
 else if(kind==="crystallization"){cyl(g,2.1,3.8,[0,0,0],m.metal,64);cyl(g,1.75,1.6,[0,-.8,0],m.syrup,56);cyl(g,.08,3.5,[0,.45,0],m.brass,18);for(let i=0;i<70;i++)ball(g,.055,[Math.sin(i*2.1)*1.35,-.2+(i%10)*.09,Math.cos(i*1.7)*1.35],m.sugar)}
 else if(kind==="separation"){box(g,[5.5,4,4],[0,0,0],m.dark);const b=cyl(g,1.7,2.7,[0,0,0],m.metal,64);b.rotation.x=Math.PI/2;for(let i=0;i<48;i++){const a=i*Math.PI*2/48;pipe(g,new THREE.Vector3(Math.cos(a)*1.4,-1.2,Math.sin(a)*1.4),new THREE.Vector3(Math.cos(a)*1.4,1.2,Math.sin(a)*1.4),.025,m.frame)}for(let i=0;i<45;i++)ball(g,.055,[Math.cos(i)*1.3,Math.sin(i*1.8)*.95,.15],m.sugar);pipe(g,new THREE.Vector3(1.7,-1.4,0),new THREE.Vector3(3,-1.4,0),.13,m.liquor)}
 else {const d=cyl(g,1.7,5,[0,0,0],m.metal,64);d.rotation.z=Math.PI/2;for(let i=0;i<9;i++)torus(g,1.72,.07,[-2+i*.5,0,0],m.dark,[0,Math.PI/2,0]);for(let i=0;i<65;i++)ball(g,.055,[-2.1+(i%14)*.3,-.65+(i%6)*.25,.1],m.sugar);pipe(g,new THREE.Vector3(-3,-.2,0),new THREE.Vector3(-2,-.2,0),.18,m.steel);pipe(g,new THREE.Vector3(2,-.2,0),new THREE.Vector3(3,-.2,0),.18,m.steel)}return g}

export function ImmersiveSugarPlant(){const mount=useRef<HTMLDivElement>(null);const[selected,setSelected]=useState<StageId|null>(null);const[inside,setInside]=useState(false);const selectedRef=useRef<StageId|null>(null);const insideRef=useRef(false);
 useEffect(()=>{const host=mount.current;if(!host)return;const m=mats();const scene=new THREE.Scene();scene.background=new THREE.Color(0x061012);scene.fog=new THREE.Fog(0x061012,20,48);const camera=new THREE.PerspectiveCamera(46,1,.1,100);camera.position.set(16,11,19);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=36;const hemi=new THREE.HemisphereLight(0xbad8d2,0x101719,1.7);scene.add(hemi);const key=new THREE.DirectionalLight(0xfff1d2,3.5);key.position.set(8,15,9);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.35,.62,.8));composer.addPass(new OutputPass());
 const factory=new THREE.Group();scene.add(factory);box(factory,[38,.25,25],[0,-1.5,0],m.dark);for(let x=-16;x<=16;x+=5){for(const z of[-9,9,0])box(factory,[.16,8,.16],[x,2.5,z],m.frame)}box(factory,[35,.18,.18],[0,6.9,-9],m.frame);box(factory,[35,.18,.18],[0,6.9,9],m.frame);
 const positions:[number,number][]=[[-11,-5],[-4,-5],[3,-5],[10,-5],[-8,4],[-1,4],[6,4],[13,4]];const machines=stages.map(([id],i)=>{const g=factoryUnit(id,m);g.position.set(positions[i][0],0,positions[i][1]);factory.add(g);return g});for(let i=0;i<7;i++){const a=new THREE.Vector3(positions[i][0]+1.7,.35,positions[i][1]);const b=new THREE.Vector3(positions[i+1][0]-1.7,.35,positions[i+1][1]);pipe(factory,a,new THREE.Vector3((a.x+b.x)/2,1.4,a.z),.05,m.metal);pipe(factory,new THREE.Vector3((a.x+b.x)/2,1.4,a.z),new THREE.Vector3((a.x+b.x)/2,1.4,b.z),.05,m.metal);pipe(factory,new THREE.Vector3((a.x+b.x)/2,1.4,b.z),b,.05,m.metal)}
 const flow=Array.from({length:90},(_,i)=>{const o=ball(factory,.045,[0,0,0],i%3===0?m.cane:i%3===1?m.juice:m.sugar);o.userData.phase=i/90;return o});const inspection=new THREE.Group();inspection.visible=false;scene.add(inspection);const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let target=camera.position.clone(),look=new THREE.Vector3();let raf=0;
 const focus=(id:StageId,detail=false)=>{const i=stages.findIndex(s=>s[0]===id);const p=new THREE.Vector3();machines[i].getWorldPosition(p);return detail?{p:p.clone().add(new THREE.Vector3(9,5,10)),l:p}:{p:p.clone().add(new THREE.Vector3(6,4,7)),l:p}};
 const pick=(e:PointerEvent)=>{if(insideRef.current)return;const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(machines,true).find(h=>typeof h.object.userData.stageId==="string");if(!hit)return;const id=hit.object.userData.stageId as StageId;selectedRef.current=id;setSelected(id);const f=focus(id);target=f.p;look=f.l};renderer.domElement.addEventListener("pointerup",pick);
 const enter=()=>{const id=selectedRef.current;if(!id)return;const def=getEquipmentInspection(id);if(!def)return;inspection.clear();inspection.add(cutaway(def.visualKind,m));inspection.visible=true;factory.visible=false;flow.forEach(o=>o.visible=false);insideRef.current=true;setInside(true);target.set(10,6,11);look.set(0,0,0)};const exit=()=>{inspection.visible=false;factory.visible=true;flow.forEach(o=>o.visible=true);insideRef.current=false;setInside(false);target.set(16,11,19);look.set(0,0,0)};(host as HTMLDivElement&{enter?:()=>void;exit?:()=>void}).enter=enter;(host as HTMLDivElement&{enter?:()=>void;exit?:()=>void}).exit=exit;
 const animate=(time:number)=>{raf=requestAnimationFrame(animate);const t=time*.001;flow.forEach((o,i)=>{const u=(o.userData.phase+t*.045)%1;const a=positions[i%8],b=positions[(i+1)%8];o.position.set(THREE.MathUtils.lerp(a[0],b[0],u),.08+Math.sin(t*2+i)*.06,THREE.MathUtils.lerp(a[1],b[1],u))});camera.position.lerp(target,.045);controls.target.lerp(look,.055);controls.update();composer.render()};animate(0);const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);composer.setSize(w,h)};resize();addEventListener("resize",resize);return()=>{cancelAnimationFrame(raf);removeEventListener("resize",resize);renderer.domElement.removeEventListener("pointerup",pick);controls.dispose();composer.dispose();renderer.dispose();host.innerHTML=""}},[]);
 const stage=stages.find(s=>s[0]===selected);const host=mount.current as(HTMLDivElement&{enter?:()=>void;exit?:()=>void})|null;return <section className="immersive-plant"><div className="immersive-plant-top"><div><span className="eyebrow">FOODPROCESSLAB · SUGARCANE FACTORY</span><h1>Walk through the process.</h1><p>See the complete production floor, select a unit, then enter its cutaway to inspect the transformation.</p></div><div className="plant-status"><i/> LIVE PROCESS MODEL <b>08 UNITS</b></div></div><div className="plant-viewport" ref={mount}/><div className="plant-hint"><span>SELECT A UNIT</span><b>→</b><span>ENTER CUTAWAY</span><b>→</b><span>ROTATE + ZOOM</span></div>{stage&&<aside className="unit-panel"><div className="unit-panel-kicker">UNIT {stage[1]} · {stage[2].toUpperCase()}</div><h2>{stage[2]}</h2><p>Enter the machine to replace the exterior with a process-focused cutaway view.</p><div className="unit-flow"><div><small>INPUT</small><strong>{stage[3]}</strong></div><span>→</span><div><small>OUTPUT</small><strong>{stage[4]}</strong></div></div>{!inside?<button onClick={()=>host?.enter?.()}>ENTER CUTAWAY ↗</button>:<button className="secondary" onClick={()=>host?.exit?.()}>← RETURN TO FACTORY</button>}</aside>}{inside&&stage&&<div className="inside-badge"><span>INSPECTION MODE · UNIT {stage[1]}</span><strong>{stage[2]}</strong><small>Cutaway view · drag to orbit · scroll to zoom</small></div>}{!selected&&<div className="plant-intro-card"><span>THE FACTORY IS THE INTERFACE</span><strong>Every machine is a process.</strong><p>Click a unit and follow what happens to the material inside it.</p></div>}</section>}
