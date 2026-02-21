import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Users, Globe, User, ArrowRight, Film } from "lucide-react";
import type { Chapter, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("name, school, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!chapter) return { title: "Chapter Not Found | Frank" };

  return {
    title: `${chapter.name} | Frank`,
    description: chapter.description || `${chapter.name} — ${chapter.school}`,
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!chapter) notFound();

  // Get chapter members
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .eq("chapter_id", chapter.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: true });

  const memberList: Profile[] = members || [];

  // Get upcoming events for this chapter
  const { data: events } = await supabase
    .from("events")
    .select("id, title, event_date, event_type, location")
    .eq("chapter_id", chapter.id)
    .eq("is_published", true)
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(3);

  const upcomingEvents = events || [];

  return (
    <div className="min-h-screen pt-24">
      {/* Banner */}
      <div className="relative overflow-hidden">
        {chapter.banner_url ? (
          <div className="relative aspect-[4/1] w-full overflow-hidden">
            <img src={chapter.banner_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>
        ) : (
          <div
            className="relative h-48 w-full sm:h-64"
            style={{ background: `linear-gradient(135deg, ${chapter.accent_color}15, transparent)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="-mt-12">
          <Link
            href="/chapters"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-all duration-300 hover:gap-3 hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            All Chapters
          </Link>

          <div className="flex items-start gap-5">
            {chapter.logo_url ? (
              <img src={chapter.logo_url} alt="" className="h-20 w-20 rounded-2xl border-4 border-background object-cover shadow-xl" />
            ) : (
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-background shadow-xl"
                style={{ backgroundColor: `${chapter.accent_color}15` }}
              >
                <Film className="h-8 w-8" style={{ color: chapter.accent_color }} />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {chapter.name}
              </h1>
              {chapter.school && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-4 w-4" />
                  {chapter.school}
                </p>
              )}
              {chapter.description && (
                <p className="mt-3 max-w-xl text-muted">{chapter.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Users className="h-3.5 w-3.5" />
                  {memberList.length} member{memberList.length !== 1 ? "s" : ""}
                </span>
                {chapter.website_url && (
                  <a
                    href={chapter.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-accent"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Upcoming Events
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {upcomingEvents.map((event: any) => (
                <div key={event.id} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs font-medium text-accent">
                    {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">{event.title}</p>
                  {event.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="mt-12 pb-16">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Members
          </h2>
          {memberList.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memberList.map((member) => (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all duration-300 hover:border-accent/30"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-light">
                    {member.headshot_url ? (
                      <img src={member.headshot_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-6 w-6 text-border-light" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-foreground transition-colors group-hover:text-accent">
                      {member.display_name || "Unnamed"}
                    </p>
                    <p className="truncate text-xs text-muted">{member.role || "Member"}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted opacity-0 transition-all group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface py-12 text-center">
              <p className="text-sm text-muted">No members yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
