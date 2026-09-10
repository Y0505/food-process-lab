"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSugarcaneVisualizationModel } from "@/processes/sugarcane-visualization-model";

const model = buildSugarcaneVisualizationModel();
const stages = model.stages;

function mat(color: number, metalness = .45, roughness = .42) { return new THREE.MeshStandardMaterial({ color, metalness, roughness }); }
function box(g: THREE.Group, s: [number, number, number], p: [number, number, number], m: THREE.Material) { const o = new THREE.Mesh(new THREE.BoxGeometry(...s), m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
function cyl(g: THREE.Group, r: number, h: number, p: [number, number, number], m: THREE.Material, n = 24) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, n), m); o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
function pipe(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, color = 0x4fc09a, r = .06) { const d = b.clone().sub(a); const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), mat(color, .72, .3)); o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.normalize()); o.castShadow = true; g.add(o); return o; }
function frame(g: THREE.Group, x: number, h: number, m: THREE.Material) { for (const z of [-.72,.72]) { box(g,[.09,h,.09],[x-.72,h/2-1.2,z],m); box(g,[.09,h,.09],[x+.72,h/2-1.2,z],m); } box(g,[1.62,.08,1.62],[x,h-1.2,0],m); }

function buildLine(animated: THREE.Object3D[]) {
  const root = new THREE.Group();
  const steel=mat(0x71898d,.82,.28), dark=mat(0x101f24,.72,.34), copper=mat(0x9a704b,.7,.34), cane=mat(0xb18a54,.05,.82), crystal=mat(0xf1dda0,.05,.24);
  const juice=new THREE.MeshStandardMaterial({color:0x48c28d,transparent:true,opacity:.74,roughness:.16,emissive:0x123d2d,emissiveIntensity:.4});
  const vapor=new THREE.MeshStandardMaterial({color:0xc4eeeb,transparent:true,opacity:.28,emissive:0x5baaa5,emissiveIntensity:.9});
  const xs=stages.map((_,i)=>-8.4+i*2.4), y=-.05;
  box(root,[20.5,.18,4.8],[0,-1.3,0],dark);
  for(let i=0;i<9;i++) box(root,[1.7,.025,.035],[-9.5+i*2.4,-1.19,-1.72],mat(0xb8a65c,.05,.65));
  box(root,[20,.12,.12],[0,3,-.85],steel); box(root,[20,.08,.08],[0,2.78,-.85],steel);
  for(const x of xs) box(root,[.08,4.25,.08],[x,.85,-.85],dark);
  for(let i=0;i<xs.length-1;i++){ pipe(root,new THREE.Vector3(xs[i]+.72,y,0),new THREE.Vector3(xs[i+1]-.72,y,0)); for(let p=0;p<3;p++){const q=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),juice);q.position.set(xs[i]+.85+p*.38,y,0);root.add(q);animated.push(q);} }
  {const x=xs[0];frame(root,x,1.35,steel);for(let i=-3;i<=3;i++){const r=cyl(root,.18,1.35,[x+i*.2,.3,0],steel,18);r.rotation.z=Math.PI/2;animated.push(r);}box(root,[.9,.8,1.2],[x-.78,1.1,0],dark);for(let i=0;i<8;i++){const c=cyl(root,.065,.65,[x-.7+(i%4)*.35,.58+(i%2)*.08,.18],cane,8);c.rotation.z=Math.PI/2;animated.push(c);}}
  {const x=xs[1];frame(root,x,2.1,steel);const d=cyl(root,.76,1.55,[x,.65,0],dark,32);d.rotation.z=Math.PI/2;animated.push(d);const s=cyl(root,.09,1.9,[x,.65,0],steel,14);s.rotation.z=Math.PI/2;animated.push(s);for(let i=0;i<8;i++){const b=box(root,[.14,.09,.52],[x-.55+i*.15,.68,.46],copper);b.rotation.y=i*.22;animated.push(b);}}
  {const x=xs[2];frame(root,x,2,steel);for(const z of [-.38,.38]){const r=cyl(root,.43,1.48,[x,.62,z],steel,32);r.rotation.z=Math.PI/2;animated.push(r);}box(root,[1.75,.16,1.25],[x,-.72,0],dark);cyl(root,.67,.12,[x,-.58,0],juice,28);for(let i=0;i<8;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),juice);d.position.set(x-.45+(i%4)*.22,-.28-(i%2)*.1,0);root.add(d);animated.push(d);}}
  {const x=xs[3];frame(root,x,2.75,steel);cyl(root,.7,2.55,[x,.15,0],steel,36);cyl(root,.58,1.15,[x,-.5,0],juice,28);for(const yy of [-.25,.12,.49])box(root,[1.1,.055,.12],[x,yy,0],dark);}
  {const x=xs[4];for(let i=-1;i<=1;i++){const vx=x+i*.48;cyl(root,.43,1.95,[vx,.22,0],steel,28);for(let j=0;j<4;j++){const r=new THREE.Mesh(new THREE.TorusGeometry(.32,.035,8,24),copper);r.position.set(vx,-.38+j*.28,0);r.rotation.x=Math.PI/2;root.add(r);animated.push(r);}}for(let i=0;i<14;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),vapor);p.position.set(x-.8+(i%6)*.32,1.05+(i%4)*.3,0);root.add(p);animated.push(p);}}
  {const x=xs[5];const t=cyl(root,.74,2.1,[x,.15,0],steel,32);animated.push(t);const l=cyl(root,.62,1.2,[x,-.32,0],juice,28);animated.push(l);const s=cyl(root,.07,2.7,[x,.5,0],dark,12);animated.push(s);for(const yy of [-.38,.08,.54]){const a=box(root,[1.18,.08,.1],[x,yy,0],steel);animated.push(a);}for(let i=0;i<18;i++){const c=new THREE.Mesh(new THREE.OctahedronGeometry(.045),crystal);c.position.set(x-.48+(i%6)*.19,-.65+Math.floor(i/6)*.18,.2*Math.sin(i));root.add(c);animated.push(c);}}
  {const x=xs[6];const b=cyl(root,.78,1.35,[x,.2,0],steel,38);b.rotation.z=Math.PI/2;animated.push(b);for(let r=.3;r<.75;r+=.17){const q=new THREE.Mesh(new THREE.TorusGeometry(r,.025,8,32),copper);q.position.set(x,.2,0);q.rotation.x=Math.PI/2;root.add(q);animated.push(q);}const m=cyl(root,.3,.9,[x,-.72,0],dark,22);m.rotation.z=Math.PI/2;animated.push(m);pipe(root,new THREE.Vector3(x+.75,.15,0),new THREE.Vector3(x+1.25,-.55,0),0x65c89b);}
  {const x=xs[7];box(root,[1.55,2.15,1.5],[x,.12,0],dark);box(root,[1.25,1.55,1.2],[x,.12,0],steel);for(let i=0;i<18;i++){const c=new THREE.Mesh(new THREE.OctahedronGeometry(.04),crystal);c.position.set(x-.48+(i%6)*.19,-.5+(i%5)*.2,-.42+(i%4)*.28);root.add(c);animated.push(c);}}
  return root;
}

