// Footer starfield script - only runs if space canvas exists
const spaceCanvas = document.getElementById("space");
if (spaceCanvas) {
  // Setup canvas and context for footer starfield
  const ctx = spaceCanvas.getContext("2d");
  spaceCanvas.width = spaceCanvas.offsetWidth;
  spaceCanvas.height = spaceCanvas.offsetHeight;
  
  // Starfield settings
  const numStars = 1900;
  const focalLength = spaceCanvas.width * 2;
  let centerX = spaceCanvas.width / 2;
  let centerY = spaceCanvas.height / 2;
  const baseTrailLength = 2;
  const maxTrailLength = 30;
  
  // Stars array
  let stars = [];
  
  // Animation control
  let warpSpeed = 0;
  let animationActive = true;
  
  // Initialize stars
  function initializeStars() {
    stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * spaceCanvas.width,
        y: Math.random() * spaceCanvas.height,
        z: Math.random() * spaceCanvas.width,
        o: 0.5 + Math.random() * 0.5,
        trail: []
      });
    }
  }
  
  // Update star positions
  function moveStars() {
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      // Move star based on warp speed - always forward
      const speed = 1 + warpSpeed * 50;
      star.z -= speed;
      // Reset star position when it passes the viewer
      if (star.z < 1) {
        star.z = spaceCanvas.width;
        star.x = Math.random() * spaceCanvas.width;
        star.y = Math.random() * spaceCanvas.height;
        star.trail = [];
      }
    }
  }
  
  // Draw stars and their trails
  function drawStars() {
    // Resize canvas if needed
    if (spaceCanvas.width !== spaceCanvas.offsetWidth || spaceCanvas.height !== spaceCanvas.offsetHeight) {
      spaceCanvas.width = spaceCanvas.offsetWidth;
      spaceCanvas.height = spaceCanvas.offsetHeight;
      centerX = spaceCanvas.width / 2;
      centerY = spaceCanvas.height / 2;
    }
    
    // Calculate trail length based on warp speed
    const trailLength = Math.floor(baseTrailLength + warpSpeed * (maxTrailLength - baseTrailLength));
    
    // Clear canvas with fade effect based on warp speed
    const clearAlpha = 1 - warpSpeed * 0.8;
    ctx.fillStyle = `rgba(17,17,17,${clearAlpha})`;
    ctx.fillRect(0, 0, spaceCanvas.width, spaceCanvas.height);
    
    // Draw stars and trails
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      // Calculate screen position with perspective
      const px = (star.x - centerX) * (focalLength / star.z) + centerX;
      const py = (star.y - centerY) * (focalLength / star.z) + centerY;
      
      // Add position to trail
      star.trail.push({ x: px, y: py });
      if (star.trail.length > trailLength) {
        star.trail.shift();
      }
      
      // Draw trail
      if (star.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(star.trail[0].x, star.trail[0].y);
        for (let j = 1; j < star.trail.length; j++) {
          ctx.lineTo(star.trail[j].x, star.trail[j].y);
        }
        ctx.strokeStyle = `rgba(209,255,255,${star.o})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Draw star
      ctx.fillStyle = `rgba(209,255,255,${star.o})`;
      ctx.fillRect(px, py, 1, 1);
    }
  }
  
  // Animation loop
  function animate() {
    if (animationActive) {
      requestAnimationFrame(animate);
      moveStars();
      drawStars();
    }
  }
  
  // Initialize and start animation
  initializeStars();
  animate();
  
  // GSAP ScrollTrigger setup
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    
    // Create a timeline for the warp effect
    const warpTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "#stickyContainer",
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          // 0-300vh (0-60%): Ramp up warp effect
          if (progress <= 0.6) {
            warpSpeed = progress / 0.6; // 0 to 1
          }
          // 300-400vh (60-80%): Maintain full warp
          else if (progress <= 0.8) {
            warpSpeed = 1; // Full warp
          }
          // 400-500vh (80-100%): Decrease warp effect
          else {
            warpSpeed = 1 - (progress - 0.8) / 0.2; // 1 to 0
          }
        }
      }
    });
    
    // Enhanced text animation with blur and better easing
    const textTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "#stickyContainer",
        start: "12% top",
        end: "20% top",
        scrub: 0.8
      }
    });
    
    textTimeline.to("#animatedText", {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.4,
      ease: "power3.out"
    });
    
    // Create a timeline for the exit effect
    const exitTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "#stickyContainer",
        start: "bottom 20%",
        end: "bottom -10%",
        scrub: true
      }
    });
    
    exitTimeline.to("#animatedText", {
      opacity: 0,
      y: -20,
      filter: "blur(8px)",
      duration: 0.4,
      ease: "power2.in"
    }, 0);
    
    exitTimeline.to("#webglSection", {
      opacity: 0,
      scale: 0.95,
      ease: "power2.inOut"
    }, 0.1);
    
    // Animate the additional content section
    const additionalContentTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "#additionalSection",
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });
    
    additionalContentTimeline.to("#additionalContent", {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out"
    });
  }
  
  // Handle visibility - stop animation when out of view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!animationActive) {
          animationActive = true;
          animate();
        }
      } else {
        animationActive = false;
      }
    });
  }, { threshold: 0 });
  
  const stickyContainer = document.getElementById("stickyContainer");
  if (stickyContainer) {
    observer.observe(stickyContainer);
  }
  
  // Handle window resize
  window.addEventListener("resize", () => {
    spaceCanvas.width = spaceCanvas.offsetWidth;
    spaceCanvas.height = spaceCanvas.offsetHeight;
    centerX = spaceCanvas.width / 2;
    centerY = spaceCanvas.height / 2;
  });
}

// Dot grid functionality
const dotGrid = document.getElementById("dotGrid");
if (dotGrid) {
  // Increase rows by 25%
  const originalHeight = 150;
  const increasedHeight = originalHeight * 1.25;
  dotGrid.style.height = `${increasedHeight}px`;
  
  // Calculate spacing
  const containerPadding = 2 * 16;
  const fullWidth = window.innerWidth;
  const desiredCols = Math.ceil(fullWidth / 20);
  const desiredRows = Math.ceil(increasedHeight / 20);
  const spacingX = fullWidth / (desiredCols - 1);
  const spacingY = increasedHeight / (desiredRows - 1);
  
  // Create dots
  function createDotGrid() {
    dotGrid.innerHTML = "";
    for (let y = 0; y < desiredRows; y++) {
      for (let x = 0; x < desiredCols; x++) {
        const dot = document.createElement("div");
        dot.className = "dot";
        dot.textContent = "✦";
        const xPos = x * spacingX - containerPadding;
        dot.style.left = `${xPos}px`;
        dot.style.top = `${y * spacingY}px`;
        dotGrid.appendChild(dot);
      }
    }
  }
  
  createDotGrid();
  
  // Mouse interaction
  let isMouseMoving = false;
  let mouseTimeout;
  
  dotGrid.addEventListener("mousemove", (e) => {
    const rect = dotGrid.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    isMouseMoving = true;
    clearTimeout(mouseTimeout);
    updateDots(mouseX, mouseY);
    
    mouseTimeout = setTimeout(() => {
      isMouseMoving = false;
    }, 100);
  });
  
  function updateDots(mouseX, mouseY) {
    const dots = document.querySelectorAll(".dot");
    const velocity = isMouseMoving ? 1.5 : 1;
    const maxDistance = isMouseMoving ? 150 : 100;
    
    dots.forEach((dot) => {
      const dotX = parseInt(dot.style.left) + containerPadding;
      const dotY = parseInt(dot.style.top);
      const distance = Math.sqrt(Math.pow(mouseX - dotX, 2) + Math.pow(mouseY - dotY, 2));
      
      if (distance < maxDistance) {
        const intensity = Math.pow(1 - distance / maxDistance, 1.5) * velocity;
        dot.style.color = `rgba(255, 255, 255, ${Math.min(intensity, 1)})`;
        const angle = Math.atan2(dotY - mouseY, dotX - mouseX);
        const pushDistance = intensity * 12;
        const newX = Math.cos(angle) * pushDistance;
        const newY = Math.sin(angle) * pushDistance;
        dot.style.transform = `translate(${newX}px, ${newY}px) scale(${1 + intensity * 1.2})`;
      } else {
        dot.style.color = "#444";
        dot.style.transform = "none";
      }
    });
  }
  
  dotGrid.addEventListener("mouseleave", () => {
    const dots = document.querySelectorAll(".dot");
    dots.forEach((dot) => {
      dot.style.color = "#444";
      dot.style.transform = "none";
    });
  });
  
  window.addEventListener("resize", createDotGrid);
}