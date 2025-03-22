import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'


let gondelSpeed = 0;
const scene = new THREE.Scene();
let gasSpeed = 0;
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const gLTFloader = new GLTFLoader();

const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let cameraPOV = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.00001, 1000);

cameraPOV.position.x = 0;
cameraPOV.position.y = -12;
cameraPOV.position.z = 3;

//cameraPOV.lookAt(8, 1.2, 0)

let plateSpeed = 0;



let kmgspeedbase;
let kmgspeedarm;
let kmgspeedgondel1;


function loadBaseModel() {

  // Load GLB model
  gLTFloader.load(
    // Resource URL
    'models/kmgspeedbase.glb',
    // Called when the resource is loaded
    function(gltf) {
      console.log("Model loaded");

      // Get the model's scene
      let modelScene = gltf.scene;

      // Iterate over the model's children
      modelScene.traverse(function(child) {
        if (child.isMesh) {
          // Apply the materials from the GLB file to the mesh
          child.material = child.material;
        }
      });

      // Add the entire scene to the appropriate kreuz variable
      kmgspeedbase = modelScene;
      scene.add(kmgspeedbase)

    },

    function(xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },

    function(error) {
      console.log('An error happened', error);
    }
  );

}

//loadBaseModel();

function loadArmModel() {

  // Load GLB model
  gLTFloader.load(
    // Resource URL
    'models/kmgxxl001base.glb',
    // Called when the resource is loaded
    function(gltf) {
      console.log("Model loaded");

      // Get the model's scene
      let modelScene = gltf.scene;

      // Iterate over the model's children
      modelScene.traverse(function(child) {
        if (child.isMesh) {
          // Apply the materials from the GLB file to the mesh
          child.material = child.material;
        }
      });

      // Add the entire scene to the appropriate kreuz variable
      kmgspeedarm = modelScene;
      scene.add(kmgspeedarm)

    },

    function(xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },

    function(error) {
      console.log('An error happened', error);
    }
  );

}

loadArmModel();

function loadGondelModel(i) {

  // Load GLB model
  gLTFloader.load(
    // Resource URL
    'models/kmgxxl001.glb',
    // Called when the resource is loaded
    function(gltf) {
      console.log("Model loaded");

      // Get the model's scene
      let modelScene = gltf.scene;

      // Iterate over the model's children
      modelScene.traverse(function(child) {
        if (child.isMesh) {
          // Apply the materials from the GLB file to the mesh
          child.material = child.material;
        }
      });

      // Add the entire scene to the appropriate kreuz variable
      if(i == 1){
        kmgspeedgondel1 = modelScene;
        scene.add(kmgspeedgondel1)
      }else if(i == 2){
        kmgspeedgondel2 = modelScene;
        scene.add(kmgspeedgondel2)
      }
      

    },

    function(xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },

    function(error) {
      console.log('An error happened', error);
    }
  );

}

loadGondelModel(1);
//loadGondelModel(2);

