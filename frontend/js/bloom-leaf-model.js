import * as T from 'three';

// Leaf asset extracted from Ann Nguyen's publicly served Bloom QR model.
// See assets/bloom/leaf/SOURCE.md for provenance; scene/QR logic is local.
export async function loadBloomLeaf(renderer){
  const root=new URL('../assets/bloom/leaf/',import.meta.url);
  const [response,map]=await Promise.all([
    fetch(new URL('geometry.json',root)),
    new T.TextureLoader().loadAsync(new URL('color.jpg',root).href)
  ]);
  if(!response.ok)throw new Error('叶片模型加载失败');
  const data=await response.json(),geometry=new T.BufferGeometry();
  for(const [name,values,size] of [['position',data.positions,3],['normal',data.normals,3],['uv',data.uv,2]]){
    geometry.setAttribute(name,new T.Float32BufferAttribute(values,size));
  }
  geometry.setIndex(data.indices);
  geometry.computeBoundingBox();
  const bounds=geometry.boundingBox;
  geometry.translate(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  map.flipY=false;map.colorSpace=T.SRGBColorSpace;
  map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return {geometry,material:new T.MeshStandardMaterial({map,roughness:1,metalness:0,side:T.DoubleSide}),height:geometry.boundingBox.max.y};
}
