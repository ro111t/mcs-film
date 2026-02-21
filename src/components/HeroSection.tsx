"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Animated background layers */}
      <div className="absolute inset-0">
        {/* Radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(78,205,196,0.08)_0%,_transparent_70%)]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Animated orbs */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -20, 30, 0],
            y: [0, 30, -20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-accent/3 blur-[100px]"
        />
      </div>

      {/* Content */}
      <motion.div
        style={{ opacity, scale, y }}
        className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8"
      >
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow */}
          <FadeIn delay={0.2}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "auto" }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-8 overflow-hidden rounded-full border border-accent/20 bg-accent/5 px-5 py-2"
            >
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-accent">
                A Film Community
              </span>
            </motion.div>
          </FadeIn>

          {/* Main heading */}
          <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <TextReveal delay={0.3} className="block text-foreground">
              Where Stories
            </TextReveal>
            <span className="block bg-gradient-to-r from-accent via-cyan-300 to-accent bg-clip-text text-transparent glow-text">
              <TextReveal delay={0.5}>Come Alive</TextReveal>
            </span>
          </h1>

          {/* Subtitle */}
          <FadeIn delay={0.8}>
            <p className="mt-8 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              A private collective for filmmakers to build their presence,
              share portfolios, and connect through the art of cinema.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={1}>
            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <MagneticHover strength={0.15}>
                <Link
                  href="/members"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-accent px-8 py-4 text-sm font-semibold text-background transition-all duration-500 hover:shadow-[0_0_40px_rgba(78,205,196,0.3)]"
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
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
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
