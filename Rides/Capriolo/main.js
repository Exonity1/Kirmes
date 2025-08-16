import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'




const scene = new THREE.Scene();
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const gLTFloader = new GLTFLoader();
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
const cannonDebugger = new CannonDebugger(scene, world, {})
let cameraPOV = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.00001, 1000);
cameraPOV.position.x = 0.6;
cameraPOV.position.y = 0.6;
cameraPOV.lookAt(8, 1.2, 0)
camera.position.x = 10;
camera.position.y = 10;
camera.position.z = 5;
camera.lookAt(0, 0, 0)
const switchElement1 = document.getElementById('mySwitch1');



let lastTime = Date.now(); // Initialisiere die aktuelle Zeit
let deltaTime = 0;
let fps = 0;
let keys = {
  w: false,
  s: false,
  shift: false,
  space: false
};

let gasForce = 1;
let boostForceFactor = 1.3;
let motorSpeed = -1;
var bremse = false;
var motorForce = 0.0001; // Adjust this value to change the motor force
let kmgspeedbase;
let kmgspeedarm;
let kmgspeedgondel;






const groundBody = new CANNON.Body({
  mass: 0, // Mass 0 makes it static
  shape: new CANNON.Plane(), // Create a plane shape
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate it to be flat
world.addBody(groundBody); // Add the ground body to the world

const mainShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
const mainBody = new CANNON.Body({ mass: 0, shape: mainShape });
mainBody.position.set(0, 31, 0);
world.addBody(mainBody);

const ArmShape = new CANNON.Box(new CANNON.Vec3(0.4, 15, 0.2));
const armBody = new CANNON.Body({ mass: 10000, shape: ArmShape });
armBody.position.set(0, 10, 0);
world.addBody(armBody);

const mainHingeConstraint = new CANNON.HingeConstraint(mainBody, armBody, {
  pivotA: new CANNON.Vec3(0, 0, 0), // Center of the top face of the box
  axisA: new CANNON.Vec3(1, 0, 0), // Axis of rotation for the box
  pivotB: new CANNON.Vec3(0, 13, 0), // Center of the bottom face of the cylinder
  axisB: new CANNON.Vec3(0, 0, 1), // Axis of rotation for the cylinder
});
world.addConstraint(mainHingeConstraint);



const GondelShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.75, 0.5));
const GondelBody = new CANNON.Body({ mass: 400, shape: GondelShape });
GondelBody.position.set(0, 0, 0);
world.addBody(GondelBody);

const gondelConstraint = new CANNON.HingeConstraint(armBody, GondelBody, {
  pivotA: new CANNON.Vec3(0, -15, 0), // Center of the top face of the box
  axisA: new CANNON.Vec3(0, 0, 1), // Axis of rotation for the box
  pivotB: new CANNON.Vec3(0, 0.2, 0), // Center of the bottom face of the cylinder
  axisB: new CANNON.Vec3(0, 0, 1), // Axis of rotation for the cylinder
});
world.addConstraint(gondelConstraint);




















function animate() {
  requestAnimationFrame(animate);
  if (switchElement1.checked) {
    renderer.render(scene, cameraPOV);
  } else {
    renderer.render(scene, camera);
  }

  controls.update();

  world.step(1 / 60, deltaTime, 3);
  //cannonDebugger.update();

  syncObjectWithBody(kmgspeedarm, armBody);
  syncObjectWithBody(kmgspeedgondel, GondelBody);

  updateKeyValues();

  updateFPS();
  //console.log( "plate" , plateSpeed);
  //console.log("gas", gasForce);

}

function setupKeyboardListeners() {
  document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
      case 'w': keys.w = true; break;
      case 's': keys.s = true; break;
      case 'shift': keys.shift = true; break;
      case ' ': keys.space = true; break;
    }
  });

  document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
      case 'w': keys.w = false; break;
      case 's': keys.s = false; break;
      case 'shift': keys.shift = false; break;
      case ' ': keys.space = false; break;
    }
  });
}

function updateFPS() {
  const now = Date.now();
  deltaTime = (now - lastTime) / 1000; // Zeit in Sekunden
  lastTime = now;

  if (deltaTime > 0) {
    fps = Math.round(1 / deltaTime); // FPS berechnen
  }

  document.getElementById('fpsCounter').textContent = `FPS: ${fps}`;
}

