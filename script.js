// Register GSAP plugins
gsap.registerPlugin(CustomEase, Flip);

// Custom ease animations
CustomEase.create("customEase", "0.6, 0.01, 0.05, 1");
CustomEase.create("directionalEase", "0.16, 1, 0.3, 1");
CustomEase.create("smoothBlur", "0.25, 0.1, 0.25, 1");
CustomEase.create("gentleIn", "0.38, 0.005, 0.215, 1");

// Prevent any layout shifts during animation
gsap.config({
  force3D: true
});

// Initial zoom level for all images
const INITIAL_ZOOM = 1.2;

// Timeline for the sequence
let mainTl;

// Function to get grid column positions
function getGridPositions() {
  const gridOverlay = document.querySelector(".grid-overlay-inner");
  const columns = gridOverlay.querySelectorAll(".grid-column");

  // Make grid temporarily visible to get accurate measurements
  gsap.set(".grid-overlay", { opacity: 1 });

  // Get all column positions
  const columnPositions = Array.from(columns).map((col) => {
    const rect = col.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      center: rect.left + rect.width / 2
    };
  });

  // Hide grid again
  gsap.set(".grid-overlay", { opacity: 0 });

  return {
    firstColumnLeft: columnPositions[0].left,
    lastColumnRight: columnPositions[columnPositions.length - 1].right,
    column7Left: columnPositions[6].left,
    columnPositions: columnPositions,
    padding: parseInt(window.getComputedStyle(gridOverlay).paddingLeft)
  };
}

// Function to position text elements based on container position
function positionTextElements() {
  const container = document.querySelector(".preloader-container");
  const containerRect = container.getBoundingClientRect();
  const textVE = document.querySelector("#text-ve");
  const textLA = document.querySelector("#text-la");

  // Position VE to the left of the container
  gsap.set(textVE, {
    left: containerRect.left - 80 + "px"
  });

  // Position LA to the right of the container
  gsap.set(textLA, {
    left: containerRect.right + 20 + "px"
  });
}

// Function to align header elements to grid
function alignHeaderToGrid(gridPositions) {
  const headerLeft = document.querySelector(".header-left");
  const headerMiddle = document.querySelector(".header-middle");
  const headerRight = document.querySelector(".header-right");

  // Align logo to first column
  gsap.set(headerLeft, {
    position: "absolute",
    left: gridPositions.firstColumnLeft + "px"
  });

  // Align middle section to column 7
  gsap.set(headerMiddle, {
    position: "absolute",
    left: gridPositions.column7Left + "px"
  });

  // Align social links to right edge
  gsap.set(headerRight, {
    position: "absolute",
    right: window.innerWidth - gridPositions.lastColumnRight + "px"
  });
}

// Function to reset everything to initial state
function resetToInitialState() {
  // Reset container
  gsap.set(".preloader-container", {
    width: "400px",
    height: "300px",
    position: "relative",
    overflow: "hidden"
  });

  // Reset text elements (initial position will be set after container is positioned)
  gsap.set(".text-element", {
    fontSize: "5rem",
    top: "50%",
    transform: "translateY(-50%)"
  });

  // Reset big title
  gsap.set(".big-title", { opacity: 0 });
  gsap.set(".title-line span", { y: "100%" });

  // Reset grid overlay
  gsap.set(".grid-overlay", {
    opacity: 0
  });

  gsap.set(".grid-column", {
    borderLeftColor: "rgba(255, 255, 255, 0)",
    borderRightColor: "rgba(255, 255, 255, 0)"
  });

  // Reset header and footer
  gsap.set(".header-left", { opacity: 0, transform: "translateY(-20px)" });
  gsap.set(".header-middle", { opacity: 0, transform: "translateY(-20px)" });
  gsap.set(".social-links", { opacity: 0, transform: "translateY(-20px)" });
  gsap.set(".footer", { transform: "translateY(100%)" });

  // Get all wrappers and images
  const wrappers = document.querySelectorAll(".image-wrapper");
  const images = document.querySelectorAll(".image-wrapper img");

  // Reset all wrappers to initial state
  gsap.set(wrappers, {
    visibility: "visible",
    clipPath: "inset(100% 0 0 0)",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    xPercent: 0,
    yPercent: 0,
    clearProps: "transform,transformOrigin"
  });

  // Reset all images with initial zoom
  gsap.set(images, {
    scale: INITIAL_ZOOM,
    transformOrigin: "center center",
    clearProps: "width,height"
  });

  // Position text elements based on container position
  positionTextElements();
}

