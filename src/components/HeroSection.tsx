"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { TextReveal, FadeIn, MagneticHover } from "./motion";

export default function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Interactive logo mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const [logoHovered, setLogoHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * 0.08);
    mouseY.set((e.clientY - centerY) * 0.08);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setLogoHovered(false);
  };

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated background layers */}
      <div className="absolute inset-0">
        {/* Radial gradient — red tones */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.1)_0%,_transparent_60%)]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Animated red orbs */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-red-600/5 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -20, 30, 0],
            y: [0, 30, -20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-red-600/3 blur-[100px]"
        />
      </div>

      {/* Content */}
      <motion.div
        style={{ opacity, scale, y }}
        className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8"
      >
        <div className="flex flex-col items-center text-center">

          {/* Big interactive MCS logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            onMouseEnter={() => setLogoHovered(true)}
            className="relative mb-6 cursor-pointer"
          >
            {/* Glow ring behind logo */}
            <motion.div
              animate={logoHovered ? {
                boxShadow: "0 0 80px 20px rgba(220,38,38,0.25), 0 0 120px 40px rgba(220,38,38,0.1)",
                scale: 1.05,
              } : {
                boxShadow: "0 0 40px 10px rgba(220,38,38,0.1), 0 0 60px 20px rgba(220,38,38,0.05)",
                scale: 1,
              }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full"
            />
            {/* Pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[-12px] rounded-full border-2 border-accent/20"
            />
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0, 0.15] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute inset-[-24px] rounded-full border border-accent/10"
            />
            {/* The logo itself */}
            <motion.img
              src="/mcs-logo.png"
              alt="Media Creative Society"
              style={{ x: springX, y: springY }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative z-10 h-28 w-28 object-contain drop-shadow-[0_0_30px_rgba(220,38,38,0.3)] sm:h-36 sm:w-36 md:h-44 md:w-44"
              draggable={false}
            />
          </motion.div>

          {/* Main heading — "Media Creative Society" */}
          <h1 className="max-w-5xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <TextReveal delay={0.3} className="block text-foreground">
              Media Creative
            </TextReveal>
            <span className="block bg-gradient-to-r from-accent via-rose-400 to-accent bg-clip-text text-transparent glow-text">
              <TextReveal delay={0.5}>Society</TextReveal>
            </span>
          </h1>

          {/* Subtitle */}
          <FadeIn delay={0.8}>
            <p className="mt-8 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              The creative collective for filmmakers, photographers, and visual
              storytellers. Build your portfolio. Get discovered. Create together.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={1}>
            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <MagneticHover strength={0.15}>
                <Link
                  href="/members"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-accent px-8 py-4 text-sm font-semibold text-white transition-all duration-500 hover:shadow-[0_0_40px_rgba(220,38,38,0.3)]"
                >
                  <span className="relative z-10">Explore Members</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              </MagneticHover>
              <MagneticHover strength={0.15}>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-3 rounded-full border border-border px-8 py-4 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/40 hover:text-accent"
                >
                  Member Login
                </Link>
              </MagneticHover>
            </div>
          </FadeIn>

          {/* Common Sense tagline */}
          <FadeIn delay={1.3}>
            <p className="mt-10 mb-20 text-[11px] font-medium uppercase tracking-[0.25em] text-muted/40">
              MCS — A Common Sense Product
            </p>
          </FadeIn>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted/50">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-accent/50 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
