import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import { DRACOLoader, GLTFLoader, Timer } from "three/examples/jsm/Addons.js";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import GUI from "lil-gui";
import gsap from "gsap";

/**
 * Set up Gui
 */

const gui = new GUI({ width: 340 });

const debugObject = {
  clearColor: "#160920",
  primaryColor: "#ff7300",
  secondaryColor: "#0091ff",
  animationDuration: 3,
};

/**
 * Set up scene
 */

const scene = new THREE.Scene();

/**
 * Set up loaders
 */

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Set up canvas
 */

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

/**
 * Camera
 */

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 36);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;

/**
 * Renderer
 */

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});
renderer.setClearColor(debugObject.clearColor);

/**
 * Particles
 */

const particles = {
  geometry: null as THREE.BufferGeometry | null,
  material: null as THREE.ShaderMaterial | null,
  points: null as THREE.Points | null,
  maxCount: 0,
  positions: [] as THREE.BufferAttribute[],
  index: 0,
  morph: (index: number) => {
    // Update attributes
    particles.geometry!.attributes.position =
      particles.positions[particles.index];
    particles.geometry!.attributes.aPositionTarget = particles.positions[index];

    // Animate morphing
    gsap.fromTo(
      particles.material!.uniforms.uProgress,
      {
        value: 0,
      },
      {
        value: 1,
        duration: debugObject.animationDuration,
        ease: "linear",
      }
    );

    // Update index
    particles.index = index;
  },
  morph0: () => {
    particles.morph(0);
  },
  morph1: () => {
    particles.morph(1);
  },
  morph2: () => {
    particles.morph(2);
  },
  morph3: () => {
    particles.morph(3);
  },
};

// Load models

gltfLoader.load("/models.glb", (gltf) => {
  const positionsArray = gltf.scene.children.map(
    (child) => (child as THREE.Mesh).geometry.attributes.position
  );

  particles.maxCount = Math.max(...positionsArray.map((attr) => attr.count));

  particles.positions = positionsArray.map((attr) => {
    const originalArray = attr.array as Float32Array;
    const newArray = new Float32Array(particles.maxCount * 3);

    for (let i = 0; i < newArray.length; i += 3) {
      if (originalArray[i]) {
        newArray[i] = originalArray[i];
        newArray[i + 1] = originalArray[i + 1];
        newArray[i + 2] = originalArray[i + 2];
      } else {
        const randomIndex = Math.floor(attr.count * Math.random()) * 3;

        newArray[i] = originalArray[randomIndex];
        newArray[i + 1] = originalArray[randomIndex + 1];
        newArray[i + 2] = originalArray[randomIndex + 2];
      }
    }

    return new THREE.BufferAttribute(newArray, 3);
  });

  // Geometry

  const sizesArray = new Float32Array(particles.maxCount);
  for (let i = 0; i < particles.maxCount; i++) {
    sizesArray[i] = Math.random();
  }

  particles.geometry = new THREE.BufferGeometry();
  particles.geometry.setAttribute(
    "position",
    particles.positions[particles.index]
  );
  particles.geometry.setAttribute("aPositionTarget", particles.positions[3]);
  particles.geometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(sizesArray, 1)
  );

  // Material
  particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uSize: new THREE.Uniform(0.4),
      uResolution: new THREE.Uniform(
        new THREE.Vector2(
          sizes.width * sizes.pixelRatio,
          sizes.height * sizes.pixelRatio
        )
      ),
      uProgress: new THREE.Uniform(0),
      uPrimaryColor: new THREE.Uniform(
        new THREE.Color(debugObject.primaryColor)
      ),
      uSecondaryColor: new THREE.Uniform(
        new THREE.Color(debugObject.secondaryColor)
      ),
    },
  });

  // Points
  particles.points = new THREE.Points(particles.geometry, particles.material);
  scene.add(particles.points);

  /**
   * Debug
   */

  gui.addColor(debugObject, "primaryColor").onChange(() => {
    particles.material!.uniforms.uPrimaryColor.value.set(
      debugObject.primaryColor
    );
  });

  gui.addColor(debugObject, "secondaryColor").onChange(() => {
    particles.material!.uniforms.uSecondaryColor.value.set(
      debugObject.secondaryColor
    );
  });

  gui
    .add(debugObject, "animationDuration", 0.25, 10, 0.25)
    .name("Animation Duration")
    .onChange(() => {
      gsap.globalTimeline.clear();
      particles.material!.uniforms.uProgress.value = 0;
    });

  gui
    .add(particles.material!.uniforms.uProgress, "value", 0, 1, 0.01)
    .name("Progress")
    .listen();

  gui.add(particles, "morph0").name("Dona");
  gui.add(particles, "morph1").name("Mono");
  gui.add(particles, "morph2").name("Esfera");
  gui.add(particles, "morph3").name("Texto");
});

/**
 * Animation loop
 */

const timer = new Timer();

const tick = () => {
  timer.update();
  // const elapsedTime = timer.getElapsed();
  // const deltaTime = timer.getDelta();

  // update controls to enable damping
  controls.update();

  // animations

  // render
  renderer.render(scene, camera);

  // request next frame
  window.requestAnimationFrame(tick);
};

tick();

/**
 * Handle window resize
 */

function handleResize() {
  const visualViewport = window.visualViewport!;
  const width = visualViewport.width;
  const height = visualViewport.height;

  canvas.width = width;
  canvas.height = height;

  sizes.width = width;
  sizes.height = height;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update material uniforms
  if (particles.material) {
    particles.material.uniforms.uResolution.value.set(
      sizes.width * sizes.pixelRatio,
      sizes.height * sizes.pixelRatio
    );
  }

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Usar el evento 'resize' de visualViewport para móviles
 */

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
} else {
  window.addEventListener("resize", handleResize);
}
