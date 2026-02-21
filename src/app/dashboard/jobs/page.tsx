"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Briefcase,
  MapPin,
  Calendar,
  Check,
  X,
  Sparkles,
  Wrench,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Trash2,
} from "lucide-react";
import type { JobListing, JobApplication, Profile } from "@/lib/types";
import { SKILLS, GEAR } from "@/lib/types";

export default function JobsPage() {
  const supabase = createClient();
  const [listings, setListings] = useState<JobListing[]>([]);
  const [myApps, setMyApps] = useState<JobApplication[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState("member");
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userGear, setUserGear] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [tab, setTab] = useState<"for-you" | "all" | "mine">("for-you");

  // Applicant profiles (for officers viewing applications)
  const [applicantProfiles, setApplicantProfiles] = useState<Record<string, Profile>>({});
  const [listingApps, setListingApps] = useState<Record<string, JobApplication[]>>({});

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    shoot_date: "",
    location: "",
    required_skills: [] as string[],
    required_gear: [] as string[],
  });

  const canManage = userRole === "admin" || userRole === "officer";

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("member_role, skills, gear")
      .eq("id", user.id)
      .single();
    setUserRole(profile?.member_role || "member");
    setUserSkills(profile?.skills || []);
    setUserGear(profile?.gear || []);

    const { data: listingsData } = await supabase
      .from("job_listings")
      .select("*")
      .order("created_at", { ascending: false });
    setListings(listingsData || []);

    const { data: apps } = await supabase
      .from("job_applications")
      .select("*");

    // Split into my apps and all apps by listing
    const mine: JobApplication[] = [];
    const byListing: Record<string, JobApplication[]> = {};
    (apps || []).forEach((a: JobApplication) => {
      if (a.user_id === user.id) mine.push(a);
      if (!byListing[a.listing_id]) byListing[a.listing_id] = [];
      byListing[a.listing_id].push(a);
    });
    setMyApps(mine);
    setListingApps(byListing);

    // Load applicant profiles for officers
    if (profile?.member_role === "admin" || profile?.member_role === "officer") {
      const userIds = [...new Set((apps || []).map((a: JobApplication) => a.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);
        const map: Record<string, Profile> = {};
        (profiles || []).forEach((p: Profile) => { map[p.id] = p; });
        setApplicantProfiles(map);
      }
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const createListing = async () => {
    if (!userId || !form.title) return;
    await supabase.from("job_listings").insert({
      title: form.title,
      description: form.description,
      shoot_date: form.shoot_date ? new Date(form.shoot_date).toISOString() : null,
      location: form.location,
      required_skills: form.required_skills,
      required_gear: form.required_gear,
      created_by: userId,
    });
    setShowCreate(false);
    setForm({ title: "", description: "", shoot_date: "", location: "", required_skills: [], required_gear: [] });
    loadData();
  };

  const applyToListing = async (listingId: string) => {
    if (!userId) return;
    await supabase.from("job_applications").insert({
      listing_id: listingId,
      user_id: userId,
      message: applyMessage,
    });
    setApplyingTo(null);
    setApplyMessage("");
    loadData();
  };

  const updateAppStatus = async (appId: string, status: "accepted" | "rejected") => {
    await supabase.from("job_applications").update({ status }).eq("id", appId);
    loadData();
  };

  const updateListingStatus = async (listingId: string, status: "open" | "filled" | "closed") => {
    await supabase.from("job_listings").update({ status }).eq("id", listingId);
    loadData();
  };

  const deleteListing = async (listingId: string) => {
    await supabase.from("job_listings").delete().eq("id", listingId);
    loadData();
  };

  // Match score: count how many required skills/gear the user has
  const getMatchScore = (listing: JobListing) => {
    const skillMatches = listing.required_skills.filter((s) => userSkills.includes(s)).length;
    const gearMatches = listing.required_gear.filter((g) => userGear.includes(g)).length;
    const totalRequired = listing.required_skills.length + listing.required_gear.length;
    if (totalRequired === 0) return 100;
    return Math.round(((skillMatches + gearMatches) / totalRequired) * 100);
  };

  const openListings = listings.filter((l) => l.status === "open");
  const myListings = listings.filter((l) => l.created_by === userId);
  const forYouListings = openListings
    .filter((l) => l.created_by !== userId)
    .map((l) => ({ ...l, matchScore: getMatchScore(l) }))
    .sort((a, b) => b.matchScore - a.matchScore);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8 lg:py-16">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition-all duration-300 hover:gap-3 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Crew Board
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Jobs & Crew Calls
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              <button
                onClick={() => setTab("for-you")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === "for-you" ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
              >
                For You
              </button>
              <button
                onClick={() => setTab("all")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === "all" ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
              >
                All Open
              </button>
              {canManage && (
                <button
                  onClick={() => setTab("mine")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === "mine" ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
                >
                  My Listings
                </button>
              )}
            </div>
            {canManage && (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80"
              >
                <Plus className="h-4 w-4" />
                Post Job
              </button>
            )}
          </div>
        </div>

        {/* No skills notice */}
        {userSkills.length === 0 && tab === "for-you" && (
          <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <p className="text-sm text-foreground">
              <Sparkles className="mr-2 inline h-4 w-4 text-accent" />
              <strong>Add your skills</strong> to get personalized job matches.
            </p>
            <Link href="/dashboard/skills" className="mt-1 inline-block text-xs font-medium text-accent hover:underline">
              Set up skills & gear →
            </Link>
          </div>
        )}

        {/* Listings */}
        <div className="space-y-4">
          {tab === "for-you" && forYouListings.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface py-16 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-border-light" />
              <p className="text-sm font-medium text-muted">No crew calls right now</p>
            </div>
          )}

          {tab === "all" && openListings.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface py-16 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-border-light" />
              <p className="text-sm font-medium text-muted">No open listings</p>
            </div>
          )}

          {tab === "mine" && myListings.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface py-16 text-center">
              <Briefcase className="mx-auto mb-4 h-12 w-12 text-border-light" />
              <p className="text-sm font-medium text-muted">You haven&apos;t posted any jobs yet</p>
            </div>
          )}

          {(tab === "for-you" ? forYouListings : tab === "all" ? openListings : myListings).map((listing) => {
            const matchScore = "matchScore" in listing ? (listing as any).matchScore : getMatchScore(listing);
            const hasApplied = myApps.some((a) => a.listing_id === listing.id);
            const myApp = myApps.find((a) => a.listing_id === listing.id);
            const isExpanded = expandedListing === listing.id;
            const apps = listingApps[listing.id] || [];
            const isCreator = listing.created_by === userId;

            return (
              <div key={listing.id} className="rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-accent/20">
                {/* Main card */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          listing.status === "open" ? "bg-green-500/10 text-green-400"
                          : listing.status === "filled" ? "bg-blue-500/10 text-blue-400"
                          : "bg-surface-light text-muted"
                        }`}>
                          {listing.status}
                        </span>
                        {tab === "for-you" && matchScore > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            matchScore >= 75 ? "bg-green-500/10 text-green-400"
                            : matchScore >= 50 ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-surface-light text-muted"
                          }`}>
                            {matchScore}% match
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">{listing.title}</h3>
                      {listing.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{listing.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                        {listing.shoot_date && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(listing.shoot_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                        )}
                        {listing.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {listing.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2 ml-4">
                      {!isCreator && listing.status === "open" && !hasApplied && (
                        <button
                          onClick={() => setApplyingTo(applyingTo === listing.id ? null : listing.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-background transition-all hover:bg-accent/80"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Apply
                        </button>
                      )}
                      {hasApplied && (
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                          myApp?.status === "accepted" ? "bg-green-500/10 text-green-400"
                          : myApp?.status === "rejected" ? "bg-red-500/10 text-red-400"
                          : "bg-accent/10 text-accent"
                        }`}>
                          <Check className="h-3.5 w-3.5" />
                          {myApp?.status === "accepted" ? "Accepted" : myApp?.status === "rejected" ? "Not selected" : "Applied"}
                        </span>
                      )}
                      {isCreator && canManage && (
                        <button
                          onClick={() => setExpandedListing(isExpanded ? null : listing.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
                        >
                          {apps.length} applicant{apps.length !== 1 ? "s" : ""}
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Skills & gear tags */}
                  {(listing.required_skills.length > 0 || listing.required_gear.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {listing.required_skills.map((s) => (
                        <span key={s} className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                          userSkills.includes(s) ? "bg-green-500/10 text-green-400" : "bg-surface-light text-muted"
                        }`}>
                          <Sparkles className="mr-1 inline h-2.5 w-2.5" />{s}
                        </span>
                      ))}
                      {listing.required_gear.map((g) => (
                        <span key={g} className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                          userGear.includes(g) ? "bg-green-500/10 text-green-400" : "bg-surface-light text-muted"
                        }`}>
                          <Wrench className="mr-1 inline h-2.5 w-2.5" />{g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Apply form */}
                {applyingTo === listing.id && (
                  <div className="border-t border-border p-5">
                    <textarea
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      rows={2}
                      placeholder="Optional: why you're a good fit..."
                      className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => applyToListing(listing.id)}
                        className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent/80"
                      >
                        Submit Application
                      </button>
                      <button
                        onClick={() => { setApplyingTo(null); setApplyMessage(""); }}
                        className="rounded-lg bg-surface-light px-4 py-2 text-xs font-medium text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Applicants (for creators) */}
                {isExpanded && isCreator && (
                  <div className="border-t border-border">
                    {apps.length === 0 ? (
                      <div className="p-5 text-center text-xs text-muted">No applicants yet</div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {apps.map((app) => {
                          const applicant = applicantProfiles[app.user_id];
                          return (
                            <div key={app.id} className="flex items-center justify-between px-5 py-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {applicant?.display_name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted">
                                  {applicant?.role || "Member"}
                                  {applicant?.skills?.length ? ` · ${applicant.skills.slice(0, 3).join(", ")}` : ""}
                                </p>
                                {app.message && <p className="mt-1 text-xs text-muted italic">&ldquo;{app.message}&rdquo;</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                {app.status === "applied" ? (
                                  <>
                                    <button
                                      onClick={() => updateAppStatus(app.id, "accepted")}
                                      className="rounded-lg bg-green-500/10 p-2 text-green-400 hover:bg-green-500/20"
                                      title="Accept"
                                    >
                                      <UserCheck className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => updateAppStatus(app.id, "rejected")}
                                      className="rounded-lg bg-surface-light p-2 text-muted hover:text-foreground"
                                      title="Reject"
                                    >
                                      <UserX className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    app.status === "accepted" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                  }`}>
                                    {app.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Listing management */}
                    <div className="flex gap-2 border-t border-border/50 p-4">
                      {listing.status === "open" && (
                        <button
                          onClick={() => updateListingStatus(listing.id, "filled")}
                          className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20"
                        >
                          Mark as Filled
                        </button>
                      )}
                      {listing.status !== "closed" && (
                        <button
                          onClick={() => updateListingStatus(listing.id, "closed")}
                          className="rounded-lg bg-surface-light px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
                        >
                          Close Listing
                        </button>
                      )}
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="inline h-3.5 w-3.5 mr-1" />Delete
                      </button>
                    </div>
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
            <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl" style={{ maxHeight: "90vh" }}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Post a Crew Call</h3>
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
                    placeholder="e.g. Need a DP for music video shoot"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    placeholder="Details about the shoot, compensation, time commitment..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Shoot Date</label>
                    <input
                      type="datetime-local"
                      value={form.shoot_date}
                      onChange={(e) => setForm({ ...form, shoot_date: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Location</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                      placeholder="e.g. Golden Gate Park"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">Required Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SKILLS.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => setForm({
                          ...form,
                          required_skills: form.required_skills.includes(skill)
                            ? form.required_skills.filter((s) => s !== skill)
                            : [...form.required_skills, skill],
                        })}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-all ${
                          form.required_skills.includes(skill)
                            ? "bg-accent/10 text-accent"
                            : "bg-surface-light text-muted hover:text-foreground"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-muted">Required Gear</label>
                  <div className="flex flex-wrap gap-1.5">
                    {GEAR.map((item) => (
                      <button
                        key={item}
                        onClick={() => setForm({
                          ...form,
                          required_gear: form.required_gear.includes(item)
                            ? form.required_gear.filter((g) => g !== item)
                            : [...form.required_gear, item],
                        })}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-all ${
                          form.required_gear.includes(item)
                            ? "bg-accent/10 text-accent"
                            : "bg-surface-light text-muted hover:text-foreground"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={createListing}
                  disabled={!form.title}
                  className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Post Crew Call
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
