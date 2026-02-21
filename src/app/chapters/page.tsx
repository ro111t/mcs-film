import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, Users, Globe, Plus, ArrowRight, Film } from "lucide-react";
import type { Chapter } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chapters | Frank",
  description: "Find a Frank chapter at your school",
};

export default async function ChaptersPage() {
  const supabase = await createClient();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  // Get member counts per chapter
  const chapterList = chapters || [];
  const memberCounts: Record<string, number> = {};
  if (chapterList.length > 0) {
    const ids = chapterList.map((c: Chapter) => c.id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("chapter_id")
      .in("chapter_id", ids)
      .eq("is_visible", true);
    (profiles || []).forEach((p: any) => {
      memberCounts[p.chapter_id] = (memberCounts[p.chapter_id] || 0) + 1;
    });
  }

  // Check if current user is admin (for create button)
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("member_role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.member_role === "admin";
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8 lg:py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Network
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Chapters
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            Frank chapters at schools across the country. Find yours, or start one.
          </p>
        </div>

        {/* Chapter grid */}
        {chapterList.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {chapterList.map((chapter: Chapter) => (
              <Link
                key={chapter.id}
                href={`/chapters/${chapter.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 hover:border-accent/30 hover:shadow-[0_0_40px_rgba(78,205,196,0.06)]"
              >
                {/* Banner */}
                <div className="relative h-32 overflow-hidden bg-surface-light">
                  {chapter.banner_url ? (
                    <img src={chapter.banner_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${chapter.accent_color}15, transparent)` }}>
                      <Film className="h-10 w-10" style={{ color: chapter.accent_color, opacity: 0.3 }} />
                    </div>
                  )}
                  {chapter.logo_url && (
                    <div className="absolute bottom-3 left-4">
                      <img src={chapter.logo_url} alt="" className="h-10 w-10 rounded-xl border-2 border-background object-cover shadow-lg" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                    {chapter.name}
                  </h3>
                  {chapter.school && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <MapPin className="h-3 w-3" />
                      {chapter.school}
                    </p>
                  )}
                  {chapter.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{chapter.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <Users className="h-3.5 w-3.5" />
                      {memberCounts[chapter.id] || 0} member{(memberCounts[chapter.id] || 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-all duration-300 group-hover:opacity-100">
                      View <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-surface py-20 text-center">
            <Film className="mx-auto mb-4 h-16 w-16 text-border-light" />
            <p className="text-lg font-semibold text-foreground">No chapters yet</p>
            <p className="mt-2 text-sm text-muted">Be the first to start a Frank chapter at your school.</p>
          </div>
        )}

        {/* Start a chapter CTA */}
        <div className="mt-12 rounded-3xl border border-border bg-surface p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Start a Chapter at Your School</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Want to bring Frank to your campus? Start a chapter and build your film &amp; media community.
          </p>
          {isAdmin ? (
            <Link
              href="/chapters/create"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80"
            >
              <Plus className="h-4 w-4" />
              Create Chapter
            </Link>
          ) : user ? (
            <p className="mt-4 text-xs text-muted">
              Contact an admin to create a new chapter.
            </p>
          ) : (
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80"
            >
              Sign Up to Get Started
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