function updateKeyValues() {
  if (keys.space) bremse = true;
  if (!keys.space) bremse = false;
  if (keys.shift) boostForceFactor = 2;
  if (!keys.shift) boostForceFactor = 1;
  if (!keys.w && !keys.s) {
    mainHingeConstraint.disableMotor();
  }
  if (keys.w && !keys.s) {
    mainHingeConstraint.enableMotor();
    mainHingeConstraint.setMotorSpeed(motorSpeed * boostForceFactor);
    mainHingeConstraint.motorMaxForce = gasForce * boostForceFactor * motorForce; // Adjust the force based on gasForce
  }
  if (keys.s && !keys.w) {
    mainHingeConstraint.enableMotor();
    mainHingeConstraint.setMotorSpeed(-motorSpeed * boostForceFactor);
    mainHingeConstraint.motorMaxForce = gasForce * boostForceFactor * motorForce; // Adjust the force based on gasForce
  }
  if (keys.w && keys.s) {
    mainHingeConstraint.disableMotor();
  }
  if (keys.space) {
    gondelConstraint.enableMotor();
    gondelConstraint.setMotorSpeed(0);
    gondelConstraint.motorMaxForce = 100000;
  }
  if (!keys.space) {
    gondelConstraint.disableMotor();
  }

}


function syncObjectWithBody(threeObject, cannonBody) {
  threeObject.position.copy(cannonBody.position);
  threeObject.quaternion.copy(cannonBody.quaternion);
}

function applyMaterial(object, colorTexturePath, normalTexturePath, roughnessTexturePath) {
  // Load textures
  const loader = new THREE.TextureLoader();
  const colorTexture = loader.load(colorTexturePath);
  const normalTexture = loader.load(normalTexturePath);
  const roughnessTexture = loader.load(roughnessTexturePath);




  // Scale the textures (adjust the scale as needed)
  colorTexture.repeat.set(20, 20);
  normalTexture.repeat.set(20, 20);
  roughnessTexture.repeat.set(20, 20);

  normalTexture.invert = true;

  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.RepeatWrapping;
  normalTexture.wrapS = THREE.RepeatWrapping;
  normalTexture.wrapT = THREE.RepeatWrapping;
  roughnessTexture.wrapS = THREE.RepeatWrapping;
  roughnessTexture.wrapT = THREE.RepeatWrapping;

  // Create MeshPhysicalMaterial
  const material = new THREE.MeshPhysicalMaterial({
    map: colorTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
  });

  // Apply material to object
  const returnObject = new THREE.Mesh(object, material);
  return returnObject;
}

function loadHDRI(path) {

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const hdriLoader = new RGBELoader()
  hdriLoader.load(path, function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    texture.exposure = 0.3;
    texture.dispose();
    scene.environment = envMap
    scene.background = envMap
  });

}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function resetVelocity() {
  gondelBody.angularVelocity.set(0, 0, 0);
}

function loadGLTFModel(path, onLoad) {
  gLTFloader.load(
    path,
    function (gltf) {
      let modelScene = gltf.scene;
      modelScene.traverse(function (child) {
        if (child.isMesh) {
          child.material = child.material;
        }
      });
      if (onLoad) onLoad(modelScene);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      console.log('An error happened', error);
    }
  );

}

function startFunctions() {
  window.addEventListener('resize', onWindowResize, false);
  document.getElementById('resetButton').addEventListener('click', resetVelocity);

  loadHDRI('textures/hdri/nightsky.hdr');

  loadGLTFModel('models/kmgspeedbase.glb', function (model) {
    kmgspeedbase = model;
    //scene.add(kmgspeedbase);
  });

  loadGLTFModel('models/capriolo.glb', function (model) {
    kmgspeedarm = model;
    scene.add(kmgspeedarm);
  });

  loadGLTFModel('models/caprioloGondel.glb', function (model) {
    kmgspeedgondel = model;
    kmgspeedgondel.add(cameraPOV);
    scene.add(kmgspeedgondel);
  });

  const groundPlaneGeometry = new THREE.PlaneGeometry(100, 100);
  const groundPlane = applyMaterial(groundPlaneGeometry, "textures/asphalt/Asphalt026C_1K-JPG_Color.jpg", "textures/asphalt/Asphalt026C_1K-JPG_NormalDX.jpg", "textures/asphalt/Asphalt026C_1K-JPG_Roughness.jpg")
  groundPlane.rotation.x = -Math.PI / 2;
  scene.add(groundPlane);



  setupKeyboardListeners();  
  animate();
}

startFunctions();