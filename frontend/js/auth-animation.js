/**
 * CO-ORD — Igloo.inc Inspired Interactive Canvas Animation
 * Renders an organic particle-mesh wave with flowing silver nodes, deep blue connections,
 * and mouse-reactive fluid physics on obsidian black backdrop.
 */

export function initIglooAnimation(canvasId = "iglooCanvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let particles = [];
  let mouse = { x: null, y: null, targetX: null, targetY: null, radius: 160 };

  function resize() {
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
    initParticles();
  }

  window.addEventListener("resize", resize);

  // Mouse interactivity with smoothing
  const visualPane = canvas.parentElement;
  visualPane.addEventListener("mousemove", (e) => {
    const rect = visualPane.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // Optional 3D tilt for floating cards
    const cards = visualPane.querySelectorAll(".float-card");
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((mouse.y - centerY) / centerY) * -7;
    const rotateY = ((mouse.x - centerX) / centerX) * 7;

    cards.forEach((card, i) => {
      const factor = (i + 1) * 0.4;
      card.style.transform = `perspective(1000px) rotateX(${rotateX * factor}deg) rotateY(${rotateY * factor}deg) translateY(-${i * 3}px)`;
    });
  });

  visualPane.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
    const cards = visualPane.querySelectorAll(".float-card");
    cards.forEach(card => {
      card.style.transform = "";
    });
  });

  // Particle Class with physics
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.85;
      this.vy = (Math.random() - 0.5) * 0.85;
      this.baseRadius = Math.random() * 2.2 + 1;
      this.radius = this.baseRadius;
      this.silverShade = Math.random() > 0.4; // 60% silver, 40% deep-blue
      this.alpha = Math.random() * 0.6 + 0.3;
      this.angle = Math.random() * Math.PI * 2;
      this.waveSpeed = 0.02 + Math.random() * 0.02;
    }

    update() {
      this.angle += this.waveSpeed;
      this.x += this.vx + Math.sin(this.angle) * 0.4;
      this.y += this.vy + Math.cos(this.angle) * 0.4;

      // Wrap around edges
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;

      // Mouse displacement
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 3.5;
          this.y -= Math.sin(angle) * force * 3.5;
          this.radius = this.baseRadius * (1 + force * 1.5);
        } else {
          this.radius = this.baseRadius;
        }
      } else {
        this.radius = this.baseRadius;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      if (this.silverShade) {
        ctx.fillStyle = `rgba(241, 245, 249, ${this.alpha})`;
        ctx.shadowColor = "rgba(226, 232, 240, 0.4)";
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha * 1.2})`;
        ctx.shadowColor = "rgba(37, 99, 235, 0.8)";
        ctx.shadowBlur = 12;
      }
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.floor((width * height) / 9000);
    for (let i = 0; i < Math.min(count, 90); i++) {
      particles.push(new Particle());
    }
  }

  function connectParticles() {
    const maxDist = 135;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.28;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);

          // Subtle gradient stroke between silver and deep blue
          const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(226, 232, 240, ${opacity * 0.7})`);
          gradient.addColorStop(1, `rgba(29, 78, 216, ${opacity})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
      }
    }
  }

  // Ambient radial glow
  let glowTick = 0;
  function drawAmbientGlow() {
    glowTick += 0.01;
    const pulseX = width * 0.65 + Math.sin(glowTick) * 50;
    const pulseY = height * 0.35 + Math.cos(glowTick) * 40;

    const radial = ctx.createRadialGradient(pulseX, pulseY, 20, pulseX, pulseY, width * 0.55);
    radial.addColorStop(0, "rgba(37, 99, 235, 0.16)");
    radial.addColorStop(0.4, "rgba(15, 35, 71, 0.08)");
    radial.addColorStop(1, "rgba(5, 7, 14, 0)");

    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    drawAmbientGlow();

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    connectParticles();
    requestAnimationFrame(animate);
  }

  resize();
  animate();
}
