/* Three.js scene, camera, renderer, OrbitControls, 3-point lighting, grid & theme sync */

var wrapEl = document.getElementById('canvas-wrap');

function W() {
  return (wrapEl && wrapEl.clientWidth) || window.innerWidth;
}

function H() {
  return (wrapEl && wrapEl.clientHeight) || (window.innerHeight - 80);
}

var TOP_VIEW_POS = new THREE.Vector3(-0.5, 58, 0.05);
var INITIAL_POS = new THREE.Vector3(24, 18, 28);
var INITIAL_TARGET = new THREE.Vector3(-0.5, 1.5, 0);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d12);
scene.fog = new THREE.Fog(0x0a0d12, 60, 220);

var camera = new THREE.PerspectiveCamera(42, W() / H(), 0.1, 1000);
camera.position.copy(TOP_VIEW_POS);

var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(W(), H());
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
renderer.localClippingEnabled = true;

if (wrapEl) {
  wrapEl.appendChild(renderer.domElement);
}

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 180;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;
controls.target.copy(INITIAL_TARGET);
controls.update();

/* 3-Point Studio Lighting */
var ambientLight = new THREE.AmbientLight(0x2a3140, 1.1);
scene.add(ambientLight);

var keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
keyLight.position.set(16, 24, 12);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -28;
keyLight.shadow.camera.right = 28;
keyLight.shadow.camera.top = 28;
keyLight.shadow.camera.bottom = -28;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 85;
keyLight.shadow.bias = -0.0015;
scene.add(keyLight);

var fillLight = new THREE.DirectionalLight(0x5fa8d9, 0.35);
fillLight.position.set(-14, 10, -10);
scene.add(fillLight);

var rimLight = new THREE.DirectionalLight(0x5fd9c4, 0.25);
rimLight.position.set(0, 6, -18);
scene.add(rimLight);

/* Procedural studio environment reflection map applied to brushed Metal-1 & Tungsten Contacts only (keeps dielectrics free of IBL washout) */
var studioEnvMap = null;
(function setupStudioEnvMap() {
  try {
    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x475569);

    var topBox = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 44),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    topBox.position.set(0, 14, 0);
    topBox.rotation.x = Math.PI / 2;
    envScene.add(topBox);

    var sideA = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 16),
      new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide })
    );
    sideA.position.set(16, 4, 0);
    sideA.rotation.y = -Math.PI / 2;
    envScene.add(sideA);

    var sideB = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 16),
      new THREE.MeshBasicMaterial({ color: 0xcbd5e1, side: THREE.DoubleSide })
    );
    sideB.position.set(-16, 4, 0);
    sideB.rotation.y = Math.PI / 2;
    envScene.add(sideB);

    var rt = pmrem.fromScene(envScene, 0.04);
    studioEnvMap = rt.texture;
    pmrem.dispose();
  } catch (err) {
    console.warn('Studio envMap fallback:', err);
  }
})();

/* Ground Grid & Shadow Receiver Plane */
var gridHelper = new THREE.GridHelper(68, 44, 0x1c2530, 0x141a22);
gridHelper.position.y = -0.02;
scene.add(gridHelper);

var shadowMat = new THREE.ShadowMaterial({ opacity: 0.28 });
var shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), shadowMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.01;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

/* Root cell group */
var cellGroup = new THREE.Group();
scene.add(cellGroup);

function rebuildGrid(c1, c2) {
  if (gridHelper) {
    scene.remove(gridHelper);
    if (gridHelper.geometry) gridHelper.geometry.dispose();
    if (gridHelper.material) gridHelper.material.dispose();
  }
  gridHelper = new THREE.GridHelper(68, 44, c1, c2);
  gridHelper.position.y = -0.02;
  scene.add(gridHelper);
}

function applySceneTheme(theme) {
  var isLight = theme === 'light';
  var bgHex = isLight ? 0xf4f6f8 : 0x0a0d12;
  scene.background.setHex(bgHex);
  scene.fog.color.setHex(bgHex);
  scene.fog.near = 60;
  scene.fog.far = isLight ? 240 : 220;

  if (isLight) {
    ambientLight.color.setHex(0xe2e8f0);
    ambientLight.intensity = 1.7;
    keyLight.color.setHex(0xffffff);
    keyLight.intensity = 1.25;
    fillLight.color.setHex(0x94a3b8);
    fillLight.intensity = 0.45;
    rimLight.color.setHex(0x64748b);
    rimLight.intensity = 0.30;
    shadowMat.opacity = 0.16;
    rebuildGrid(0x94a3b8, 0xcbd5e1);
  } else {
    ambientLight.color.setHex(0x2a3140);
    ambientLight.intensity = 1.1;
    keyLight.color.setHex(0xffffff);
    keyLight.intensity = 1.15;
    fillLight.color.setHex(0x5fa8d9);
    fillLight.intensity = 0.35;
    rimLight.color.setHex(0x5fd9c4);
    rimLight.intensity = 0.25;
    shadowMat.opacity = 0.28;
    rebuildGrid(0x1c2530, 0x141a22);
  }
}

window.addEventListener('resize', function () {
  camera.aspect = W() / H();
  camera.updateProjectionMatrix();
  renderer.setSize(W(), H());
  if (typeof updateViewHudPosition === 'function') {
    updateViewHudPosition();
  }
});
