import { useEffect, useRef } from "react";

export default function ParticleBackground({ darkMode }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 60;
    const COLOR = darkMode ? "99, 102, 255" : "108, 99, 255";

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }
      update(time) {
        this.x += this.speedX;
        this.y += this.speedY;
        const pulse = Math.sin(time * this.pulseSpeed + this.pulseOffset);
        this.currentOpacity = this.opacity + pulse * 0.1;

        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          this.x -= dx * force * 0.03;
          this.y -= dy * force * 0.03;
        }

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR}, ${this.currentOpacity})`;
        ctx.fill();
      }
    }

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

    const drawConnections = () => {
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const opacity = (1 - dist / 100) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${COLOR}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;
      particlesRef.current.forEach(p => { p.update(time); p.draw(); });
      drawConnections();
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouse = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouse);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: darkMode ? 0.8 : 0.4,
      }}
    />
  );
}