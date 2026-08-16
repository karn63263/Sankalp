import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  life: number; maxLife: number;
}

export default function ParticleField({ count = 60 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const spawn = (): Particle => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.55 + 0.1,
      life: 0,
      maxLife: Math.random() * 400 + 200,
    });

    particles.current = Array.from({ length: count }, spawn);

    const REPEL_RADIUS = 100;
    const REPEL_STRENGTH = 1.4;
    const DAMPING = 0.96;

    const draw = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      const mx = mouse.current.x, my = mouse.current.y;

      for (let i = 0; i < particles.current.length; i++) {
        const a = particles.current[i];
        for (let j = i + 1; j < particles.current.length; j++) {
          const b = particles.current[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(57,217,138,${(1 - dist / 110) * 0.09})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      for (const p of particles.current) {
        // Mouse repulsion
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          p.vx += (dx / dist) * force * REPEL_STRENGTH * 0.12;
          p.vy += (dy / dist) * force * REPEL_STRENGTH * 0.12;
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;

        // Clamp velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 2) { p.vx = (p.vx / speed) * 2; p.vy = (p.vy / speed) * 2; }

        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > h) { p.y = h; p.vy *= -1; }

        const lifeRatio = p.life / p.maxLife;
        const fade = lifeRatio < 0.08 ? lifeRatio / 0.08 : lifeRatio > 0.9 ? (1 - lifeRatio) / 0.1 : 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        // Particles near mouse glow brighter
        const glow = dist < REPEL_RADIUS ? (1 - dist / REPEL_RADIUS) * 0.5 : 0;
        ctx.fillStyle = `rgba(57,217,138,${(p.opacity + glow) * fade})`;
        ctx.fill();

        if (p.life > p.maxLife) Object.assign(p, spawn());
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
