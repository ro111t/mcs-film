"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Star,
  Eye,
  EyeOff,
  Trash2,
  X,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Award,
  Film,
  Calendar,
} from "lucide-react";
import type { Season, SeasonItem, PortfolioItem, Profile } from "@/lib/types";
import { SEASON_TYPES } from "@/lib/types";

const TYPE_ICONS: Record<string, any> = {
  season: Calendar,
  collection: Layers,
  showcase: Award,
  event_collection: Film,
};

export default function SeasonsPage() {
  const supabase = createClient();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonItems, setSeasonItems] = useState<Record<string, SeasonItem[]>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);

  // Add item state
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [allPortfolioItems, setAllPortfolioItems] = useState<PortfolioItem[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Form
  const [form, setForm] = useState({
    title: "",
    description: "",
    season_type: "season" as string,
  });

  const canManage = userRole === "admin" || userRole === "officer";

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("member_role")
      .eq("id", user.id)
      .single();
    setUserRole(profile?.member_role || "member");

    const { data: seasonsData } = await supabase
      .from("seasons")
      .select("*")
      .order("sort_order", { ascending: true });
    setSeasons(seasonsData || []);

    const { data: items } = await supabase
      .from("season_items")
      .select("*")
      .order("sort_order", { ascending: true });
    const grouped: Record<string, SeasonItem[]> = {};
    (items || []).forEach((item: SeasonItem) => {
      if (!grouped[item.season_id]) grouped[item.season_id] = [];
      grouped[item.season_id].push(item);
    });
    setSeasonItems(grouped);

    // Load all portfolio items for adding to seasons
    const { data: portfolioData } = await supabase
      .from("portfolio_items")
      .select("*")
      .order("created_at", { ascending: false });
    setAllPortfolioItems(portfolioData || []);

    // Load profiles for member names
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*");
    setAllProfiles(profilesData || []);

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const createSeason = async () => {
    if (!userId || !form.title) return;
    await supabase.from("seasons").insert({
      title: form.title,
      description: form.description,
      season_type: form.season_type,
      created_by: userId,
    });
    setShowCreate(false);
    setForm({ title: "", description: "", season_type: "season" });
    loadData();
  };

  const togglePublish = async (season: Season) => {
    await supabase.from("seasons").update({ is_published: !season.is_published }).eq("id", season.id);
    loadData();
  };

  const toggleFeatured = async (season: Season) => {
    await supabase.from("seasons").update({ is_featured: !season.is_featured }).eq("id", season.id);
    loadData();
  };

  const deleteSeason = async (seasonId: string) => {
    await supabase.from("seasons").delete().eq("id", seasonId);
    loadData();
  };

  const addPortfolioItemToSeason = async (seasonId: string, portfolioItem: PortfolioItem) => {
    const profile = allProfiles.find((p) => p.id === portfolioItem.profile_id);
    await supabase.from("season_items").insert({
      season_id: seasonId,
      portfolio_item_id: portfolioItem.id,
      profile_id: portfolioItem.profile_id,
      title: portfolioItem.title,
      description: portfolioItem.description,
      media_url: portfolioItem.media_url,
    });
    setShowAddItem(null);
    setSearchQuery("");
    loadData();
  };

  const removeSeasonItem = async (itemId: string) => {
    await supabase.from("season_items").delete().eq("id", itemId);
    loadData();
  };

  const getProfileName = (profileId: string | null) => {
    if (!profileId) return "Unknown";
    const p = allProfiles.find((pr) => pr.id === profileId);
    return p?.display_name || "Unknown";
  };

  const filteredPortfolioItems = allPortfolioItems.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const profile = allProfiles.find((p) => p.id === item.profile_id);
    return (
      item.title.toLowerCase().includes(q) ||
      (profile?.display_name || "").toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen pt-24">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <p className="text-muted">Only officers and admins can manage seasons.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-accent hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8 lg:py-16">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition-all duration-300 hover:gap-3 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Curation
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Seasons & Collections
            </h1>
            <p className="mt-1 text-sm text-muted">
              Curate member work into themed collections and showcases.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80"
          >
            <Plus className="h-4 w-4" />
            New Season
          </button>
        </div>

        {/* Seasons list */}
        <div className="space-y-4">
          {seasons.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface py-16 text-center">
              <Layers className="mx-auto mb-4 h-12 w-12 text-border-light" />
              <p className="text-sm font-medium text-muted">No seasons yet</p>
              <p className="mt-1 text-xs text-muted">Create one to start curating member work</p>
            </div>
          )}

          {seasons.map((season) => {
            const Icon = TYPE_ICONS[season.season_type] || Layers;
            const items = seasonItems[season.id] || [];
            const isExpanded = expandedSeason === season.id;

            return (
              <div key={season.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                {/* Season header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedSeason(isExpanded ? null : season.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-accent" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                          {SEASON_TYPES.find((t) => t.value === season.season_type)?.label}
                        </span>
                        {!season.is_published && (
                          <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-medium text-muted">Draft</span>
                        )}
                        {season.is_featured && (
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <h3 className="mt-1.5 text-lg font-semibold text-foreground">{season.title}</h3>
                      {season.description && (
                        <p className="mt-1 text-sm text-muted line-clamp-2">{season.description}</p>
                      )}
                      <p className="mt-2 text-xs text-muted">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="flex items-center gap-1.5 ml-4">
                      <button
                        onClick={() => togglePublish(season)}
                        className={`rounded-lg p-2 transition-all ${season.is_published ? "bg-green-500/10 text-green-400" : "bg-surface-light text-muted hover:text-foreground"}`}
                        title={season.is_published ? "Unpublish" : "Publish"}
                      >
                        {season.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => toggleFeatured(season)}
                        className={`rounded-lg p-2 transition-all ${season.is_featured ? "bg-yellow-500/10 text-yellow-400" : "bg-surface-light text-muted hover:text-foreground"}`}
                        title={season.is_featured ? "Remove featured" : "Feature"}
                      >
                        <Star className={`h-4 w-4 ${season.is_featured ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={() => deleteSeason(season.id)}
                        className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-400 transition-all"
                        title="Delete season"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded: season items */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {items.length === 0 ? (
                      <div className="p-5 text-center text-xs text-muted">
                        No items yet — add member work to this season
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-light">
                              {item.media_url ? (
                                <img src={item.media_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-border-light" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{item.title || "Untitled"}</p>
                              <p className="text-xs text-muted">by {getProfileName(item.profile_id)}</p>
                            </div>
                            <button
                              onClick={() => removeSeasonItem(item.id)}
                              className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add item button */}
                    <div className="border-t border-border/50 p-4">
                      <button
                        onClick={() => setShowAddItem(showAddItem === season.id ? null : season.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Member Work
                      </button>
                    </div>

                    {/* Add item picker */}
                    {showAddItem === season.id && (
                      <div className="border-t border-border/50 p-4">
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by title, member name, or category..."
                          className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                        />
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {filteredPortfolioItems.slice(0, 20).map((pi) => {
                            const alreadyAdded = items.some((i) => i.portfolio_item_id === pi.id);
                            return (
                              <button
                                key={pi.id}
                                onClick={() => !alreadyAdded && addPortfolioItemToSeason(season.id, pi)}
                                disabled={alreadyAdded}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${
                                  alreadyAdded ? "opacity-40 cursor-not-allowed" : "hover:bg-surface-light"
                                }`}
                              >
                                <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-surface-light">
                                  {pi.media_url ? (
                                    <img src={pi.media_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <ImageIcon className="h-3 w-3 text-border-light" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-xs font-medium text-foreground">{pi.title || "Untitled"}</p>
                                  <p className="text-[10px] text-muted">{getProfileName(pi.profile_id)}</p>
                                </div>
                                {alreadyAdded && <span className="text-[10px] text-muted">Added</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create modal */}
        {showCreate && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowCreate(false)} />
            <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">New Season</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    placeholder="e.g. Fall 2026 Showcase"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEASON_TYPES.map((type) => {
                      const Icon = TYPE_ICONS[type.value] || Layers;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setForm({ ...form, season_type: type.value })}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            form.season_type === type.value
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/30"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${form.season_type === type.value ? "text-accent" : "text-muted"}`} />
                          <p className={`mt-1 text-xs font-semibold ${form.season_type === type.value ? "text-accent" : "text-foreground"}`}>
                            {type.label}
                          </p>
                          <p className="text-[10px] text-muted">{type.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    placeholder="What's this season about?"
                  />
                </div>

                <button
                  onClick={createSeason}
                  disabled={!form.title}
                  className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create Season
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
