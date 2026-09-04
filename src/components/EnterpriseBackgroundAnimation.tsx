import React, { useEffect, useRef } from 'react';

export interface EnterpriseBackgroundAnimationProps {
  intensity?: 'subtle' | 'medium' | 'high';
  interactive?: boolean;
  showCodeStreams?: boolean;
}

// Sample access code tokens for digital matrix streams
const ACCESS_CODE_TOKENS = [
  '0x7F2A', 'SYS_OK', 'AUTH_2026', '1010110', 'ACCESS_GRANTED', 
  'ZYQITEK', '0x9E81', 'SECURE_KEY', 'SESSION_OK', '01011', 
  '0xFA3C', 'KEY_VAL', 'AES_256', 'CSRF_VALID', 'LOGIN_OK', 
  '0x88F', 'PORT_3000', 'SSL_ACTIVE', '01001001', 'TOKEN_99',
  'HEX_32', 'AUTH_CODE', 'SYS_NODE', '0x3D11', 'ENCRYPT', 'OK'
];

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface CodeColumn {
  x: number;
  y: number;
  speed: number;
  fontSize: number;
  text: string;
  alpha: number;
  color: string;
  updateInterval: number;
  lastUpdate: number;
}

export const EnterpriseBackgroundAnimation: React.FC<EnterpriseBackgroundAnimationProps> = ({
  intensity = 'high',
  interactive = true,
  showCodeStreams = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Dynamic scaling based on intensity
    const intensityMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'medium' ? 0.8 : 1.2;

    // 1. Particle Nodes Configuration
    const particleCount = Math.min(Math.floor(((width * height) / 16000) * intensityMultiplier), 70);
    const particles: ParticleNode[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.6 + 0.8,
        baseAlpha: Math.random() * 0.35 + 0.15,
        alpha: 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // 2. Access Code Digital Rain Columns
    const codeColors = [
      'rgba(163, 230, 53, ', // Lime
      'rgba(52, 211, 153, ',  // Emerald
      'rgba(99, 102, 241, ',  // Indigo
      'rgba(6, 182, 212, ',   // Cyan
      'rgba(244, 244, 245, '  // White
    ];

    const columnCount = showCodeStreams 
      ? Math.min(Math.floor((width / 45) * intensityMultiplier), 32)
      : 0;

    const columns: CodeColumn[] = [];
    for (let i = 0; i < columnCount; i++) {
      const fontSize = Math.floor(Math.random() * 4 + 10);
      columns.push({
        x: (i * (width / columnCount)) + (Math.random() * 20 - 10),
        y: Math.random() * height * 1.5 - height * 0.5,
        speed: Math.random() * 1.2 + 0.5,
        fontSize,
        text: ACCESS_CODE_TOKENS[Math.floor(Math.random() * ACCESS_CODE_TOKENS.length)],
        alpha: Math.random() * 0.4 + 0.1,
        color: codeColors[Math.floor(Math.random() * codeColors.length)],
        updateInterval: Math.floor(Math.random() * 20 + 10),
        lastUpdate: 0,
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;
    let scanlineY = 0;

    const render = () => {
      time += 0.02;
      scanlineY = (scanlineY + 1.2) % (height + 200);

      ctx.clearRect(0, 0, width, height);

      // A. Ambient Glow Orbs
      const glow1X = width * 0.3 + Math.sin(time * 0.5) * 80;
      const glow1Y = height * 0.4 + Math.cos(time * 0.4) * 60;
      const grad1 = ctx.createRadialGradient(glow1X, glow1Y, 10, glow1X, glow1Y, width * 0.45);
      grad1.addColorStop(0, 'rgba(79, 70, 229, 0.08)');
      grad1.addColorStop(0.5, 'rgba(67, 56, 202, 0.03)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const glow2X = width * 0.75 + Math.cos(time * 0.6) * 90;
      const glow2Y = height * 0.6 + Math.sin(time * 0.5) * 70;
      const grad2 = ctx.createRadialGradient(glow2X, glow2Y, 10, glow2X, glow2Y, width * 0.4);
      grad2.addColorStop(0, 'rgba(163, 230, 53, 0.06)');
      grad2.addColorStop(0.6, 'rgba(16, 185, 129, 0.02)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // B. Interactive Mouse Radial Aura
      if (interactive && mouseX > 0 && mouseY > 0) {
        const mouseGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 280);
        mouseGrad.addColorStop(0, 'rgba(163, 230, 53, 0.12)');
        mouseGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
        mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = mouseGrad;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 280, 0, Math.PI * 2);
        ctx.fill();
      }

      // C. Render Access Code Digital Rain Columns
      if (showCodeStreams) {
        ctx.textBaseline = 'top';
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          col.y += col.speed;
          col.lastUpdate++;

          // Random token mutation to simulate real-time code cracking / decryption
          if (col.lastUpdate > col.updateInterval) {
            col.text = ACCESS_CODE_TOKENS[Math.floor(Math.random() * ACCESS_CODE_TOKENS.length)];
            col.lastUpdate = 0;
          }

          // Reset column when it goes past screen bottom
          if (col.y > height + 50) {
            col.y = -60;
            col.x = Math.random() * width;
            col.text = ACCESS_CODE_TOKENS[Math.floor(Math.random() * ACCESS_CODE_TOKENS.length)];
          }

          // Calculate distance to mouse for highlight boost
          let alphaBoost = 1;
          if (interactive && mouseX > 0 && mouseY > 0) {
            const dx = col.x - mouseX;
            const dy = col.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              alphaBoost = 1.8 - (dist / 180) * 0.8;
            }
          }

          const currentAlpha = Math.min(0.8, col.alpha * alphaBoost);
          ctx.font = `${col.fontSize}px "JetBrains Mono", "Fira Code", monospace`;
          ctx.fillStyle = `${col.color}${currentAlpha})`;

          // Draw Glowing Main Access Code Text
          ctx.fillText(col.text, col.x, col.y);

          // Draw trailing faint binary digits
          const trailingText = (Math.sin(time + i) > 0 ? '101' : '010');
          ctx.font = `${col.fontSize - 2}px monospace`;
          ctx.fillStyle = `${col.color}${currentAlpha * 0.4})`;
          ctx.fillText(trailingText, col.x, col.y - col.fontSize - 4);
        }
      }

      // D. Update and Draw Particle Nodes & Constellations
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.alpha = p.baseAlpha + Math.sin(time * p.pulseSpeed * 50 + p.pulseOffset) * 0.12;

        // Slight push from mouse
        if (interactive && mouseX > 0 && mouseY > 0) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            const force = (150 - dist) / 150;
            p.x += (dx / dist) * force * 0.9;
            p.y += (dy / dist) * force * 0.9;
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(199, 210, 254, ${Math.max(0.08, p.alpha)})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 140;
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.15 * (intensity === 'subtle' ? 0.6 : 1);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(165, 180, 252, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // E. Horizontal Laser Scanline Sweep Effect
      const scanGrad = ctx.createLinearGradient(0, scanlineY - 40, 0, scanlineY);
      scanGrad.addColorStop(0, 'rgba(163, 230, 53, 0)');
      scanGrad.addColorStop(0.9, 'rgba(163, 230, 53, 0.04)');
      scanGrad.addColorStop(1, 'rgba(163, 230, 53, 0.08)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanlineY - 40, width, 40);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity, interactive, showCodeStreams]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 block w-full h-full"
    />
  );
};