// Create a ground body
const groundBody = new CANNON.Body({
    mass: 0, // Mass 0 makes it static
    shape: new CANNON.Plane(), // Create a plane shape
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate it to be flat
world.addBody(groundBody); // Add the ground body to the world

const mainShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
const mainBody = new CANNON.Body({ mass: 0, shape: mainShape });
mainBody.position.set(-2, 26.5, 0);
world.addBody(mainBody);

const ArmShape = new CANNON.Box(new CANNON.Vec3(0.4, 5.5, 0.4));
const armBody = new CANNON.Body({ mass: 3000, shape: ArmShape });
armBody.position.set(0, 0, 0);
world.addBody(armBody);



// Create hinge constraint
const plateHingeConstraint = new CANNON.HingeConstraint(mainBody, armBody, {
  pivotA: new CANNON.Vec3(0, 0, 0), // Center of the top face of the box
  axisA: new CANNON.Vec3(1, 0, 0), // Axis of rotation for the box
  pivotB: new CANNON.Vec3(0, 6, -1.5), // Center of the bottom face of the cylinder
  axisB: new CANNON.Vec3(0, 0, 1), // Axis of rotation for the cylinder
});
world.addConstraint(plateHingeConstraint);

plateHingeConstraint.enableMotor();
plateHingeConstraint.setMotorSpeed(plateSpeed);
plateHingeConstraint.setMotorMaxForce(3000);






const Gondel1Shape = new CANNON.Box(new CANNON.Vec3(1, 10, 1));
const Gondel1Body = new CANNON.Body({ mass: 600, shape: Gondel1Shape });
Gondel1Body.position.set(0, 0, 0);
world.addBody(Gondel1Body);

const GondelConstraint1 = new CANNON.HingeConstraint(armBody, Gondel1Body, {
  pivotA: new CANNON.Vec3(0, -6, 0), // Center of the top face of the box
  axisA: new CANNON.Vec3(0, 1, 0), // Axis of rotation for the box
  pivotB: new CANNON.Vec3(0, 0.07, 0), // Center of the bottom face of the cylinder
  axisB: new CANNON.Vec3(0, 1, 0), // Axis of rotation for the cylinder
});
world.addConstraint(GondelConstraint1);

GondelConstraint1.enableMotor();
GondelConstraint1.setMotorSpeed(gondelSpeed);
GondelConstraint1.setMotorMaxForce(300);


/*
const Gondel2Shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.75, 0.5));
const Gondel2Body = new CANNON.Body({ mass: 400, shape: Gondel2Shape });
Gondel1Body.position.set(0, 0, 0);
world.addBody(Gondel2Body);


const GondelConstraint2 = new CANNON.HingeConstraint(armBody, Gondel2Body, {
  pivotA: new CANNON.Vec3(0, 19, 0), // Center of the top face of the box
  axisA: new CANNON.Vec3(0, 0, 1), // Axis of rotation for the box
  pivotB: new CANNON.Vec3(0, 0.07, -1), // Center of the bottom face of the cylinder
  axisB: new CANNON.Vec3(0, 0, 1), // Axis of rotation for the cylinder
});
world.addConstraint(GondelConstraint2);
*/

const groundPlaneGeometry = new THREE.PlaneGeometry(100, 100);
const groundPlane = applyMaterial(groundPlaneGeometry, "textures/asphalt/Asphalt026C_1K-JPG_Color.jpg", "textures/asphalt/Asphalt026C_1K-JPG_NormalDX.jpg", "textures/asphalt/Asphalt026C_1K-JPG_Roughness.jpg")
groundPlane.rotation.x = -Math.PI / 2;
scene.add(groundPlane);



camera.position.x = 10;
camera.position.y = 10;
camera.position.z = 5;
camera.lookAt(0, 0, 0)


const controls = new OrbitControls(camera, renderer.domElement);
const cannonDebugger = new CannonDebugger(scene, world, {

})








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
  hdriLoader.load(path, function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    texture.exposure = 0.3;
    texture.dispose();
    scene.environment = envMap
    scene.background = envMap
  });

}

loadHDRI('textures/hdri/nightsky.hdr');


let lastTime = Date.now(); // Initialisiere die letzte Zeit
let deltaTime = 0;
let fps = 0;

function updateFPS() {
    const now = Date.now();
    deltaTime = (now - lastTime) / 1000; // Zeit in Sekunden
    lastTime = now;

    if (deltaTime > 0) {
        fps = Math.round(1 / deltaTime); // FPS berechnen
    }

    document.getElementById('fpsCounter').textContent = `FPS: ${fps}`;
}

let a = false;

const switchElement = document.getElementById('mySwitch');

function animate() {

  if(plateSpeed == 0) { 
    plateHingeConstraint.disableMotor();
  } else {
    plateHingeConstraint.enableMotor();
  }
  requestAnimationFrame(animate);
  if (kmgspeedgondel1 != null && switchElement.checked){
    renderer.render(scene, cameraPOV);
  }else{
    renderer.render(scene, camera);
  }
  
  controls.update();

  world.step(1 / 60, deltaTime, 3);
  //cannonDebugger.update();


  if(kmgspeedgondel1 != null && !a){
    kmgspeedgondel1.add(cameraPOV);
    a = true;
  } 
  if(kmgspeedarm != null) syncObjectWithBody(kmgspeedarm, armBody);
  if(kmgspeedgondel1 != null) syncObjectWithBody(kmgspeedgondel1, Gondel1Body);
  //if(kmgspeedgondel2 != null) syncObjectWithBody(kmgspeedgondel2, Gondel2Body);


  
  
  
  plateHingeConstraint.setMotorSpeed(plateSpeed*-1 * gasSpeed);
  GondelConstraint1.setMotorSpeed(gondelSpeed);

  updateFPS();
  console.log( "plate" , plateSpeed);
  console.log("gas", gasSpeed);

}
animate();



const slider1 = document.getElementById('slider1');
const slider2 = document.getElementById('slider2');
const slider3 = document.getElementById('slider3');


slider1.addEventListener('input', () => {
    const value = parseFloat(slider1.value);
    
    plateSpeed = value;
});


slider2.addEventListener('input', () => {
  const value = parseFloat(slider2.value);
  
  gasSpeed = value * 0.012;
  
});


slider3.addEventListener('input', () => {
  const value = parseFloat(slider3.value);
  
  gondelSpeed = value * 0.018;
  
});




  

window.addEventListener('resize', onWindowResize, false);

document.getElementById('resetButton').addEventListener('click', resetVelocity);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function resetVelocity() {
  Gondel1Body.angularVelocity.set(0, 0, 0);
  Gondel2Body.angularVelocity.set(0, 0, 0);
}


