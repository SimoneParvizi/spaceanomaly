// Footer starfield script - wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  console.log("Footer script DOM loaded");
  
  // Wait a bit for layout to settle
  setTimeout(() => {
    const spaceCanvas = document.getElementById("space");
    console.log("Space canvas found:", spaceCanvas);
    
    if (spaceCanvas) {
      console.log("Starting footer starfield animation");
      
      // Setup canvas and context for footer starfield
      const ctx = spaceCanvas.getContext("2d");
      
      // If canvas has no dimensions, set fallback dimensions
      const width = spaceCanvas.offsetWidth || window.innerWidth;
      const height = spaceCanvas.offsetHeight || window.innerHeight;
      
      spaceCanvas.width = width;
      spaceCanvas.height = height;
      console.log("Canvas dimensions set to:", spaceCanvas.width, "x", spaceCanvas.height);
      
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
        
        // Simple scroll-based black overlay
        function updateShaderOverlay() {
          const shaderSection = document.querySelector(".shader-section");
          if (!shaderSection) return;
          
          const rect = shaderSection.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const sectionHeight = rect.height;
          
          // Start fading when section starts scrolling up, finish when 70% scrolled out
          let progress = 0;
          if (rect.top < windowHeight * 0.3) { // Start fade earlier
            const scrollDistance = (windowHeight * 0.3) - rect.top;
            const maxScroll = sectionHeight * 0.7; // Fade over 70% of section height
            progress = Math.min(scrollDistance / maxScroll, 1);
            
            // Apply easing for smoother transition
            progress = progress * progress; // Quadratic easing
          }
          
          // Apply black overlay with calculated opacity
          const overlayElement = shaderSection;
          overlayElement.style.setProperty('--black-overlay-opacity', progress);
        }
        
        // Add scroll listener
        window.addEventListener('scroll', updateShaderOverlay);
        updateShaderOverlay(); // Initial call
        
        // Smooth transition from starfield to particle section
        gsap.to("#webglSection", {
          backgroundColor: "#000000", // Match the particle section background
          scrollTrigger: {
            trigger: "#stickyContainer",
            start: "80% top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              const progress = self.progress;
              // Gradually fade the starfield canvas
              const canvas = document.querySelector("#space");
              if (canvas) {
                canvas.style.opacity = 1 - (progress * 0.5);
              }
            }
          }
        });
        
        // Pin the webgl section and create warp effect
        const pinTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: "#stickyContainer",
            start: "top top",
            end: "bottom bottom",
            pin: "#webglSection", // Pin the webgl section
            pinSpacing: true, // Allow space for proper flow
            scrub: true,
            onUpdate: (self) => {
              const progress = self.progress;
              console.log("Pin progress:", progress.toFixed(2));
              
              // Update warp speed based on scroll progress (0 to 1)
              warpSpeed = Math.max(0, Math.min(1, progress));
            },
            onLeave: () => {
              console.log("Pin section left - warp speed locked at 1");
              warpSpeed = 1;
            },
            onEnterBack: () => {
              console.log("Pin section re-entered");
              // Speed will be handled by onUpdate
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
        
        // Continue starfield animation after pin ends with decreasing velocity
        const postPinTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: "#additionalSection",
            start: "top bottom",
            end: "top top",
            scrub: true,
            onUpdate: (self) => {
              const progress = self.progress;
              // Decrease warp speed from 1 to 0 as we scroll past the starfield
              const newSpeed = Math.max(0, 1 - progress);
              warpSpeed = newSpeed;
              console.log("Post-pin warp speed:", warpSpeed.toFixed(2));
            },
            onLeave: () => {
              console.log("Post-pin section left - warp speed set to 0");
              warpSpeed = 0;
            },
            onEnterBack: () => {
              console.log("Post-pin section re-entered");
              // Speed will be handled by onUpdate
            }
          }
        });

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
    // Flowing circles animation setup
    const parametricCanvas = document.getElementById("parametricCanvas");
    console.log("Parametric canvas found:", parametricCanvas);
    
    if (parametricCanvas) {
      const ctx = parametricCanvas.getContext("2d");
      
      // Animation frame polyfill and setup
      (function(global) {
        if (global.requestAnimationFrame) { return; }
        if (global.webkitRequestAnimationFrame) {
          global.requestAnimationFrame = global['webkitRequestAnimationFrame'];
          global.cancelAnimationFrame = global['webkitCancelAnimationFrame'] || global['webkitCancelRequestAnimationFrame'];
        }
        var lastTime = 0;
        global.requestAnimationFrame = function(callback) {
          var currTime = new Date().getTime();
          var timeToCall = Math.max(0, 16 - (currTime - lastTime));
          var id = global.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
          lastTime = currTime + timeToCall;
          return id;
        };
        global.cancelAnimationFrame = function(id) { clearTimeout(id); };
      })(window);

      let w, h;
      
      const resizeCanvas = () => {
        const rect = parametricCanvas.getBoundingClientRect();
        w = parametricCanvas.width = rect.width;
        h = parametricCanvas.height = rect.height;
      };

      const PI = Math.PI;
      const HPI = PI / 2;
      const PI2 = PI * 2;
      const RAD = PI / 180;

      const Point = function(x, y) {
        this.x = x || 0;
        this.y = y || 0;
        this.angle = 0;
        this.radius = 0;
        this.radiusAngle = 0;
        this.radiusSpeed = 0;
      };

      const Circle = function(count, normalLength, radiusIn, radiusOut, color, fill, glow) {
        count = count % 1 == 0 ? count : (count + 1);
        this.count = count;
        this.normalLength = normalLength;
        this.radiusIn = radiusIn;
        this.radiusOut = radiusOut;
        this.color = color;
        this.fill = fill;
        this.glow = glow;

        this.angleSpeed = (Math.random() - .5) * RAD * .1;
        this.points = [];
        this.init();
      };

      Circle.prototype = {
        init: function() {
          const step = PI2 / this.count;
          let angle = Math.random() * PI2;
          this.points = [];

          for (let i = 0; i < this.count; i++) {
            angle += step;
            const p = new Point(0, 0);
            p.angle = angle;
            p.radius = 0;
            p.radiusAngle = Math.random() * PI2;
            p.radiusSpeed = RAD + Math.random() * 2 * RAD;
            p.normal = this.normalLength;
            this.points.push(p);
          }
        },

        update: function() {
          const scope = this;
          this.points.forEach(function(p) {
            p.angle += scope.angleSpeed;
            p.radius = scope.radiusIn + (.5 + (.5 * Math.cos(p.radiusAngle))) * scope.radiusOut;
            p.radiusAngle += p.radiusSpeed;

            const x = p.x = Math.cos(p.angle) * p.radius;
            const y = p.y = Math.sin(p.angle) * p.radius;

            p.lx = x + Math.cos(p.angle + HPI) * p.normal;
            p.ly = y + Math.sin(p.angle + HPI) * p.normal;

            p.rx = x + Math.cos(p.angle - HPI) * p.normal;
            p.ry = y + Math.sin(p.angle - HPI) * p.normal;
          });
        },

        render: function(ctx) {
          if (this.glow != null) {
            ctx.shadowColor = '#FFF';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }

          ctx.strokeStyle = this.color;
          ctx.beginPath();
          this.points.forEach(function(p, i, a) {
            const n = a[(i + 1) % a.length];
            ctx.lineTo(p.x, p.y);
            ctx.bezierCurveTo(p.lx, p.ly, n.rx, n.ry, n.x, n.y);
          });

          if (this.fill != null) {
            ctx.lineWidth = 3;
            ctx.fillStyle = this.fill;
            ctx.fill();
          }

          ctx.stroke();
          ctx.lineWidth = 1;
        }
      };

      const circles = [];
      const pointCount = 20;
      const radiusIn = Math.min(w, h) * 0.15;
      const radiusOut = 40;
      const normal = 30;

      function initCircles(count, pointCount, normal, radiusIn, radiusOut, colors, fills, glow) {
        for (let i = 0; i < count; i++) {
          const c = new Circle(pointCount, normal, radiusIn, radiusOut, 
            colors[i % colors.length], 
            fills != null ? fills[i % fills.length] : null, 
            glow);
          circles.push(c);
        }
      }

      let animationId;

      function update() {
        animationId = requestAnimationFrame(update);

        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2);

        circles.forEach(function(c) {
          c.update();
          c.render(ctx);
        });

        ctx.restore();
      }

      // Initialize canvas and animation
      resizeCanvas();
      
      const strokeColors = ["rgba(255,255,255,0.3)"];
      const fillColors = ["rgba(0,0,0,.8)"];

      initCircles(3, pointCount, normal, Math.min(w, h) * 0.15, radiusOut, strokeColors, null, true);
      initCircles(1, 12, 20, Math.min(w, h) * 0.05, radiusOut / 3, ["rgba(255,255,255,0.5)"], fillColors, true);

      // Handle resize
      window.addEventListener("resize", () => {
        resizeCanvas();
        // Reinitialize circles with new dimensions
        circles.length = 0;
        initCircles(3, pointCount, normal, Math.min(w, h) * 0.15, radiusOut, strokeColors, null, true);
        initCircles(1, 12, 20, Math.min(w, h) * 0.05, radiusOut / 3, ["rgba(255,255,255,0.5)"], fillColors, true);
      });

      // Start animation
      update();

      // Stop animation when out of view to save performance
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!animationId) {
              update();
            }
          } else {
            if (animationId) {
              cancelAnimationFrame(animationId);
              animationId = null;
            }
          }
        });
      }, { threshold: 0 });

      observer.observe(parametricCanvas);
    }

    // Setup center-out character animation for "THE ART OF REDUCTION"
    setupCenterOutCharAnimation();
  }, 500);

  // Function to set up the center-out character animation
  function setupCenterOutCharAnimation() {
    // Initialize Splitting.js functionality
    const Splitting = function () {
      const elements = document.querySelectorAll("[data-splitting]");

      elements.forEach((element) => {
        // Split text into words and chars
        const text = element.textContent;
        const words = text.split(" ");

        element.innerHTML = words
          .map((word) => {
            return `<span class="word" style="position: relative; display: inline-block; margin-right: 0.25em;">${Array.from(
              word
            )
              .map(
                (char) =>
                  `<span class="char" style="position: relative; display: inline-block;">${char}</span>`
              )
              .join("")}</span>`;
          })
          .join(" ");

        return {
          elements,
          words: document.querySelectorAll(".word"),
          chars: document.querySelectorAll(".char")
        };
      });

      return { results: elements };
    };

    // Execute splitting
    Splitting();

    // Apply center-out animation
    const animatedTitles = [
      ...document.querySelectorAll(
        "h2[data-splitting][data-center-animation]"
      )
    ];

    animatedTitles.forEach((title) => {
      const words = title.querySelectorAll(".word");

      for (const word of words) {
        const chars = word.querySelectorAll(".char");

        // Create a timeline for better control
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: word,
            start: "center bottom+=30%",
            end: "top top+=15%",
            scrub: 0.5,
            invalidateOnRefresh: true,
            toggleActions: "restart pause resume reset"
          }
        });

        // Add the animation to the timeline
        tl.fromTo(
          chars,
          {
            "will-change": "opacity, transform",
            x: (position, _, arr) => 150 * (position - arr.length / 2),
            opacity: 0.5
          },
          {
            ease: "power1.inOut",
            x: 0,
            opacity: 1,
            stagger: {
              grid: "auto",
              from: "center"
            }
          }
        );
      }
    });
  }
  
}); // End DOMContentLoaded