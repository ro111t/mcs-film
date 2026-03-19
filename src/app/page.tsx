import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ProfileCard";
import { ArrowRight } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Divider accent line */}
      <div className="relative">
        <div className="mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </div>

      {/* Featured members */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="mb-16 flex flex-col items-center text-center">
          <FadeIn>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              The Collective
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Meet Our Members
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 max-w-md text-muted">
              Talented filmmakers and creatives shaping the future of cinema
            </p>
          </FadeIn>
        </div>

        {profiles && profiles.length > 0 ? (
          <StaggerChildren className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:gap-8">
            {profiles.map((profile) => (
              <StaggerItem key={profile.id}>
                <ProfileCard profile={profile} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        ) : (
          <FadeIn className="text-center">
            <div className="gradient-border mx-auto max-w-md rounded-2xl bg-surface p-16">
              <p className="text-lg text-muted">
                The stage is being set.
                <br />
                <span className="text-foreground/50">Check back soon.</span>
              </p>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={0.3} className="mt-12 text-center">
          <Link
            href="/members"
            className="group inline-flex items-center gap-2 text-sm font-medium text-accent transition-all duration-300 hover:gap-3"
          >
            View all members
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </FadeIn>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-surface to-background" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <FadeIn className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Part of the club?
            </h2>
            <p className="mt-3 text-muted">
              Sign in to build your profile and showcase your work.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 hover:shadow-[0_0_30px_rgba(220,38,38,0.25)]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
