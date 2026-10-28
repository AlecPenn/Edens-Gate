// Adapted from "Sakura Tree 01 - Low Poly Model" by Jogoss, CC BY 4.0.
import * as THREE from 'three';

export function addSakuraTrees(scene, loader) {
  return new Promise((resolve, reject) => loader.load('/sakura-tree.glb', ({scene: source}) => {
    const bounds=new THREE.Box3().setFromObject(source), size=bounds.getSize(new THREE.Vector3());
    const scale=4.3/size.y;
    source.traverse(o => {
      if (!o.isMesh) return;
      // Cutout foliage avoids the sorting artifacts of overlapping transparent cards.
      if (o.material.name === 'Sakura_Mat') {
        o.material.transparent=false; o.material.alphaTest=.38; o.material.side=THREE.DoubleSide;
        o.material.emissive.set(0x36121d); o.material.emissiveIntensity=.6;
      }
    });
    for (const [x,z,angle,s] of [[-3.0,-2.9,.4,1],[3.0,-3.7,-.8,1],[-3.2,-10.2,1.4,.9],[3.2,-11,-1.1,.9]]) {
      const tree=source.clone(); tree.scale.setScalar(scale*s); tree.rotation.y=angle;
      tree.position.set(x,-bounds.min.y*scale*s,z); scene.add(tree);
    }
    resolve();
  }, undefined, reject));
}