function pose(index:number){const x=-8.4+index*2.4;return{position:new THREE.Vector3(x*.42,3.55,17.2),target:new THREE.Vector3(x*.38,.1+(index===3?.18:0),0)};}

export default function ProcessLineOverview(){
  const mountRef=useRef<HTMLDivElement>(null), selectedRef=useRef(0); const [selected,setSelected]=useState(0);
  useEffect(()=>{if(!mountRef.current)return;const mount=mountRef.current,scene=new THREE.Scene();scene.background=new THREE.Color(0x071114);scene.fog=new THREE.Fog(0x071114,13,31);const camera=new THREE.PerspectiveCamera(40,mount.clientWidth/Math.max(1,mount.clientHeight),.1,60);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;mount.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xc5dfdd,0x101d22,1.55));const key=new THREE.DirectionalLight(0xe2f2ed,3.2);key.position.set(4,8,7);key.castShadow=true;scene.add(key);const rim=new THREE.PointLight(0x4abda4,2.2,18);rim.position.set(0,2.4,3.5);scene.add(rim);const floor=new THREE.Mesh(new THREE.PlaneGeometry(28,9),mat(0x0b191e,.15,.9));floor.rotation.x=-Math.PI/2;floor.position.y=-1.42;floor.receiveShadow=true;scene.add(floor);
    const flow:THREE.Object3D[]=[];const line=buildLine(flow);scene.add(line);
    const hits=stages.map((s,i)=>{const h=new THREE.Mesh(new THREE.BoxGeometry(1.9,3.7,2.4),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));h.position.set(-8.4+i*2.4,.45,0);h.userData.stageIndex=i;line.add(h);return h;});
    const p=pose(0);camera.position.copy(p.position);camera.lookAt(p.target);let goalP=p.position.clone(),goalT=p.target.clone(),curT=p.target.clone();
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();const select=(i:number)=>{selectedRef.current=i;const q=pose(i);goalP.copy(q.position);goalT.copy(q.target);setSelected(i);};
    const pointerAt=(e:PointerEvent)=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(hits,false)[0];renderer.domElement.style.cursor=hit?'pointer':'default';};
    const click=(e:MouseEvent)=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(hits,false)[0];if(hit)select(Number(hit.object.userData.stageIndex));};
    renderer.domElement.addEventListener('pointermove',pointerAt);renderer.domElement.addEventListener('click',click);
    const onStage=(e:Event)=>select(Math.max(0,Math.min(7,Number((e as CustomEvent<number>).detail))));window.addEventListener('food-process-stage-select',onStage);
    const timer=new THREE.Timer();let frameId=0;const animate=()=>{frameId=requestAnimationFrame(animate);timer.update();const t=timer.getElapsed();line.rotation.y=Math.sin(t*.12)*.035;flow.forEach((o,i)=>{if(i%7===0)o.rotation.y+=.014;});const pb=1-Math.pow(.001,timer.getDelta()*1.35),tb=1-Math.pow(.001,timer.getDelta()*1.65);camera.position.lerp(goalP,pb);curT.lerp(goalT,tb);camera.lookAt(curT);renderer.render(scene,camera);};animate();
    const resize=()=>{camera.aspect=mount.clientWidth/Math.max(1,mount.clientHeight);camera.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight,false);};resize();window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(frameId);renderer.domElement.removeEventListener('pointermove',pointerAt);renderer.domElement.removeEventListener('click',click);window.removeEventListener('food-process-stage-select',onStage);window.removeEventListener('resize',resize);renderer.dispose();mount.removeChild(renderer.domElement);};
  },[]);
  const stage=stages[selected];
  const selectStage=(i:number)=>{setSelected(i);selectedRef.current=i;window.dispatchEvent(new CustomEvent('food-process-stage-select',{detail:i}));};
  const openDetails=()=>window.dispatchEvent(new CustomEvent('food-process-open-inspection',{detail:selected}));
  return <section className="process-line-overview"><div className="process-line-heading"><div><span>PRODUCTION LINE · FACTORY OVERVIEW</span><h2>Select a machine to understand its role</h2></div><p>The full factory stays visible. Select a unit directly in the 3D line, read its process role, then open the internal view for that exact machine.</p></div><div ref={mountRef} className="process-line-canvas" aria-label="Interactive 3D sugar production line"/><div className="process-line-stages">{stages.map((s,i)=><button key={s.stepId} type="button" className={selected===i?'process-line-stage active':'process-line-stage'} onClick={()=>selectStage(i)}><strong>{String(i+1).padStart(2,'0')}</strong><span>{s.name}</span><small>{s.equipmentId}</small></button>)}</div><div className="process-line-selected"><div><span>SELECTED EQUIPMENT · STAGE {selected+1}</span><strong>{stage.equipmentId}</strong><h3>{stage.name}</h3><p>{stage.description}</p></div><div className="selected-flow"><span>INPUT · {stage.inputStreams.map(s=>s.material.name).join(' + ')}</span><span>OUTPUT · {stage.outputStreams.map(s=>s.material.name).join(' + ')}</span></div><button type="button" className="enter-equipment" onClick={openDetails}>View details <b>→</b></button></div></section>;
}
