import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import zyqitekBannerImg from '../assets/images/zyqitek_banner_1784722875119.jpg';

interface Particle {
  x: number;
  y: number;
  z: number; // depth 0.1 to 1
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
}

export default function LoginBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen resolution to dynamically disable performance-heavy effects
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mouse movement for subtle 3D parallax
  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePos({ x, y });
      mouseRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // 60 FPS Particle Canvas System
  useEffect(() => {
    if (isMobile) return; // Skip entirely on mobile viewports for 60 FPS login stability

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

    // Particle colors: Neon green, Emerald, Pure White
    const colors = [
      'rgba(163, 230, 53, ',  // lime-400
      'rgba(74, 222, 128, ',  // emerald-400
      'rgba(255, 255, 255, ',  // white
      'rgba(132, 204, 22, '   // lime-500
    ];

    // Initialize 48 3D particles & dust
    const particleCount = 48;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const z = Math.random() * 0.9 + 0.1;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        size: (Math.random() * 2.5 + 0.8) * z,
        speedX: (Math.random() - 0.5) * 0.3 * z,
        speedY: -(Math.random() * 0.4 + 0.15) * z,
        opacity: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Parallax offsets based on cursor
      const targetOffX = (mouseRef.current.x - 0.5) * 20;
      const targetOffY = (mouseRef.current.y - 0.5) * 20;

      // Draw Floor Light Sweep Effect
      const sweepX = ((Math.sin(time * 0.8) + 1) / 2) * width;
      const floorGrad = ctx.createRadialGradient(
        sweepX, height * 0.85, 10,
        sweepX, height * 0.85, width * 0.35
      );
      floorGrad.addColorStop(0, 'rgba(163, 230, 53, 0.08)');
      floorGrad.addColorStop(0.5, 'rgba(74, 222, 128, 0.03)');
      floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, height * 0.65, width, height * 0.35);

      // Render & Update Particles
      particles.forEach((p) => {
        p.x += p.speedX + Math.sin(time + p.pulsePhase) * 0.15;
        p.y += p.speedY;
        p.pulsePhase += p.pulseSpeed;

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = Math.max(
          0.1,
          p.opacity * (0.7 + 0.3 * Math.sin(p.pulsePhase))
        );

        // Apply Parallax shift based on depth Z
        const px = p.x + targetOffX * p.z;
        const py = p.y + targetOffY * p.z;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentOpacity})`;

        // Glow for larger particles
        if (p.size > 1.8) {
          ctx.shadowBlur = p.size * 6;
          ctx.shadowColor = 'rgba(163, 230, 53, 0.8)';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();
      });

      // Soft Holographic Grid Line animation on canvas
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.025)';
      ctx.lineWidth = 1;
      const gridY = (time * 15) % 40;
      for (let y = gridY; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile]);

  const parallaxX = (mousePos.x - 0.5) * 15;
  const parallaxY = (mousePos.y - 0.5) * 15;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* BASE LAYER: Static Uploaded Image (Exact & Unmodified) */}
      <img
        src={zyqitekBannerImg}
        alt="Background Workspace"
        className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-transform duration-700 ease-out"
        style={{
          transform: !isMobile ? `translate3d(${parallaxX * 0.3}px, ${parallaxY * 0.3}px, 0) scale(1.04)` : undefined,
          willChange: !isMobile ? 'transform' : undefined,
        }}
        referrerPolicy="no-referrer"
      />

      {/* 1. Subtle Dark Vignette & Overlay (Preserving exact image details while assuring form readability) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/65 backdrop-blur-[0.5px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* 2. Soft Ambient Glow directly aligned over the large Zyqitek "Z" Logo in the image */}
      {!isMobile ? (
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-[28%] right-[15%] w-[380px] h-[380px] bg-lime-400/25 rounded-full blur-[110px] pointer-events-none"
          style={{
            transform: `translate3d(${parallaxX * 0.8}px, ${parallaxY * 0.8}px, 0)`,
          }}
        />
      ) : (
        <div className="absolute top-[28%] right-[15%] w-[380px] h-[380px] bg-lime-400/15 rounded-full blur-[110px] pointer-events-none" />
      )}
      
      {/* Additional Secondary Logo Halo Sheen */}
      <div 
        className="absolute top-[32%] right-[18%] w-[260px] h-[260px] bg-emerald-400/20 rounded-full blur-[70px] pointer-events-none"
        style={!isMobile ? {
          transform: `translate3d(${parallaxX * 1.1}px, ${parallaxY * 1.1}px, 0)`,
        } : undefined}
      />

      {/* 3. Soft Volumetric Light Rays emanating from roof seam */}
      {!isMobile && (
        <motion.div
          animate={{
            opacity: [0.15, 0.35, 0.15],
            rotate: [-1, 1, -1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-[20%] right-[10%] w-[600px] h-[900px] bg-gradient-to-b from-lime-400/20 via-emerald-500/5 to-transparent blur-2xl origin-top-right transform -rotate-12 pointer-events-none"
        />
      )}

      {/* 4. Canvas for 60 FPS GPU-accelerated floating green particles & dust */}
      {!isMobile && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* 5. Floating Transparent Glass Cubes with 3D Rotation */}
      {!isMobile && (
        <motion.div
          animate={{
            y: [-12, 12, -12],
            rotateX: [0, 180, 360],
            rotateY: [0, 360, 0],
            rotateZ: [0, 90, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-[20%] left-[12%] w-16 h-16 rounded-xl border border-[var(--crm-card-border)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)]/5 backdrop-blur-md shadow-[0_0_20px_rgba(163,230,53,0.15)] pointer-events-none"
          style={{
            perspective: 1000,
            transformStyle: 'preserve-3d',
            transform: `translate3d(${parallaxX * 1.5}px, ${parallaxY * 1.5}px, 0)`,
          }}
        >
          <div className="absolute inset-0 rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/10 to-transparent" />
        </motion.div>
      )}

      {!isMobile && (
        <motion.div
          animate={{
            y: [10, -15, 10],
            rotateX: [360, 0, 360],
            rotateY: [0, -180, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-[22%] left-[38%] w-12 h-12 rounded-lg border border-lime-400/25 bg-lime-400/5 backdrop-blur-sm shadow-[0_0_15px_rgba(163,230,53,0.2)] pointer-events-none"
          style={{
            transform: `translate3d(${parallaxX * 1.2}px, ${parallaxY * 1.2}px, 0)`,
          }}
        />
      )}

      {/* 6. Holographic Geometric Wireframes */}
      {!isMobile && (
        <motion.div
          animate={{
            rotate: 360,
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
            scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute top-[62%] right-[8%] w-24 h-24 border border-lime-400/30 rounded-full flex items-center justify-center pointer-events-none hidden lg:flex"
          style={{
            transform: `translate3d(${parallaxX * 1.4}px, ${parallaxY * 1.4}px, 0)`,
          }}
        >
          <div className="w-16 h-16 border border-emerald-400/20 rotate-45" />
          <div className="w-8 h-8 rounded-full bg-lime-400/20 blur-xs" />
        </motion.div>
      )}

      {/* 7. Light Sweep Effect over the ground/background seam */}
      {!isMobile && (
        <motion.div
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut',
          }}
          className="absolute bottom-[18%] left-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-lime-400/80 to-transparent blur-[1px] pointer-events-none"
        />
      )}

      {/* 8. Interactive Cursor Radial Follower Glow */}
      {!isMobile && (
        <div
          className="absolute w-[450px] h-[450px] rounded-full bg-gradient-radial from-lime-400/12 via-emerald-500/5 to-transparent blur-3xl pointer-events-none transition-transform duration-300 ease-out"
          style={{
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  );
}