// Function to initialize the animation
function initAnimation() {
  // Kill any existing timeline
  if (mainTl) mainTl.kill();

  // Reset button
  gsap.set(".restart-btn", { opacity: 0, pointerEvents: "none" });

  // Reset body to center the container
  gsap.set("body", {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  });

  // Reset everything to initial state
  resetToInitialState();

  // Get references to elements
  const wrappers = document.querySelectorAll(".image-wrapper");
  const finalWrapper = document.querySelector("#final-image");
  const canvas = finalWrapper.querySelector("#canvas");
  const textVE = document.querySelector("#text-ve");
  const textLA = document.querySelector("#text-la");
  const gridColumns = document.querySelectorAll(".grid-column");
  const headerLeft = document.querySelector(".header-left");
  const headerMiddle = document.querySelector(".header-middle");
  const socialLinks = document.querySelector(".social-links");
  const titleLines = document.querySelectorAll(".title-line span");

  // Create a new timeline
  mainTl = gsap.timeline();

  // PHASE 1: Fast image loading sequence
  // Add each image to the timeline with faster animations
  wrappers.forEach((wrapper, index) => {
    // Add a smaller delay between animations
    if (index > 0) {
      mainTl.add("image" + index, "<0.15");
    }

    // Animate the clip path faster with smoother ease
    mainTl.to(
      wrapper,
      {
        clipPath: "inset(0% 0 0 0)",
        duration: 0.65, // Keep fast for intro
        ease: "smoothBlur"
      },
      index > 0 ? "image" + index : 0
    );
  });

  // Add a slight pause before the zoom animation
  mainTl.add("pauseBeforeZoom", ">0.2");

  // PHASE 2: Slower zoom and text animation
  // After the last image is revealed, prepare for the final animation
  mainTl.add("finalAnimation", "pauseBeforeZoom");

  // Get grid positions for text alignment
  const gridPositions = getGridPositions();

  // Align header elements to grid
  alignHeaderToGrid(gridPositions);

  // Get the padding value (2rem converted to pixels)
  const padding = gridPositions.padding;

  // Store the initial position of LA for FLIP animation
  const laElement = document.querySelector("#text-la");
  const laInitialState = Flip.getState(laElement);

  // Animate the final image - SLOWER
  mainTl.add(() => {
    // Get the state before we change anything
    const state = Flip.getState(finalWrapper);

    // Remove overflow hidden to allow expansion
    gsap.set(".preloader-container", { overflow: "visible" });

    // Position the final wrapper to cover the viewport
    gsap.set(finalWrapper, {
      position: "fixed",
      top: "50%",
      left: "50%",
      xPercent: -50,
      yPercent: -50,
      width: "100dvw",
      height: "100dvh"
    });

    // Use FLIP to animate the container expansion - SLOWER
    Flip.from(state, {
      duration: 1.2, // Slower for emphasis
      ease: "customEase",
      absolute: true,
      onComplete: () => {
        // Add drag cursor after zoom is complete
        document.body.classList.add('zoom-complete');
      }
    });

    // Initialize the interactive cosmos shader after zoom starts
    setTimeout(() => {
      initShader();
    }, 200);
  }, "finalAnimation");

  // Animate VE to the padding position and reveal extra digit - SLOWER
  mainTl.to(
    "#text-ve",
    {
      left: padding + "px",
      fontSize: "3rem",
      duration: 1.2, // Slower for emphasis
      ease: "directionalEase"
    },
    "finalAnimation"
  );

  // Reveal the extra digits in VE to show full binary and make original digit transparent
  mainTl.to(
    "#text-ve .extra-digits",
    {
      opacity: 0.4,
      duration: 0.8,
      ease: "power2.out"
    },
    "finalAnimation+=0.4"
  );

  // Make the original 0 in VE more transparent
  mainTl.to(
    "#text-ve .original-digit",
    {
      opacity: 0.4,
      duration: 0.8,
      ease: "power2.out"
    },
    "finalAnimation+=0.4"
  );

  // For LA, we'll use FLIP to ensure smooth animation - SLOWER
  mainTl.add(() => {
    // Set LA's final position - right aligned with padding
    gsap.set(laElement, {
      left: "auto",
      right: padding + "px",
      fontSize: "3rem"
    });

    // Use FLIP to animate from initial to final position - SLOWER
    Flip.from(laInitialState, {
      duration: 1.2, // Slower for emphasis
      ease: "directionalEase",
      absolute: true
    });
  }, "finalAnimation");

  // Reveal the extra digits in LA to show full binary and make original digit transparent
  mainTl.to(
    "#text-la .extra-digits",
    {
      opacity: 0.4,
      duration: 0.8,
      ease: "power2.out"
    },
    "finalAnimation+=0.4"
  );

  // Make the original 0 in LA more transparent
  mainTl.to(
    "#text-la .original-digit",
    {
      opacity: 0.4,
      duration: 0.8,
      ease: "power2.out"
    },
    "finalAnimation+=0.4"
  );

  // Add a slight pause after the zoom animation
  mainTl.add("pauseAfterZoom", ">0.3");

  // PHASE 3: Faster grid, header, footer, and title animations
  // Add grid animation after the zoom completes
  mainTl.add("gridReveal", "pauseAfterZoom");

  // Show the grid overlay
  mainTl.to(
    ".grid-overlay",
    {
      opacity: 1,
      duration: 0.4, // Keep fast
      ease: "gentleIn"
    },
    "gridReveal"
  );

  // Stagger animate the grid columns with faster stagger
  mainTl.to(
    ".grid-column",
    {
      borderLeftColor: "rgba(255, 255, 255, 0.2)",
      borderRightColor: "rgba(255, 255, 255, 0.2)",
      duration: 0.6, // Keep fast
      stagger: 0.08, // Keep fast stagger
      ease: "gentleIn"
    },
    "gridReveal"
  );

  // Add header and footer animation with staggered elements
  mainTl.add("headerFooter", ">-0.3"); // Slight overlap for smooth transition

  // Stagger animate header elements
  mainTl.to(
    headerLeft,
    {
      opacity: 1,
      transform: "translateY(0)",
      duration: 0.6, // Keep fast
      ease: "directionalEase"
    },
    "headerFooter"
  );

  mainTl.to(
    headerMiddle,
    {
      opacity: 1,
      transform: "translateY(0)",
      duration: 0.6, // Keep fast
      ease: "directionalEase",
      delay: 0.15 // Small delay for stagger effect
    },
    "headerFooter"
  );

  mainTl.to(
    socialLinks,
    {
      opacity: 1,
      transform: "translateY(0)",
      duration: 0.6, // Keep fast
      ease: "directionalEase",
      delay: 0.3 // Small delay for stagger effect
    },
    "headerFooter"
  );

  // Animate footer
  mainTl.to(
    ".footer",
    {
      transform: "translateY(0)",
      duration: 0.7, // Keep fast
      ease: "directionalEase"
    },
    "headerFooter+=0.4"
  );

  // Add big title animation
  mainTl.add("titleReveal", ">-0.2"); // Slight overlap for smooth transition

  // Make title visible
  mainTl.to(
    ".big-title",
    {
      opacity: 1,
      duration: 0.3 // Keep fast
    },
    "titleReveal"
  );

  // Animate each line of the title
  mainTl.to(
    titleLines,
    {
      y: "0%",
      duration: 0.9, // Keep fast
      stagger: 0.15, // Keep fast stagger
      ease: "customEase",
      onComplete: () => {
        // Show the restart button and cosmos controls
        gsap.to(".restart-btn", {
          opacity: 1,
          duration: 0.4, // Keep fast
          pointerEvents: "auto"
        });
        
        // Show the cosmos controls
        gsap.to("#controls", {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    },
    "titleReveal+=0.1"
  );

  return mainTl;
}

// Initialize animation on page load
window.addEventListener("DOMContentLoaded", () => {
  // Delay initialization slightly to ensure all elements are properly rendered
  setTimeout(initAnimation, 100);
});

// Restart button functionality - now navigates to website
document.querySelector(".restart-btn").addEventListener("click", () => {
  window.open("https://parvizisimone.com", "_blank");
});

// Handle window resize
window.addEventListener("resize", () => {
  if (!mainTl || mainTl.progress() === 0) {
    positionTextElements();

    // Re-align header to grid on resize
    const gridPositions = getGridPositions();
    alignHeaderToGrid(gridPositions);
  }
});

// Interactive Cosmos Functionality
/*********
 * made by Matthias Hurrle (@atzedent)
 */
let editMode = false // set to false to hide the code editor on load
let resolution = .5 // set 1 for full resolution or to .5 to start with half resolution on load
let renderDelay = 1000 // delay in ms before rendering the shader after a change
let dpr = Math.max(1, resolution * window.devicePixelRatio)
let frm, source, editor, store, renderer, pointers
const shaderId = 'oggKrGW'

function resize() {
  const { innerWidth: width, innerHeight: height } = window
  const canvas = document.getElementById('canvas')

  if (canvas) {
    canvas.width = width * dpr
    canvas.height = height * dpr

    if (renderer) {
      renderer.updateScale(dpr)
    }
  }
}

function toggleView() {
  if (editor) {
    editor.hidden = btnToggleView.checked
    const canvas = document.getElementById('canvas')
    canvas.style.setProperty('--canvas-z-index', btnToggleView.checked ? 0 : -1)
  }
}

function reset() {
  if (editor && renderer && store) {
    let shader = source
    editor.text = shader ? shader.textContent : renderer.defaultSource
    store.putShaderSource(shaderId, editor.text)
    renderThis()
  }
}

function toggleResolution() {
  resolution = btnToggleResolution.checked ? .5 : 1
  dpr = Math.max(1, resolution * window.devicePixelRatio)
  if (pointers) {
    pointers.updateScale(dpr)
  }
  resize()
}

function loop(now) {
  if (renderer && pointers) {
    renderer.updateMouse(pointers.first)
    renderer.updatePointerCount(pointers.count)
    renderer.updatePointerCoords(pointers.coords)
    renderer.updateMove(pointers.move)
    renderer.render(now)
    frm = requestAnimationFrame(loop)
  }
}

function renderThis() {
  if (editor && store && renderer) {
    editor.clearError()
    store.putShaderSource(shaderId, editor.text)

    const result = renderer.test(editor.text)

    if (result) {
      editor.setError(result)
    } else {
      renderer.updateShader(editor.text)
    }
    cancelAnimationFrame(frm) // Always cancel the previous frame!
    loop(0)
  }
}

const debounce = (fn, delay) => {
  let timerId
  return (...args) => {
    clearTimeout(timerId)
    timerId = setTimeout(() => fn.apply(this, args), delay)
  }
}

const render = debounce(renderThis, renderDelay)

function initShader() {
  const canvas = document.getElementById('canvas')
  const codeEditor = document.getElementById('codeEditor')
  const error = document.getElementById('error')
  const indicator = document.getElementById('indicator')
  const btnToggleView = document.getElementById('btnToggleView')
  const btnToggleResolution = document.getElementById('btnToggleResolution')
  
  if (!canvas || !codeEditor || !error || !indicator) return

  source = document.querySelector("script[type='x-shader/x-fragment']")

  renderer = new Renderer(canvas, dpr)
  pointers = new PointerHandler(canvas, dpr)
  store = new Store(window.location)
  editor = new Editor(codeEditor, error, indicator)
  
  if (source) {
    editor.text = source.textContent
  }
  
  renderer.setup()
  renderer.init()

  if (!editMode && btnToggleView) {
    btnToggleView.checked = true
    toggleView()
  }
  if (resolution === .5 && btnToggleResolution) {
    btnToggleResolution.checked = true
    toggleResolution()
  }
  
  canvas.addEventListener('shader-error', e => editor.setError(e.detail))

  resize()

  if (source && renderer.test(source.textContent) === null) {
    renderer.updateShader(source.textContent)
  }
  loop(0)
  
  window.addEventListener("keydown", e => {
    if (e.key === "L" && e.ctrlKey && btnToggleView) {
      e.preventDefault()
      btnToggleView.checked = !btnToggleView.checked
      toggleView()
    }
  })
}

class Renderer {
  #vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}"
  #fragmtSrc = "#version 300 es\nprecision highp float;\nout vec4 O;\nuniform float time;\nuniform vec2 resolution;\nvoid main() {\n\tvec2 uv=gl_FragCoord.xy/resolution;\n\tO=vec4(uv,sin(time)*.5+.5,1);\n}"
  #vertices = [-1, 1, -1, -1, 1, 1, 1, -1]
  constructor(canvas, scale) {
    this.canvas = canvas
    this.scale = scale
    this.gl = canvas.getContext("webgl2")
    this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale)
    this.shaderSource = this.#fragmtSrc
    this.mouseMove = [0, 0]
    this.mouseCoords = [0, 0]
    this.pointerCoords = [0, 0]
    this.nbrOfPointers = 0
  }
  get defaultSource() { return this.#fragmtSrc }
  updateShader(source) {
    this.reset()
    this.shaderSource = source
    this.setup()
    this.init()
  }
  updateMove(deltas) {
    this.mouseMove = deltas
  }
  updateMouse(coords) {
    this.mouseCoords = coords
  }
  updatePointerCoords(coords) {
    this.pointerCoords = coords
  }
  updatePointerCount(nbr) {
    this.nbrOfPointers = nbr
  }
  updateScale(scale) {
    this.scale = scale
    this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale)
  }
  compile(shader, source) {
    const gl = this.gl
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader))
      this.canvas.dispatchEvent(new CustomEvent('shader-error', { detail: gl.getShaderInfoLog(shader) }))
    }
  }
  test(source) {
    let result = null
    const gl = this.gl
    const shader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      result = gl.getShaderInfoLog(shader)
    }
    if (gl.getShaderParameter(shader, gl.DELETE_STATUS)) {
      gl.deleteShader(shader)
    }
    return result
  }
  reset() {
    const { gl, program, vs, fs } = this
    if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return
    if (gl.getShaderParameter(vs, gl.DELETE_STATUS)) {
      gl.detachShader(program, vs)
      gl.deleteShader(vs)
    }
    if (gl.getShaderParameter(fs, gl.DELETE_STATUS)) {
      gl.detachShader(program, fs)
      gl.deleteShader(fs)
    }
    gl.deleteProgram(program)
  }
  setup() {
    const gl = this.gl
    this.vs = gl.createShader(gl.VERTEX_SHADER)
    this.fs = gl.createShader(gl.FRAGMENT_SHADER)
    this.compile(this.vs, this.#vertexSrc)
    this.compile(this.fs, this.shaderSource)
    this.program = gl.createProgram()
    gl.attachShader(this.program, this.vs)
    gl.attachShader(this.program, this.fs)
    gl.linkProgram(this.program)

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program))
    }
  }
  init() {
    const { gl, program } = this
    this.buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#vertices), gl.STATIC_DRAW)

    const position = gl.getAttribLocation(program, "position")

    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    program.resolution = gl.getUniformLocation(program, "resolution")
    program.time = gl.getUniformLocation(program, "time")
    program.move = gl.getUniformLocation(program, "move")
    program.touch = gl.getUniformLocation(program, "touch")
    program.pointerCount = gl.getUniformLocation(program, "pointerCount")
    program.pointers = gl.getUniformLocation(program, "pointers")
  }
  render(now = 0) {
    const { gl, program, buffer, canvas, mouseMove, mouseCoords, pointerCoords, nbrOfPointers } = this
    
    if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.uniform2f(program.resolution, canvas.width, canvas.height)
    gl.uniform1f(program.time, now * 1e-3)
    gl.uniform2f(program.move, ...mouseMove)
    gl.uniform2f(program.touch, ...mouseCoords)
    gl.uniform1i(program.pointerCount, nbrOfPointers)
    gl.uniform2fv(program.pointers, pointerCoords)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}

