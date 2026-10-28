// Two lightweight blossom trees inspired by the silhouette of an old sakura.
import * as THREE from 'three';
export function addSakuraTrees(scene, mobile) {
  let seed = 8749; const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const bark = new THREE.MeshStandardMaterial({ color: 0x3b302d, roughness: 0.95 });
  const blossoms = new THREE.MeshStandardMaterial({ color: 0xe4a3bc, emissive: 0x3a1528, emissiveIntensity: 0.55, roughness: 0.9, side: THREE.DoubleSide });
  const pale = new THREE.MeshStandardMaterial({ color: 0xf1c5d2, emissive: 0x3a1528, emissiveIntensity: 0.55, roughness: 0.9, side: THREE.DoubleSide });
  const flowerGeo = new THREE.IcosahedronGeometry(1, 0);
  function tree(x, z, flip) {
    const root = new THREE.Group(); root.position.set(x, 0, z); root.scale.set(flip,1,1);
    const trunk = new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(-.12,.8,0),new THREE.Vector3(.2,1.6,.03),new THREE.Vector3(-.08,2.55,.06),new THREE.Vector3(.22,3.5,0)]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(trunk, 32, .22, 8, false), bark));
    const tips=[];
    for(let i=0;i<14;i++) {
      const a=i*2.39996, y=1.75+(i%5)*.31, spread=1.2+rand()*.85;
      const start=trunk.getPoint(Math.min(.9,y/3.5));
      const end=new THREE.Vector3(Math.cos(a)*spread,3.1+rand()*.9,Math.sin(a)*spread*.65);
      const middle=start.clone().lerp(end,.52);middle.y+=.55;
      const curve=new THREE.CatmullRomCurve3([start,middle,end]);
      root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .028+rand()*.018, 5, false),bark));
      tips.push(curve);
    }
    const per=mobile?24:52, count=tips.length*per, petals=new THREE.InstancedMesh(flowerGeo,blossoms,count), lightPetals=new THREE.InstancedMesh(flowerGeo,pale,count);
    const dummy=new THREE.Object3D();let n=0;
    for (const branch of tips) for(let i=0;i<per;i++) {
      const t=.40+rand()*.60,p=branch.getPoint(t); const spread=.14+(t-.4)*.45;
      p.x+=(rand()-.5)*spread*2;p.z+=(rand()-.5)*spread*1.5;p.y-=(rand()**1.7)*.8;
      dummy.position.copy(p);const s=.035+rand()*.045;dummy.scale.set(s*(.8+rand()*.4),s*.7,s*(.8+rand()*.4));dummy.rotation.set(rand()*3,rand()*3,rand()*3);dummy.updateMatrix();
      (i%3===0?lightPetals:petals).setMatrixAt(n,dummy.matrix);(i%3===0?petals:lightPetals).setMatrixAt(n,new THREE.Matrix4().makeScale(0,0,0));n++;
    }
    petals.instanceMatrix.needsUpdate=true;lightPetals.instanceMatrix.needsUpdate=true;root.add(petals,lightPetals);scene.add(root);
  }
  tree(-4.2,-5.4,1); tree(4.2,-6.2,-1);
}
