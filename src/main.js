import * as THREE from 'three';
import { MindARThree } from 'mindar';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.addEventListener("DOMContentLoaded", async () => {
  const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: "./markers/targets-owl.mind", // має містити 2 маркери: 0 → відео, 1 → модель
  });
  const { renderer, scene, camera } = mindarThree;
  // ... вже є MindAR сцена

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1); // м'яке світло
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 1); // напрямок світла
  scene.add(directionalLight);

  // --- Video anchor для першого маркера ---
  const videoAnchor = mindarThree.addAnchor(0);
  const video = document.getElementById("myVideo");
  const videoTex = new THREE.VideoTexture(video);
  const videoMat = new THREE.MeshBasicMaterial({ map: videoTex });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.75), videoMat);
  plane.rotation.x = -Math.PI / 2;
  videoAnchor.group.add(plane);

  videoAnchor.onTargetFound = () => video.play();
  videoAnchor.onTargetLost = () => video.pause();

  // --- Owl model anchor для другого маркера ---
  const modelAnchor = mindarThree.addAnchor(1);
  const loader = new GLTFLoader();
  loader.load('./models/owl/owl.glb', gltf => {
    const owl = gltf.scene;
    owl.scale.set(0.2, 0.2, 0.2);
    owl.position.set(0, -0.5, 0);
    modelAnchor.group.add(owl);
  });

  // --- Запуск MindAR сцени ---
  await mindarThree.start();
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
});
