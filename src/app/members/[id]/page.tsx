import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SectionRenderer from "@/components/SectionRenderer";
import PortfolioGrid from "@/components/PortfolioGrid";
import ViewTracker from "@/components/ViewTracker";
import ReportButton from "@/components/ReportButton";
import { User, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ProfileSection, PortfolioItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function SocialIcon({ type, className }: { type: string; className?: string }) {
  const cn = className || "h-4 w-4";
  switch (type) {
    case "instagram":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "vimeo":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 7.42c-.09 1.95-1.45 4.62-4.08 8.02C15.2 18.81 12.85 20.5 10.94 20.5c-1.18 0-2.18-1.09-3-3.27l-1.64-6C5.66 9.05 4.96 7.96 4.2 7.96c-.15 0-.66.31-1.54.93L1.6 7.57c.97-.85 1.92-1.71 2.87-2.56 1.29-1.12 2.26-1.71 2.91-1.77 1.53-.15 2.47.9 2.83 3.14.39 2.42.66 3.93.81 4.52.45 2.05.95 3.07 1.49 3.07.42 0 1.05-.67 1.9-2 .84-1.34 1.29-2.36 1.35-3.06.12-1.16-.33-1.74-1.36-1.74-.48 0-.98.11-1.5.33 1-.33 2.95-4.81 7.1-3.58z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
        </svg>
      );
    case "imdb":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 4v16h20V4H2zm2.5 12.5V7.5H6v9H4.5zm3.5 0V7.5h2.25l1.12 5.62 1.13-5.62H14.75v9H13.25V11l-1.25 5.5h-1l-1.25-5.5v5.5H8zm8.5 0V7.5h2.25c1.38 0 2.25.87 2.25 2.25v5c0 1.38-.87 2.25-2.25 2.25H16.5zm1.5-1.5h.75c.41 0 .75-.34.75-.75v-5c0-.41-.34-.75-.75-.75H18v6.5z" />
        </svg>
      );
    default:
      return <Globe className={cn} />;
  }
}

const SOCIAL_LINKS = [
  { key: "instagram_url", icon: "instagram", label: "Instagram" },
  { key: "vimeo_url", icon: "vimeo", label: "Vimeo" },
  { key: "youtube_url", icon: "youtube", label: "YouTube" },
  { key: "imdb_url", icon: "imdb", label: "IMDb" },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", id)
    .eq("is_visible", true)
    .single();

  if (!profile) return { title: "Member Not Found | Frank" };

  return {
    title: `${profile.display_name} | Frank`,
    description: profile.role
      ? `${profile.display_name} — ${profile.role}`
      : `${profile.display_name}'s profile on Frank`,
  };
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("is_visible", true)
    .single();

  if (!profile) notFound();

  const [itemsRes, sectionsRes] = await Promise.all([
    supabase.from("portfolio_items").select("*").eq("profile_id", id).order("sort_order", { ascending: true }),
    supabase.from("profile_sections").select("*").eq("profile_id", id).eq("is_visible", true).order("sort_order", { ascending: true }),
  ]);

  const allItems: PortfolioItem[] = itemsRes.data || [];
  const sections: ProfileSection[] = sectionsRes.data || [];
  const unassignedItems = allItems.filter((item) => !item.section_id || !sections.some((s) => s.id === item.section_id));
  const socials = SOCIAL_LINKS.filter((s) => profile[s.key]);

  return (
    <div className="min-h-screen pt-24">
      <ViewTracker profileId={id} />
      {/* Banner */}
      <div className="relative overflow-hidden">
        {profile.banner_url ? (
          <div className="relative aspect-[4/1] w-full overflow-hidden sm:aspect-[5/1]">
            <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>
        ) : (
          <div className="relative h-48 w-full overflow-hidden sm:h-64">
            {profile.headshot_url ? (
              <img src={profile.headshot_url} alt="" className="h-full w-full object-cover blur-3xl opacity-20 scale-125" />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(78,205,196,0.06)_0%,_transparent_50%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="-mt-20 sm:-mt-24">
          <Link
            href="/members"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-all duration-300 hover:gap-3 hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-surface shadow-2xl sm:h-44 sm:w-44">
              {profile.headshot_url ? (
                <img src={profile.headshot_url} alt={profile.display_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-light">
                  <User className="h-14 w-14 text-border-light" />
                </div>
              )}
            </div>

            <div className="pb-2">
              <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {profile.role || "Member"}
              </span>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  {profile.display_name || "Unnamed Member"}
                </h1>
                <ReportButton contentType="profile" contentId={id} />
              </div>
              {profile.bio && (
                <p className="mt-4 max-w-lg leading-relaxed text-muted">{profile.bio}</p>
              )}
              {(profile.website_url || socials.length > 0) && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium text-muted transition-all duration-300 hover:bg-accent/10 hover:text-accent">
                      <Globe className="h-4 w-4" />
                      {profile.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                  {socials.map((s) => (
                    <a key={s.key} href={profile[s.key]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium text-muted transition-all duration-300 hover:bg-accent/10 hover:text-accent" title={s.label}>
                      <SocialIcon type={s.icon} className="h-4 w-4" />
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom sections */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {sections.map((section) => {
          const sectionItems = allItems.filter((item) => item.section_id === section.id);
          return (
            <SectionRenderer key={section.id} section={section} items={sectionItems} />
          );
        })}

        {/* Unassigned items fallback — shown as default Portfolio section */}
        {unassignedItems.length > 0 && (
          <div className="py-16">
            <div className="mb-10 flex items-center gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {sections.length > 0 ? "More Work" : "Portfolio"}
              </h2>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <PortfolioGrid items={unassignedItems} />
          </div>
        )}

        {/* No work at all */}
        {allItems.length === 0 && sections.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted">This member hasn&apos;t added any work yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
