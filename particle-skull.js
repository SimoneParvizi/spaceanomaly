import * as THREE from "https://cdn.skypack.dev/three@0.136.0";

document.addEventListener('DOMContentLoaded', function() {
  console.log("Particle skull script loaded, THREE:", THREE);
  const particleCanvas = document.getElementById('particleCanvas');
  console.log("Particle canvas found:", particleCanvas);
  if (!particleCanvas) {
    console.error("Particle canvas not found!");
    return;
  }

  let scene, camera, renderer;
  let simulationMaterial, renderMaterial;
  let simulationScene, simulationCamera, renderTarget;
  let particles, wireframeSphere;
  const width = 256, height = 256;
  let animationId;

  function init() {
    console.log("Initializing Three.js scene...");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      particleCanvas.offsetWidth / particleCanvas.offsetHeight,
      0.1,
      1000
    );
    camera.position.z = 2;
    console.log("Camera position:", camera.position);

    renderer = new THREE.WebGLRenderer({ 
      canvas: particleCanvas,
      antialias: true,
      alpha: true
    });
    const canvasWidth = particleCanvas.offsetWidth;
    const canvasHeight = particleCanvas.offsetHeight;
    console.log("Canvas dimensions:", canvasWidth, "x", canvasHeight);
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x000000, 0);
    console.log("Renderer initialized");

    simulationScene = new THREE.Scene();
    simulationCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    renderTarget = new THREE.WebGLRenderTarget(width, height, {
      format: THREE.RGBAFormat,
      type: THREE.FloatType
    });

    const initialPositions = getRandomData(width, height, 1);
    const textureA = new THREE.DataTexture(
      initialPositions,
      width,
      height,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    textureA.needsUpdate = true;

    // Create a simple noise texture procedurally
    const noiseSize = 128;
    const noiseData = new Uint8Array(noiseSize * noiseSize * 4);
    for (let i = 0; i < noiseSize * noiseSize * 4; i += 4) {
      const noise = Math.random();
      noiseData[i] = noise * 255;     // R
      noiseData[i + 1] = noise * 255; // G
      noiseData[i + 2] = noise * 255; // B
      noiseData[i + 3] = 255;         // A
    }
    
    const noiseTexture = new THREE.DataTexture(
      noiseData,
      noiseSize,
      noiseSize,
      THREE.RGBAFormat
    );
    noiseTexture.needsUpdate = true;

    simulationMaterial = new THREE.ShaderMaterial({
      uniforms: {
        positions: { value: textureA },
        noiseTexture: { value: noiseTexture },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D positions;
        uniform sampler2D noiseTexture;
        uniform float time;
        varying vec2 vUv;

        float sdSkull(vec3 p) {
          vec3 q = abs(p);
          float d = length(p - vec3(0.0, 0.15, 0.0)) - 0.45; // Head
          d = min(d, length(p - vec3(0.0, -0.2, 0.25)) - 0.12); // Nose
          d = min(d, length(p - vec3(0.18, -0.05, 0.35)) - 0.1); // Right eye
          d = min(d, length(p - vec3(-0.18, -0.05, 0.35)) - 0.1); // Left eye
          d = min(d, length(max(q - vec3(0.2, -0.35, 0.25), 0.0)) - 0.05); // Jaw
          return d;
        }

        vec3 rotateY(vec3 p, float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return vec3(c*p.x - s*p.z, p.y, s*p.x + c*p.z);
        }

        void main() {
          vec3 pos = texture2D(positions, vUv).xyz;
          vec3 noise = texture2D(noiseTexture, vUv + time * 0.01).rgb;
          
          pos = rotateY(pos, time * 0.2);
          
          float skull = sdSkull(pos);
          float particleDensity = smoothstep(0.3, -0.05, skull);
          
          vec3 normalizedPos = normalize(pos);
          pos = mix(pos, normalizedPos * (1.5 - skull * 0.1), 0.1);
          
          pos += (noise - 0.5) * 0.02 * (1.0 - particleDensity);
          
          if (noise.r > 0.98) {
            pos = normalize(noise - 0.5) * 1.2;
            particleDensity = 0.5;
          }

          gl_FragColor = vec4(pos, particleDensity);
        }
      `
    });

    const simulationPlane = new THREE.PlaneGeometry(2, 2);
    const simulationMesh = new THREE.Mesh(simulationPlane, simulationMaterial);
    simulationScene.add(simulationMesh);

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(width * height * 3);
    const uvs = new Float32Array(width * height * 2);

    for (let i = 0; i < width * height; i++) {
      uvs[i * 2] = (i % width) / width;
      uvs[i * 2 + 1] = Math.floor(i / width) / height;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    renderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: null },
        pointSize: { value: 2.0 },
        time: { value: 0 }
      },
      vertexShader: `
        uniform sampler2D positionTexture;
        uniform float pointSize;
        uniform float time;
        varying float vOpacity;
        void main() {
          vec4 posData = texture2D(positionTexture, uv);
          vec3 pos = posData.xyz;
          vOpacity = posData.w;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = pointSize * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
          float r = length(gl_PointCoord - vec2(0.5));
          if (r > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, r) * vOpacity;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.7);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    particles = new THREE.Points(particleGeometry, renderMaterial);
    scene.add(particles);

    // Add wireframe sphere - simplified and very visible
    console.log("Creating wireframe sphere...");
    const sphereGeometry = new THREE.SphereGeometry(1.0, 16, 16);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000, // Red for testing
      wireframe: true,
      transparent: false,
      side: THREE.DoubleSide
    });
    wireframeSphere = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    wireframeSphere.position.set(0, 0, 0); // Center it
    scene.add(wireframeSphere);
    console.log("Wireframe sphere added to scene. Geometry vertices:", sphereGeometry.attributes.position.count);
    console.log("Scene children count:", scene.children.length);

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const width = particleCanvas.offsetWidth;
      const height = particleCanvas.offsetHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(particleCanvas);
  }

  function getRandomData(width, height, size) {
    const len = width * height * 4;
    const data = new Float32Array(len);
    for (let i = 0; i < len; i += 4) {
      data[i] = (Math.random() * 2 - 1) * size;
      data[i + 1] = (Math.random() * 2 - 1) * size;
      data[i + 2] = (Math.random() * 2 - 1) * size;
      data[i + 3] = Math.random();
    }
    return data;
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    if (simulationMaterial && renderMaterial) {
      simulationMaterial.uniforms.time.value = time;
      renderMaterial.uniforms.time.value = time;
    }

    if (wireframeSphere) {
      wireframeSphere.rotation.y = time * 0.1;
      wireframeSphere.rotation.x = time * 0.05;
    }

    renderer.setRenderTarget(renderTarget);
    renderer.render(simulationScene, simulationCamera);
    renderer.setRenderTarget(null);

    if (renderMaterial) {
      renderMaterial.uniforms.positionTexture.value = renderTarget.texture;
    }
    renderer.render(scene, camera);
    
    // Debug log every 60 frames
    if (Math.floor(time * 60) % 60 === 0) {
      console.log("Animation frame rendered, time:", time.toFixed(2));
    }
  }

  // Initialize and start
  init();
  animate();

  // Stop animation when out of view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!animationId) {
          animate();
        }
      } else {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    });
  }, { threshold: 0 });

  observer.observe(particleCanvas);
});