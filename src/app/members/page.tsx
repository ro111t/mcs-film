import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/ProfileCard";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Members | Frank",
  description: "Browse our film club members and their portfolios",
};

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_visible", true)
    .order("display_name", { ascending: true });

  return (
    <div className="min-h-screen pt-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,168,83,0.06)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <FadeIn>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              The Collective
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Our Members
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 max-w-md text-muted">
              Meet the talented filmmakers and creatives shaping the future of cinema
            </p>
          </FadeIn>
          {profiles && profiles.length > 0 && (
            <FadeIn delay={0.3}>
              <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted/50">
                {profiles.length} member{profiles.length !== 1 ? "s" : ""}
              </p>
            </FadeIn>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        {profiles && profiles.length > 0 ? (
          <StaggerChildren className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6 lg:gap-8">
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
      </div>
    </div>
  );
}
