import * as T from 'three';

// Independent reconstruction after inspecting the reference leaf in isolation.
// Height 2, width 1.3: a visible petiole and three curved, slender blades.
export function createBloomLeaf(){
  const pos=[],colors=[],uvs=[],indices=[];
  const olive=new T.Color('#557b18'),light=new T.Color('#829831');
  const shapes=[
    {base:[-.015,.46,0],control:[-.12,1.17,.07],tip:[.015,2,0],width:.117,phase:.8},
    {base:[-.018,.44,0],control:[-.22,1.14,.035],tip:[-.65,1.43,-.005],width:.105,phase:2.2},
    {base:[.005,.46,.005],control:[.21,1.27,-.035],tip:[.64,1.62,.005],width:.096,phase:4.7}
  ];
  const rows=48,columns=12;
  for(const leaf of shapes){
    const curve=new T.QuadraticBezierCurve3(new T.Vector3(...leaf.base),new T.Vector3(...leaf.control),new T.Vector3(...leaf.tip));
    const start=pos.length/3;
    for(let row=0;row<=rows;row++){
      const t=row/rows,center=curve.getPoint(t),tangent=curve.getTangent(t);
      const across=new T.Vector3(tangent.y,-tangent.x,0).normalize();
      for(let col=0;col<=columns;col++){
        const s=col/columns*2-1,edge=Math.abs(s);
        const profile=Math.pow(Math.sin(Math.PI*t),1.18);
        const irregular=1+.085*Math.sin(t*57+leaf.phase+s*.8)+.032*Math.sin(t*139+leaf.phase);
        const width=leaf.width*profile*irregular*(s<0?.90:1.06);
        const v=center.clone().addScaledVector(across,s*width);
        v.z+=.018*Math.sin(t*12+leaf.phase)*edge+.035*profile*(1-edge)-.013*profile*edge*edge;
        pos.push(v.x,v.y,v.z);uvs.push(col/columns,t);
        const vein=Math.exp(-s*s*190)*.18;
        const shade=.20+.20*(s+1)+.08*Math.sin(t*17+s*3+leaf.phase)+vein;
        const color=olive.clone().lerp(light,shade);colors.push(color.r,color.g,color.b);
      }
    }
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const k=start+row*(columns+1)+col;
      indices.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);
    }
  }
  // Narrow tapering stem stays visible between the leaves and the base.
  const start=pos.length/3;
  for(let row=0;row<=12;row++)for(let col=0;col<8;col++){
    const t=row/12,a=col/8*Math.PI*2,r=.011*(1-t*.7);
    pos.push(-.017*t+Math.cos(a)*r,t*.75,Math.sin(a)*r);
    colors.push(olive.r,olive.g,olive.b);uvs.push(.5,t);
  }
  for(let row=0;row<12;row++)for(let col=0;col<8;col++){
    const a=start+row*8+col,b=start+row*8+(col+1)%8;indices.push(a,b,a+8,b,b+8,a+8);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}

export function createLeafSurface(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1024;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#e4e8cf';ctx.fillRect(0,0,256,1024);
  // Low contrast veins and mottling, kept larger than a pixel after downsampling.
  for(let y=0;y<1024;y+=4){
    const value=Math.round(219+7*Math.sin(y*.017)+4*Math.sin(y*.091));
    ctx.fillStyle=`rgb(${value},${value+6},${value-13})`;ctx.fillRect(0,y,256,4);
  }
  ctx.strokeStyle='rgba(99,123,38,.28)';ctx.lineWidth=2;
  for(let y=100;y<950;y+=64)for(const side of [-1,1]){
    ctx.beginPath();ctx.moveTo(128,y);ctx.quadraticCurveTo(128+side*42,y+36,128+side*126,y+100);ctx.stroke();
  }
  ctx.strokeStyle='rgba(245,249,191,.48)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(128,0);ctx.lineTo(128,1024);ctx.stroke();
  // Sparse ragged edge breaks, rather than symmetrical saw teeth or solid arrows.
  ctx.globalCompositeOperation='destination-out';
  let seed=3721;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let i=0;i<85;i++){
    const side=i%2,x=side?248+rand()*8:rand()*8,y=65+rand()*890;
    ctx.beginPath();ctx.ellipse(x,y,3+rand()*8,3+rand()*12,rand()*2,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<18;i++){
    const x=25+rand()*206,y=70+rand()*850;
    // Keep the midrib intact.
    if(Math.abs(x-128)<20)continue;
    ctx.beginPath();ctx.ellipse(x,y,2+rand()*3,3+rand()*9,rand()*2,0,Math.PI*2);ctx.fill();
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  return texture;
}
