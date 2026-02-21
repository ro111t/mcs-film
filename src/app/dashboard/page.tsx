import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User,
  Camera,
  Pen,
  FileText,
  Globe,
  Image as ImageIcon,
  Video,
  Plus,
  ArrowRight,
  Sparkles,
  Eye,
  ExternalLink,
  Shield,
  LayoutGrid,
  TrendingUp,
  Users,
  BarChart3,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Frank",
};

function getCompleteness(profile: any, portfolioCount: number) {
  const steps = [
    { key: "display_name", label: "Add your name", icon: Pen, done: !!profile?.display_name },
    { key: "headshot", label: "Upload a headshot", icon: Camera, done: !!profile?.headshot_url },
    { key: "role", label: "Set your role", icon: Sparkles, done: !!profile?.role },
    { key: "bio", label: "Write your bio", icon: FileText, done: !!profile?.bio },
    { key: "portfolio", label: "Add portfolio work", icon: ImageIcon, done: portfolioCount > 0 },
  ];
  const done = steps.filter((s) => s.done).length;
  return { steps, done, total: steps.length, percent: Math.round((done / steps.length) * 100) };
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("profile_id", user.id)
    .order("sort_order", { ascending: true });

  const { data: sectionsData } = await supabase
    .from("profile_sections")
    .select("id")
    .eq("profile_id", user.id);

  const { data: viewStats } = await supabase
    .from("profile_view_stats")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  const totalViews = viewStats?.total_views || 0;
  const views7d = viewStats?.views_7d || 0;
  const views30d = viewStats?.views_30d || 0;
  const uniqueViewers = viewStats?.unique_viewers || 0;

  const items = portfolioItems || [];
  const sectionCount = sectionsData?.length || 0;
  const comp = getCompleteness(profile, items.length);
  const isComplete = comp.percent === 100;

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (comp.percent / 100) * circumference;

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
        {/* Top bar */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {profile?.display_name
                ? `Welcome back, ${profile.display_name.split(" ")[0]}`
                : "Welcome to Frank"}
            </h1>
            <p className="mt-1 text-muted">
              {isComplete
                ? "Your profile is looking great. Keep it fresh."
                : "Build your profile and showcase your best work."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-all duration-300 hover:bg-accent/20"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            {profile?.is_visible && profile?.display_name && (
              <Link
                href={`/members/${profile.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/50 hover:text-accent"
              >
                <Eye className="h-4 w-4" />
                View Public Profile
              </Link>
            )}
          </div>
        </div>

        {/* Hero section: Profile preview + completeness */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* Large profile preview card */}
          <Link
            href="/dashboard/sections"
            className="group relative overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-500 hover:border-accent/30 hover:shadow-[0_0_60px_rgba(78,205,196,0.08)]"
          >
            <div className="flex h-full flex-col sm:flex-row">
              {/* Headshot area */}
              <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-surface-light sm:w-64 lg:w-72">
                {profile?.headshot_url ? (
                  <img
                    src={profile.headshot_url}
                    alt={profile?.display_name || ""}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 transition-all duration-500 group-hover:bg-accent/20 group-hover:scale-110">
                      <Camera className="h-8 w-8 text-accent" />
                    </div>
                    <p className="text-center text-sm font-medium text-muted">
                      Upload your headshot
                    </p>
                    <p className="text-center text-xs text-muted/50">
                      This is the first thing people see
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface opacity-0 sm:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent sm:hidden" />
              </div>

              {/* Profile info */}
              <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
                <div className="mb-auto">
                  {profile?.role ? (
                    <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {profile.role}
                    </span>
                  ) : (
                    <span className="mb-2 inline-block text-xs font-medium text-muted/50">
                      No role set yet
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                    {profile?.display_name || "Your Name Here"}
                  </h2>
                  {profile?.bio ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-muted/40 italic">
                      Write a bio to tell the world who you are...
                    </p>
                  )}
                  {profile?.website_url && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-accent">
                      <Globe className="h-3 w-3" />
                      {profile.website_url.replace(/^https?:\/\//, "")}
                    </p>
                  )}
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-accent opacity-0 transition-all duration-300 group-hover:opacity-100">
                  Edit Your Page
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>

          {/* Completeness panel */}
          {isComplete ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-accent/20 bg-accent/[0.04] p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Profile Complete</h3>
              <p className="mt-1 text-sm text-muted">
                You&apos;re all set. Keep your profile fresh and your portfolio growing.
              </p>
              <div className="mt-4 flex items-center gap-2">
                {profile?.is_visible && profile?.display_name && (
                  <Link
                    href={`/members/${profile.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-all duration-300 hover:bg-accent/20"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Public Profile
                  </Link>
                )}
                <Link
                  href="/dashboard/sections"
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-xs font-medium text-muted transition-all duration-300 hover:text-foreground"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Customize Layout
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col rounded-3xl border border-border bg-surface p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
                  Profile Score
                </h3>
              </div>

              {/* Circular progress */}
              <div className="mx-auto mb-6">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-foreground">{comp.percent}</span>
                    <span className="text-lg text-muted">%</span>
                  </div>
                </div>
              </div>

              {/* Steps checklist */}
              <div className="space-y-2">
                {comp.steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <Link
                      key={step.key}
                      href={step.key === "portfolio" ? "/dashboard/portfolio" : "/dashboard/profile"}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ${
                        step.done
                          ? "text-muted/50"
                          : "text-foreground hover:bg-accent/5 hover:text-accent"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          step.done ? "bg-accent/10 text-accent" : "bg-surface-light text-muted"
                        }`}
                      >
                        {step.done ? (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <Icon className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span className={step.done ? "line-through" : ""}>{step.label}</span>
                      {!step.done && (
                        <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted/30" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio gallery section */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Your Work</h2>
              <p className="mt-0.5 text-xs text-muted">
                {items.length > 0
                  ? `${items.length} piece${items.length > 1 ? "s" : ""} in your portfolio`
                  : "Your portfolio is empty — time to show the world what you've got."}
              </p>
            </div>
            <Link
              href="/dashboard/portfolio"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 hover:shadow-[0_0_20px_rgba(78,205,196,0.2)]"
            >
              <Plus className="h-4 w-4" />
              {items.length > 0 ? "Manage Portfolio" : "Add Your First Piece"}
            </Link>
          </div>

          {items.length > 0 ? (
            <Link href="/dashboard/portfolio" className="group block">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="group/card relative aspect-square overflow-hidden rounded-xl bg-surface-light transition-all duration-500 hover:ring-1 hover:ring-accent/30"
                  >
                    {item.media_type === "image" && item.media_url ? (
                      <img
                        src={item.media_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                      />
                    ) : item.media_type === "video" ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                        <Video className="h-8 w-8 text-accent/50" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                          Video
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-border-light" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
                      <p className="truncate text-xs font-medium text-white">
                        {item.title || "Untitled"}
                      </p>
                    </div>
                  </div>
                ))}
                {items.length > 8 && (
                  <div className="flex aspect-square items-center justify-center rounded-xl bg-surface-light">
                    <p className="text-sm font-medium text-muted">
                      +{items.length - 8} more
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-accent opacity-0 transition-all duration-300 group-hover:opacity-100">
                Open Portfolio Editor
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ) : (
            <Link
              href="/dashboard/portfolio"
              className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 transition-all duration-500 hover:border-accent/40 hover:bg-accent/[0.02]"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-accent/20">
                <Plus className="h-7 w-7 text-accent" />
              </div>
              <p className="text-base font-semibold text-foreground">
                Start building your portfolio
              </p>
              <p className="mt-1 max-w-xs text-center text-sm text-muted">
                Upload photos, stills, and embed video reels — this is your stage.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )}
        </div>

        {/* Analytics */}
        {totalViews > 0 && (
          <div className="mt-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Profile Analytics</h2>
                <p className="text-xs text-muted">How people are finding you</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-background p-4">
                <p className="text-2xl font-bold text-foreground">{totalViews}</p>
                <p className="mt-1 text-xs text-muted">Total Views</p>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <div className="flex items-center gap-1.5">
                  <p className="text-2xl font-bold text-foreground">{views7d}</p>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <p className="mt-1 text-xs text-muted">Last 7 Days</p>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <p className="text-2xl font-bold text-foreground">{views30d}</p>
                <p className="mt-1 text-xs text-muted">Last 30 Days</p>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <div className="flex items-center gap-1.5">
                  <p className="text-2xl font-bold text-foreground">{uniqueViewers}</p>
                  <Users className="h-4 w-4 text-accent" />
                </div>
                <p className="mt-1 text-xs text-muted">Unique Viewers</p>
              </div>
            </div>
          </div>
        )}

        {/* Skills & Gear CTA */}
        <div className="mt-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <Wrench className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Skills & Gear</h2>
                <p className="mt-1 text-sm text-muted">
                  {(profile?.skills?.length || 0) > 0
                    ? `${profile.skills.length} skill${profile.skills.length !== 1 ? "s" : ""} and ${profile.gear?.length || 0} gear listed — helps us match you to crew calls.`
                    : "Tell us what you can do and what gear you have. Get matched to shoots and projects."}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/skills"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 hover:shadow-[0_0_20px_rgba(78,205,196,0.2)]"
            >
              <Wrench className="h-4 w-4" />
              {(profile?.skills?.length || 0) > 0 ? "Update Skills" : "Add Skills"}
            </Link>
          </div>
        </div>

        {/* Page Builder CTA */}
        <div className="mt-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <LayoutGrid className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Customize Your Page</h2>
                <p className="mt-1 text-sm text-muted">
                  {sectionCount > 0
                    ? `${sectionCount} section${sectionCount !== 1 ? "s" : ""} on your profile — add galleries, reels, text blocks, and more.`
                    : "Build a custom layout with sections — Featured Reels, Photo Galleries, Behind the Scenes, and more."}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/sections"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 hover:shadow-[0_0_20px_rgba(78,205,196,0.2)]"
            >
              <LayoutGrid className="h-4 w-4" />
              {sectionCount > 0 ? "Edit Layout" : "Start Building"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
