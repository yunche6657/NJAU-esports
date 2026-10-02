// Procedural flower geometry and local scene; reference leaf asset: Ann Nguyen's Bloom QR.
import * as T from 'three';
import {loadBloomLeaf} from './bloom-leaf-model.js?v=20260923-v1';

const stage=document.getElementById('bloom-stage');
const toggle=document.getElementById('bloom-toggle');
const status=document.getElementById('bloom-status');
const dialog=document.getElementById('bloom-dialog');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
document.getElementById('bloom-original').addEventListener('click',()=>dialog.showModal());
dialog.querySelector('.bloom-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});

function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const random=rng(912557320);
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const mix=(a,b,t)=>a+(b-a)*t;

// Layered peony cups: broad scalloped outer petals and a folded, closed heart.
// This is independent procedural geometry, not the reference site's GLB model.
function flowerGeometry(){
  const pos=[],cols=[],indices=[];
  const dark=new T.Color('#782342'),light=new T.Color('#db638e'),edge=new T.Color('#f5a5b4');
  const rings=[{n:11,r:.88,h:0,cup:.32},{n:11,r:.73,h:.08,cup:.47},{n:10,r:.58,h:.16,cup:.58},{n:9,r:.43,h:.22,cup:.60},{n:7,r:.29,h:.28,cup:.55},{n:5,r:.17,h:.33,cup:.45}];
  for(let layer=0;layer<rings.length;layer++){
    const ring=rings[layer];
    for(let petal=0;petal<ring.n;petal++){
      const start=pos.length/3,phi=petal/ring.n*Math.PI*2+layer*.7,seed=random()*6.28;
      const length=ring.r*(.9+random()*.17),fold=.8+random()*.3;
      for(let v=0;v<=9;v++)for(let u=0;u<=8;u++){
        const t=v/9,s=u/8*2-1,tip=Math.pow(t,5);
        const width=length*.64*Math.pow(Math.sin(t*Math.PI*.64),.7);
        const tangential=s*width;
        const radial=.025+length*t-(.10*s*s+layer*.035)*length*tip;
        const ruffle=(.035*Math.sin(s*13+seed)+.013*Math.sin(s*25-seed))*tip;
        const y=ring.h+ring.cup*Math.sin(t*Math.PI*.66)*fold+.17*s*s*t+ruffle;
        pos.push(Math.cos(phi)*radial-Math.sin(phi)*tangential,y,Math.sin(phi)*radial+Math.cos(phi)*tangential);
        const vein=.035*Math.cos(s*34+seed)*t;
        // Keep the previous palette and lift only the innermost cups so the
        // flower centre retains a little more readable detail.
        const centerLift=layer>=4?.12:0;
        const c=dark.clone().lerp(light,clamp(.15+ease(t)*.8+vein+centerLift)).lerp(edge,tip*(.16+.18*Math.abs(s)));
        cols.push(c.r,c.g,c.b);
      }
      for(let v=0;v<9;v++)for(let u=0;u<8;u++){
        const k=start+v*9+u;indices.push(k,k+9,k+1,k+1,k+9,k+10);
      }
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(cols,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function vaseTexture(){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=512;
  const c=cv.getContext('2d');c.fillStyle='#faf6e9';c.fillRect(0,0,1024,512);
  c.strokeStyle='#168a78';c.fillStyle='#168a78';
  for(const y of [15,30,225,244,470,490])c.fillRect(0,y,1024,y===225?14:6);
  for(let row=0;row<2;row++)for(let col=0;col<12;col++){
    const x=col*86+43,y=row*245+125;
    c.save();c.translate(x,y);c.lineWidth=2;
    for(let k=0;k<8;k++){
      c.save();c.rotate(k*Math.PI/4);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-22,-15,-12,-54,0,-72);c.bezierCurveTo(12,-54,22,-15,0,0);c.stroke();
      c.beginPath();c.ellipse(0,-36,6,17,0,0,Math.PI*2);c.fill();c.restore();
    }
    c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();c.restore();
  }
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;return tex;
}
function shadowTexture(){
  const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');
  const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(30,42,35,.22)');g.addColorStop(.4,'rgba(30,42,35,.12)');g.addColorStop(1,'rgba(30,42,35,0)');c.fillStyle=g;c.fillRect(0,0,128,128);return new T.CanvasTexture(cv);
}

function butterflyWing(){
  // Broad upper wing and round lower lobe, with the reference's plain silhouette.
  const shape=new T.Shape();
  shape.moveTo(.031,.016);
  shape.bezierCurveTo(.141,.422,.719,.484,.906,.281);
  shape.bezierCurveTo(.984,.172,.797,.031,.594,-.016);
  shape.bezierCurveTo(.813,-.078,.875,-.297,.672,-.438);
  shape.bezierCurveTo(.469,-.531,.156,-.344,.031,-.078);
  shape.closePath();
  return new T.ShapeGeometry(shape,20);
}

async function boot(){
  const response=await fetch('assets/bloom/matrix.json');if(!response.ok)throw Error('二维码数据加载失败');
  const qr=await response.json();
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});
  renderer.setClearColor('#ffffff');renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,2),2.5));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  stage.appendChild(renderer.domElement);
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(34,1,.1,150);
  scene.add(new T.HemisphereLight('#fffaf1','#b6a99b',1.55));
  const key=new T.DirectionalLight('#fff1e6',1.35);key.position.set(-4,10,8);scene.add(key);
  const fill=new T.DirectionalLight('#e5f4f0',.5);fill.position.set(5,5,-4);scene.add(fill);
  const floor=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:'white',toneMapped:false}));floor.rotation.x=-Math.PI/2;scene.add(floor);
  const shadow=new T.Mesh(new T.PlaneGeometry(5,4),new T.MeshBasicMaterial({map:shadowTexture(),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.003;scene.add(shadow);
  const profile=[[.0,0],[.67,0],[.70,.07],[.71,.4],[.72,1.1],[.74,1.6],[.755,1.85],[.73,1.9],[.69,1.83],[.66,1.5]].map(([x,y])=>new T.Vector2(x,y));
  const vaseGeometry=new T.LatheGeometry(profile,64);
  // Lathe UVs otherwise follow profile index, stretching motifs across the
  // long middle section. Map the porcelain pattern to physical height.
  const vaseUv=vaseGeometry.getAttribute('uv'),vasePos=vaseGeometry.getAttribute('position');
  for(let i=0;i<vaseUv.count;i++)vaseUv.setY(i,vasePos.getY(i)/1.9);
  const vase=new T.Mesh(vaseGeometry,new T.MeshStandardMaterial({map:vaseTexture(),roughness:.3,metalness:.04,side:T.DoubleSide}));scene.add(vase);
  const rim=new T.Mesh(new T.TorusGeometry(.755,.025,8,64),new T.MeshStandardMaterial({color:'#bfa66f',roughness:.5}));rim.rotation.x=Math.PI/2;rim.position.y=1.86;vase.add(rim);

  const step=.22,n=qr.size,half=(n-1)/2,codeWidth=(n+8)*step;
  // Keep the reference's rose-colored data mosaic; replace its cobalt accents
  // with the website's green. Finder patterns have stronger contrast for scanning.
  const pinkTones=['#862b49','#a93559','#b84268'].map(c=>new T.Color(c));
  const greenTones=['#067a6c','#009580'].map(c=>new T.Color(c));
  const whiteTones=['#ffffff','#fafcfb','#f5f9f7'].map(c=>new T.Color(c));
  const tiles=new T.InstancedMesh(new T.BoxGeometry(step,.06,step),new T.MeshBasicMaterial({color:'white',toneMapped:false}),n*n);
  tiles.instanceMatrix.setUsage(T.DynamicDrawUsage);tiles.frustumCulled=false;scene.add(tiles);
  const targets=[];
  function reserved(r,c){return(r<9&&c<9)||(r<9&&c>=n-8)||(r>=n-8&&c<9)||r===6||c===6||(Math.abs(r-(n-7))<=2&&Math.abs(c-(n-7))<=2);}
  const obj=new T.Object3D();
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const finder=(r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7);
    const palette=finder||random()<.16?greenTones:pinkTones;
    tiles.setColorAt(r*n+c,qr.cells[r][c]?palette[Math.floor(random()*palette.length)]:whiteTones[Math.floor(random()*3)]);
    if(qr.cells[r][c]&&!reserved(r,c))targets.push({x:(c-half)*step,z:(r-half)*step});
  }
  for(let i=targets.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[targets[i],targets[j]]=[targets[j],targets[i]];}
  const maxCount=matchMedia('(max-width:720px)').matches?160:320;
  const count=Math.min(targets.length,maxCount),flowerCount=Math.round(count*.74);
  const flowerMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.82,side:T.DoubleSide});
  const flowers=new T.InstancedMesh(flowerGeometry(),flowerMat,flowerCount);
  const leafModel=await loadBloomLeaf(renderer);
  const leaves=new T.InstancedMesh(leafModel.geometry,leafModel.material,count-flowerCount);
  for(const mesh of [flowers,leaves]){mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);}
  const pieces=[],up=new T.Vector3(0,1,0),maxRadius=Math.hypot(half,half)*step;
  const ballRadius=T.MathUtils.clamp(.41*Math.sqrt(count),5,9)*.27;
  for(let i=0;i<count;i++){
    const leaf=i>=flowerCount,index=leaf?i-flowerCount:i;
    const a=i*2.3999632297;
    const y=leaf?.3+random()*.45:1-2*(i+.5)/flowerCount;
    const radial=Math.sqrt(1-y*y),direction=new T.Vector3(Math.cos(a)*radial,y,Math.sin(a)*radial);
    const radius=ballRadius*(.92+random()*.08);
    const home=direction.clone().multiplyScalar(radius);home.y=2.7+home.y*.86;
    if(leaf)home.set(Math.cos(a)*(.52+random()*.17),1.68+random()*.18,Math.sin(a)*(.52+random()*.17));
    const rot=new T.Quaternion().setFromUnitVectors(up,direction);
    rot.multiply(new T.Quaternion().setFromAxisAngle(up,random()*Math.PI*2));
    const targetRot=new T.Quaternion().setFromAxisAngle(up,random()*Math.PI*2);
    if(leaf)targetRot.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2));
    const target=new T.Vector3(targets[i].x,leaf?.114:.078,targets[i].z);
    // Leaf model's origin is its stem base; center its length on the QR cell.
    if(leaf)target.sub(new T.Vector3(0,.11,0).applyQuaternion(targetRot));
    pieces.push({mesh:leaf?leaves:flowers,index,home,rot,targetRot,target,scale:leaf?.88+random()*.22:.27+random()*.10,endScale:leaf?.125:.132,
      delay:Math.hypot(targets[i].x,targets[i].z)/maxRadius,arc:.33+random()*.77,phase:random()*6.28,base:new T.Color(leaf?'#ffffff':'#fff7f4'),end:new T.Color(leaf?'#b9ce98':'#d78ca9')});
  }
  // Leaf changes use their own sequence so existing flower placement stays fixed.
  const leafRandom=rng(721903);
  for(const part of pieces.filter(part=>part.mesh===leaves)){
    const a=part.index*2.3999632297,lean=.50+leafRandom()*.32;
    const rootRadius=.74*(.5+.42*leafRandom());
    part.home.set(Math.cos(a)*rootRadius,1.8,Math.sin(a)*rootRadius);
    part.rot.setFromUnitVectors(up,new T.Vector3(Math.cos(a)*lean,1-lean,Math.sin(a)*lean).normalize());
    part.rot.multiply(new T.Quaternion().setFromAxisAngle(up,leafRandom()*Math.PI*2));
    // Mobile uses fewer blossoms and a smaller flower ball. Scale the sprigs
    // with it so their tips remain in-frame instead of forming an oversized belt.
    part.scale=ballRadius*1.2/leafModel.height*(.9+leafRandom()*.22);
    part.endScale=step*1.05/leafModel.height*(.95+leafRandom()*.1);
    // Face the QR camera, centred on the assigned module and above the tiles.
    part.targetRot.setFromAxisAngle(up,leafRandom()*Math.PI*2).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2));
    part.target.set(targets[flowerCount+part.index].x,.10,targets[flowerCount+part.index].z);
    part.target.sub(new T.Vector3(0,leafModel.height*part.endScale/2,0).applyQuaternion(part.targetRot));
    part.end.set('#ffffff');
  }
  const butterflies=[];
  const wingGeom=butterflyWing(),flightRandom=rng(9380259);
  const wingMats=['#d4587a','#fff6ea'].map(color=>new T.MeshBasicMaterial({color,side:T.DoubleSide,toneMapped:false}));
  for(let i=0;i<10;i++){
    const group=new T.Group(),mat=wingMats[i%2];
    const left=new T.Mesh(wingGeom,mat),right=new T.Mesh(wingGeom,mat);right.scale.x=-1;group.add(left,right);
    scene.add(group);butterflies.push({group,left,right,radius:[.85+.7*flightRandom(),.4+.45*flightRandom(),.85+.7*flightRandom()],speed:[.24+.22*flightRandom(),.34+.3*flightRandom(),.24+.22*flightRandom()],phase:[flightRandom()*6.28,flightRandom()*6.28,flightRandom()*6.28],height:-.25+.7*flightRandom(),flap:9+6*flightRandom(),flapPhase:flightRandom()*6.28,size:.75+.5*flightRandom()});
  }
  const flightDirection=new T.Vector3(),forward=new T.Vector3(0,0,1);

  let wanted=false,progress=0,yaw=0,drag=null,visible=false,raf=0,last=0,time=0,settled=false;
  const color=new T.Color();
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  const ro=new ResizeObserver(()=>{resize();draw();});ro.observe(stage);resize();
  function setWanted(value){wanted=value;settled=false;toggle.textContent=wanted?'收起花束':'展开花束';stage.setAttribute('aria-pressed',String(wanted));stage.setAttribute('aria-label',wanted?'收起二维码，重新聚成花束':'展开花束，显示社团群二维码');status.textContent=wanted?'花正在落位，马上就能扫码…':'轻点花束，让相遇绽放';if(reduced.matches)progress=+wanted;start();}
  toggle.addEventListener('click',()=>setWanted(!wanted));
  stage.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setWanted(!wanted);}});
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw,when:performance.now(),max:0};});
  stage.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;drag.max=Math.max(drag.max,Math.hypot(dx,e.clientY-drag.y));yaw=Math.max(-.8,Math.min(.8,drag.yaw+dx/stage.clientWidth*2));});
  stage.addEventListener('pointerup',e=>{if(drag&&drag.max<8&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8&&performance.now()-drag.when<500)setWanted(!wanted);drag=null;});
  stage.addEventListener('pointercancel',()=>drag=null);stage.addEventListener('pointerleave',()=>drag=null);
  function draw(){
    const p=ease(progress),alive=1-ease(progress*2.2),halfCode=(n+8)*step/2;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const x=(c-half)*step,z=(r-half)*step,delay=Math.hypot(x,z)/maxRadius;
      const f=ease((progress-delay*.45)/.55),height=qr.cells[r][c]?.075:.011;
      obj.position.set(x,height/2*f,z);obj.rotation.set(0,0,0);obj.scale.set(f,height/.06*f,f);obj.updateMatrix();tiles.setMatrixAt(r*n+c,obj.matrix);
    }
    tiles.instanceMatrix.needsUpdate=true;tiles.visible=progress>.001;
    for(const part of pieces){
      const f=ease((progress-part.delay*.45)/.55);
      obj.position.lerpVectors(part.home,part.target,f);
      obj.position.y+=Math.sin(f*Math.PI)*part.arc;
      if(!reduced.matches){obj.position.x+=Math.sin(time*.65+part.phase)*.035*alive;obj.position.y+=Math.sin(time*.72+part.phase)*.025*alive;}
      obj.quaternion.copy(part.rot).slerp(part.targetRot,f);
      const scale=mix(part.scale,part.endScale,f);obj.scale.setScalar(scale);
      obj.updateMatrix();part.mesh.setMatrixAt(part.index,obj.matrix);
      color.copy(part.base).lerp(part.end,f);part.mesh.setColorAt(part.index,color);
    }
    for(const mesh of [flowers,leaves]){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
    vase.position.y=-2.185*ease(progress*1.5);vase.visible=progress<.66;vase.rotation.y=.25+time*.06+yaw*.4;
    shadow.material.opacity=alive;floor.scale.setScalar(mix(6.3,codeWidth,p));
    for(const b of butterflies){
      const t=reduced.matches?0:time,[px,py,pz]=b.phase.map((phase,i)=>phase+t*b.speed[i]);
      b.group.visible=alive>.01;b.group.scale.setScalar(alive*.19*b.size);
      b.group.position.set(Math.sin(px)*ballRadius*b.radius[0],2.7+ballRadius*(b.height+Math.sin(py)*b.radius[1]),Math.cos(pz)*ballRadius*b.radius[2]);
      flightDirection.set(Math.cos(px)*b.speed[0]*b.radius[0],Math.cos(py)*b.speed[1]*b.radius[1],-Math.sin(pz)*b.speed[2]*b.radius[2]).normalize();
      b.group.quaternion.setFromUnitVectors(forward,flightDirection);
      b.left.rotation.z=1.05*Math.sin(t*b.flap+b.flapPhase);b.right.rotation.z=-b.left.rotation.z;
    }
    // The reference looks above a raised target, making the effective bouquet
    // elevation lower than the camera's polar angle around the ground origin.
    const angle=T.MathUtils.degToRad(mix(14,89.3,p));
    camera.fov=mix(34,16,p);
    const span=mix(5.85,halfCode*2*1.08,p);
    const distance=span/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*Math.max(1,1/camera.aspect);
    const targetY=mix(2.35,0,p),azimuth=(-.42+yaw+.05*Math.sin(time*.11))*(1-p);
    camera.position.set(Math.sin(azimuth)*Math.cos(angle)*distance,targetY+Math.sin(angle)*distance,Math.cos(azimuth)*Math.cos(angle)*distance);
    camera.lookAt(0,targetY,0);camera.updateProjectionMatrix();renderer.render(scene,camera);
    if(!settled&&Math.abs(+wanted-progress)<.0005){settled=true;stage.dataset.state=wanted?'qr':'bouquet';status.textContent=wanted?'扫码加入南农电竞社 · 再点一下，花束归位':'轻点花束，让相遇绽放';}
  }
  function frame(now){raf=0;if(!visible||document.hidden)return;const dt=Math.min(.06,(now-last)/1000||0);last=now;time+=dt;progress+=(+wanted-progress)*(1-Math.exp(-3.2*dt));if(Math.abs(+wanted-progress)<.0005)progress=+wanted;draw();if(!reduced.matches||progress!==+wanted)raf=requestAnimationFrame(frame);}
  function start(){if(!raf&&visible&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);}}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'80px'});observer.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();});
  reduced.addEventListener('change',()=>{if(reduced.matches)progress=+wanted;start();});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;stage.classList.remove('is-ready');stage.querySelector('.bloom-loading').textContent='可直接查看、保存二维码';toggle.disabled=true;});
  draw();stage.classList.add('is-ready');stage.dataset.state='bouquet';toggle.disabled=false;
}
let started=false;
const lazy=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!started){started=true;lazy.disconnect();boot().catch(error=>{console.error('Bouquet:',error);stage.querySelector('.bloom-loading').textContent='点击“查看二维码”即可加入';toggle.hidden=true;});}},{rootMargin:'200px'});lazy.observe(stage);