class Store {
  constructor(key) {
    this.key = key
    this.store = window.localStorage
  }
  #ownShadersKey = 'ownShaders'
  #StorageType = Object.freeze({
    shader: 'fragmentSource',
    config: 'config'
  })
  #getKeyPrefix(type) {
    return `${type}${btoa(this.key)}`
  }
  #getKey(type, name) {
    return `${this.#getKeyPrefix(type)}${btoa(name)}`
  }
  putShaderSource(name, source) {
    const storageType = this.#StorageType.shader
    this.store.setItem(this.#getKey(storageType, name), source)
  }
  getShaderSource(name) {
    const storageType = this.#StorageType.shader
    return this.store.getItem(this.#getKey(storageType, name))
  }
  deleteShaderSource(name) {
    const storageType = this.#StorageType.shader
    this.store.removeItem(this.#getKey(storageType, name))
  }
  getOwnShaders() {
    const storageType = this.#StorageType.config
    const result = this.store.getItem(this.#getKey(storageType, this.#ownShadersKey))
    
    return result ? JSON.parse(result) : []
  }
  putOwnShader(shader) {
    const ownShaders = this.getOwnShaders()
    const storageType = this.#StorageType.config
    const index = ownShaders.findIndex((s) => s.uuid === shader.uuid)
    if (index === -1) {
      ownShaders.push(shader)
    } else {
      ownShaders[index] = shader
    }
    this.store.setItem(this.#getKey(storageType, this.#ownShadersKey), JSON.stringify(ownShaders))
  }
  deleteOwnShader(uuid) {
    const ownShaders = this.getOwnShaders()
    const storageType = this.#StorageType.config
    this.store.setItem(this.#getKey(storageType, this.#ownShadersKey), JSON.stringify(ownShaders.filter((s) => s.uuid !== uuid) ))
    this.deleteShaderSource(uuid)
  }
  cleanup(keep=[]) {
    const storageType = this.#StorageType.shader
    const ownShaders = this.getOwnShaders().map((s) => this.#getKey(storageType, s.uuid))
    const premadeShaders = keep.map((name) => this.#getKey(storageType, name))
    const keysToKeep = [...ownShaders, ...premadeShaders]
    const result = []

    for (let i = 0; i < this.store.length; i++) {
      const key = this.store.key(i)

      if (key.startsWith(this.#getKeyPrefix(this.#StorageType.shader)) && !keysToKeep.includes(key)) {
        result.push(key)
      }
    }

    result.forEach((key) => this.store.removeItem(key))
  }
}

class PointerHandler {
  constructor(element, scale) {
    this.scale = scale
    this.active = false
    this.pointers = new Map()
    this.lastCoords = [0,0]
    this.moves = [0,0]
    const map = (element, scale, x, y) => [x * scale, element.height - y * scale]
    element.addEventListener("pointerdown", (e) => {
      this.active = true
      this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY))
      // Hide cursor when dragging starts
      document.body.classList.add('dragging')
    })
    element.addEventListener("pointerup", (e) => {
      if (this.count === 1) {
        this.lastCoords = this.first
      }
      this.pointers.delete(e.pointerId)
      this.active = this.pointers.size > 0
      // Show drag cursor again when dragging stops
      if (!this.active) {
        document.body.classList.remove('dragging')
      }
    })
    element.addEventListener("pointerleave", (e) => {
      if (this.count === 1) {
        this.lastCoords = this.first
      }
      this.pointers.delete(e.pointerId)
      this.active = this.pointers.size > 0
      // Show drag cursor again when pointer leaves
      if (!this.active) {
        document.body.classList.remove('dragging')
      }
    })
    element.addEventListener("pointermove", (e) => {
      if (!this.active) return
      this.lastCoords = [e.clientX, e.clientY]
      this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY))
      this.moves = [this.moves[0]+e.movementX, this.moves[1]+e.movementY]
    })
  }
  getScale() {
    return this.scale
  }
  updateScale(scale) { this.scale = scale }
  reset() {
    this.pointers.clear()
    this.active = false
    this.moves = [0,0]
  }
  get count() {
    return this.pointers.size
  }
  get move() {
    return this.moves
  }
  get coords() {
    return this.pointers.size > 0 ? Array.from(this.pointers.values()).map((p) => [...p]).flat() : [0, 0]
  }
  get first() {
    return this.pointers.values().next().value || this.lastCoords
  }
}

class Editor {
  constructor(textarea, errorfield, errorindicator) {
    this.textarea = textarea
    this.errorfield = errorfield
    this.errorindicator = errorindicator
    textarea.addEventListener('keydown', this.handleKeydown.bind(this))
    textarea.addEventListener('scroll', this.handleScroll.bind(this))
  }
  get hidden() { return this.textarea.classList.contains('hidden') }
  set hidden(value) { value ? this.#hide() : this.#show() }
  get text() { return this.textarea.value }
  set text(value) { this.textarea.value = value }
  get scrollTop() { return this.textarea.scrollTop }
  set scrollTop(value) { this.textarea.scrollTop = value }
  setError(message) {
    this.errorfield.innerHTML = message
    this.errorfield.classList.add('opaque')
    const match = message.match(/ERROR: \d+:(\d+):/)
    const lineNumber = match ? parseInt(match[1]) : 0
    const overlay = document.createElement('pre')

    overlay.classList.add('overlay')
    overlay.textContent = '\n'.repeat(lineNumber)

    document.body.appendChild(overlay)

    const offsetTop = parseInt(getComputedStyle(overlay).height)

    this.errorindicator.style.setProperty('--top', offsetTop + 'px')
    this.errorindicator.style.visibility = 'visible'

    document.body.removeChild(overlay)
  }
  clearError() {
    this.errorfield.textContent = ''
    this.errorfield.classList.remove('opaque')
    this.errorfield.blur()
    this.errorindicator.style.visibility = 'hidden'
  }
  focus() {
    this.textarea.focus()
  }
  #hide() {
    for (const el of [this.errorindicator, this.errorfield, this.textarea]) {
      el.classList.add('hidden')
    }
  }
  #show() {
    for (const el of [this.errorindicator, this.errorfield, this.textarea]) {
      el.classList.remove('hidden')
    }
    this.focus()
  }
  handleScroll() {
    this.errorindicator.style.setProperty('--scroll-top', `${this.textarea.scrollTop}px`)
  }
  handleKeydown(event) {
    if (event.key === "Tab") {
      event.preventDefault()
      this.handleTabKey(event.shiftKey)
    } else if (event.key === "Enter") {
      event.preventDefault()
      this.handleEnterKey()
    }
  }
  handleTabKey(shiftPressed) {
    if (this.#getSelectedText() !== "") {
      if (shiftPressed) {
        this.#unindentSelectedText()
        return
      }
      this.#indentSelectedText()
    } else {
      this.#indentAtCursor()
    }
  }
  #getSelectedText() {
    const editor = this.textarea
    const start = editor.selectionStart
    const end = editor.selectionEnd
    return editor.value.substring(start, end)
  }
  #indentAtCursor() {
    const editor = this.textarea
    const cursorPos = editor.selectionStart

    document.execCommand('insertText', false, '\t')
    editor.selectionStart = editor.selectionEnd = cursorPos + 1
  }
  #indentSelectedText() {
    const editor = this.textarea
    const cursorPos = editor.selectionStart
    const selectedText = this.#getSelectedText()
    const lines = selectedText.split('\n')
    const indentedText = lines.map(line => '\t' + line).join('\n')

    document.execCommand('insertText', false, indentedText)
    editor.selectionStart = cursorPos
  }
  #unindentSelectedText() {
    const editor = this.textarea
    const cursorPos = editor.selectionStart
    const selectedText = this.#getSelectedText()
    const lines = selectedText.split('\n')
    const indentedText = lines.map(line => line.replace(/^\t/, '').replace(/^ /, '')).join('\n')

    document.execCommand('insertText', false, indentedText)
    editor.selectionStart = cursorPos
  }
  handleEnterKey() {
    const editor = this.textarea
    const visibleTop = editor.scrollTop
    const cursorPosition = editor.selectionStart

    let start = cursorPosition - 1
    while (start >= 0 && editor.value[start] !== '\n') {
      start--
    }

    let newLine = ''
    while (start < cursorPosition - 1 && (editor.value[start + 1] === ' ' || editor.value[start + 1] === '\t')) {
      newLine += editor.value[start + 1]
      start++
    }

    document.execCommand('insertText', false, '\n' + newLine)
    editor.selectionStart = editor.selectionEnd = cursorPosition + 1 + newLine.length
    editor.scrollTop = visibleTop // Prevent the editor from scrolling
    const lineHeight = editor.scrollHeight / editor.value.split('\n').length
    const line = editor.value.substring(0, cursorPosition).split('\n').length

    // Do the actual layout calculation in order to get the correct scroll position
    const visibleBottom = editor.scrollTop + editor.clientHeight
    const lineTop = lineHeight * (line - 1)
    const lineBottom = lineHeight * (line + 2)

    // If the cursor is outside the visible range, scroll the editor
    if (lineTop < visibleTop) editor.scrollTop = lineTop
    if (lineBottom > visibleBottom) editor.scrollTop = lineBottom - editor.clientHeight
  }
}