"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  User,
  Loader2,
  Camera,
  Check,
  Globe,
  X,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Profile } from "@/lib/types";

const SOCIAL_FIELDS = [
  { key: "instagram_url" as const, label: "Instagram", placeholder: "https://instagram.com/you", icon: "instagram" },
  { key: "vimeo_url" as const, label: "Vimeo", placeholder: "https://vimeo.com/you", icon: "vimeo" },
  { key: "youtube_url" as const, label: "YouTube", placeholder: "https://youtube.com/@you", icon: "youtube" },
  { key: "imdb_url" as const, label: "IMDb", placeholder: "https://imdb.com/name/nm...", icon: "imdb" },
];

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

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [dragOverHeadshot, setDragOverHeadshot] = useState(false);
  const [dragOverBanner, setDragOverBanner] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    setMessage({ type: "", text: "" });

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        role: profile.role,
        website_url: profile.website_url,
        instagram_url: profile.instagram_url,
        vimeo_url: profile.vimeo_url,
        youtube_url: profile.youtube_url,
        imdb_url: profile.imdb_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    }
    setSaving(false);
  };

  const uploadImage = useCallback(
    async (file: File, bucket: string, pathKey: string) => {
      if (!profile || !file.type.startsWith("image/")) return;

      const isHeadshot = bucket === "headshots";
      isHeadshot ? setUploadingHeadshot(true) : setUploadingBanner(true);
      setMessage({ type: "", text: "" });

      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}/${pathKey}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setMessage({ type: "error", text: uploadError.message });
        isHeadshot ? setUploadingHeadshot(false) : setUploadingBanner(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      const field = isHeadshot ? "headshot_url" : "banner_url";
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ [field]: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (updateError) {
        setMessage({ type: "error", text: updateError.message });
      } else {
        setProfile({ ...profile, [field]: publicUrl });
      }
      isHeadshot ? setUploadingHeadshot(false) : setUploadingBanner(false);
    },
    [profile, supabase]
  );

  const inputClass =
    "w-full rounded-2xl border border-border bg-background px-5 py-4 text-base text-foreground placeholder:text-muted/40 transition-all duration-300 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs text-muted">Loading profile...</span>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  const filledFields = [
    profile.display_name,
    profile.headshot_url,
    profile.role,
    profile.bio,
  ].filter(Boolean).length;

  const hasSocials = !!(profile.instagram_url || profile.vimeo_url || profile.youtube_url || profile.imdb_url);

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Floating toasts */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 top-20 z-50 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_0_30px_rgba(220,38,38,0.3)]">
              <Check className="h-4 w-4" />
              Profile saved!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 top-20 z-50 flex justify-center"
          >
            <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${message.type === "error" ? "bg-red-500/90 text-white" : "bg-green-500/90 text-white"}`}>
              {message.text}
              <button onClick={() => setMessage({ type: "", text: "" })}><X className="h-3.5 w-3.5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="font-medium text-muted transition-all duration-300 hover:text-accent">
              Dashboard
            </Link>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">Edit Profile</span>
          </div>
        </motion.div>

        {/* Banner upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          onDragOver={(e) => { e.preventDefault(); setDragOverBanner(true); }}
          onDragLeave={() => setDragOverBanner(false)}
          onDrop={(e) => { e.preventDefault(); setDragOverBanner(false); const f = e.dataTransfer.files[0]; if (f) uploadImage(f, "banners", "banner"); }}
          onClick={() => bannerInputRef.current?.click()}
          className={`group relative mb-2 cursor-pointer overflow-hidden rounded-3xl border-2 transition-all duration-500 ${
            dragOverBanner ? "border-accent bg-accent/5 shadow-[0_0_60px_rgba(220,38,38,0.15)]" : "border-dashed border-border hover:border-accent/30"
          }`}
        >
          {profile.banner_url ? (
            <div className="relative aspect-[4/1] w-full overflow-hidden sm:aspect-[5/1]">
              <img src={profile.banner_url} alt="" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-500 group-hover:bg-black/30 group-hover:opacity-100">
                <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-6 py-3 text-sm font-medium text-white backdrop-blur-md">
                  <Camera className="h-5 w-5" />
                  Change Banner
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 sm:py-16">
              <motion.div animate={dragOverBanner ? { scale: 1.1 } : { scale: 1 }} className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 transition-colors group-hover:bg-accent/15">
                <ImageIcon className="h-6 w-6 text-accent" />
              </motion.div>
              <h2 className="text-base font-bold text-foreground">{dragOverBanner ? "Drop your banner" : "Add a cover banner"}</h2>
              <p className="mt-1 text-sm text-muted">Wide landscape image — appears at the top of your public profile</p>
            </div>
          )}
          {uploadingBanner && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          )}
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "banners", "banner"); }} />
        </motion.div>

        {/* Headshot upload — overlapping the banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative -mt-16 mb-10 ml-8 flex items-end gap-6 sm:ml-12"
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOverHeadshot(true); }}
            onDragLeave={() => setDragOverHeadshot(false)}
            onDrop={(e) => { e.preventDefault(); setDragOverHeadshot(false); const f = e.dataTransfer.files[0]; if (f) uploadImage(f, "headshots", "headshot"); }}
            onClick={() => headshotInputRef.current?.click()}
            className={`group relative h-32 w-32 cursor-pointer overflow-hidden rounded-2xl border-4 border-background shadow-2xl transition-all duration-500 sm:h-40 sm:w-40 ${
              dragOverHeadshot ? "ring-2 ring-accent" : ""
            }`}
          >
            {profile.headshot_url ? (
              <img src={profile.headshot_url} alt={profile.display_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-light">
                <User className="h-12 w-12 text-border-light" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
            {uploadingHeadshot && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            )}
            <input ref={headshotInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "headshots", "headshot"); }} />
          </div>
          <div className="mb-2">
            {profile.role && <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-accent">{profile.role}</span>}
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{profile.display_name || "Your Name"}</h1>
            <p className="mt-0.5 text-xs text-muted">Click the photo to change your headshot</p>
          </div>
        </motion.div>

        {/* Two-column layout: Form + Preview */}
        <div className="grid gap-10 lg:grid-cols-[1fr,400px]">
          <div className="space-y-8">
            {/* Section 1: Identity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">Your Identity</h2>
                <p className="mt-1 text-sm text-muted">How you want the world to know you.</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Display Name *</label>
                  <input type="text" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className={inputClass} placeholder="Your full name" />
                  {!profile.display_name && <p className="mt-2 text-xs text-accent/70">This is required for your profile to go live.</p>}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Role / Specialty</label>
                  <input type="text" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} className={inputClass} placeholder="e.g. Director, Cinematographer, Editor, Actor" />
                  <p className="mt-2 text-xs text-muted/50">This appears as a label on your profile card.</p>
                </div>
              </div>
            </motion.div>

            {/* Section 2: About */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">About You</h2>
                <p className="mt-1 text-sm text-muted">Tell your story — what drives you creatively?</p>
              </div>
              <div>
                <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
                  Bio
                  <span className="normal-case tracking-normal">
                    <span className={profile.bio.length > 250 ? "text-accent" : "text-muted/50"}>{profile.bio.length}</span>
                    <span className="text-muted/30">/300</span>
                  </span>
                </label>
                <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value.slice(0, 300) })} rows={5} className={inputClass + " resize-none"} placeholder="I'm a filmmaker passionate about..." />
                {!profile.bio && <p className="mt-2 text-xs text-muted/50">Tip: Mention your experience, favorite genres, and what kind of projects excite you.</p>}
              </div>
            </motion.div>

            {/* Section 3: Links & Socials */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">Links & Socials</h2>
                <p className="mt-1 text-sm text-muted">Help people find you everywhere.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/40" />
                    <input type="url" value={profile.website_url} onChange={(e) => setProfile({ ...profile, website_url: e.target.value })} className={inputClass + " pl-12"} placeholder="https://yourwebsite.com" />
                  </div>
                </div>
                {SOCIAL_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">{field.label}</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted/40">
                        <SocialIcon type={field.icon} className="h-4 w-4" />
                      </div>
                      <input
                        type="url"
                        value={profile[field.key] || ""}
                        onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                        className={inputClass + " pl-12"}
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Save + Next step */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <motion.button
                onClick={handleSave}
                disabled={saving || !profile.display_name.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-8 py-4 text-base font-semibold text-background transition-all duration-300 hover:bg-accent/80 hover:shadow-[0_0_30px_rgba(220,38,38,0.25)] disabled:opacity-40 sm:px-10"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : saved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
              </motion.button>
              <Link href="/dashboard/portfolio" className="group inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-accent/20 bg-accent/5 px-8 py-4 text-base font-semibold text-accent transition-all duration-300 hover:border-accent/40 hover:bg-accent/10 hover:shadow-[0_0_30px_rgba(220,38,38,0.15)] sm:px-10">
                Next: Add Your Work
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Right: Sticky live preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="hidden lg:block">
            <div className="sticky top-28">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Live Preview</span>
                <span className="text-xs text-muted/40">{filledFields}/4 fields</span>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-black/20">
                {/* Mini banner */}
                <div className="relative aspect-[3/1] overflow-hidden bg-surface-light">
                  {profile.banner_url ? (
                    <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
                  ) : profile.headshot_url ? (
                    <img src={profile.headshot_url} alt="" className="h-full w-full object-cover blur-2xl opacity-30 scale-110" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-surface to-surface-light" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                </div>
                {/* Avatar + info */}
                <div className="-mt-10 relative px-5 pb-5">
                  <div className="mb-3 h-16 w-16 overflow-hidden rounded-xl border-4 border-surface shadow-lg">
                    {profile.headshot_url ? (
                      <img src={profile.headshot_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-light"><User className="h-6 w-6 text-border" /></div>
                    )}
                  </div>
                  {profile.role ? (
                    <span className="mb-0.5 inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{profile.role}</span>
                  ) : (
                    <span className="mb-0.5 inline-block text-[10px] text-muted/30">Role</span>
                  )}
                  <h3 className="text-lg font-bold text-foreground">{profile.display_name || <span className="text-muted/30">Your Name</span>}</h3>
                  {profile.bio ? (
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted">{profile.bio}</p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-muted/20">Your bio will appear here...</p>
                  )}
                  {/* Social icons preview */}
                  {(hasSocials || profile.website_url) && (
                    <div className="mt-3 flex items-center gap-2">
                      {profile.website_url && <Globe className="h-3.5 w-3.5 text-muted/50" />}
                      {profile.instagram_url && <SocialIcon type="instagram" className="h-3.5 w-3.5 text-muted/50" />}
                      {profile.vimeo_url && <SocialIcon type="vimeo" className="h-3.5 w-3.5 text-muted/50" />}
                      {profile.youtube_url && <SocialIcon type="youtube" className="h-3.5 w-3.5 text-muted/50" />}
                      {profile.imdb_url && <SocialIcon type="imdb" className="h-3.5 w-3.5 text-muted/50" />}
                    </div>
                  )}
                </div>
              </div>

              {!isProfileComplete(profile) && (
                <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-xs font-medium text-accent">{getNextTip(profile)}</p>
                      <p className="mt-1 text-[10px] text-accent/50">Complete profiles get more visibility</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function isProfileComplete(profile: Profile): boolean {
  return !!(profile.display_name && profile.headshot_url && profile.role && profile.bio);
}

function getNextTip(profile: Profile): string {
  if (!profile.headshot_url) return "A great headshot makes a huge first impression.";
  if (!profile.display_name) return "Add your name so people can find you.";
  if (!profile.role) return "Set your role — Director? DP? Editor? Let people know.";
  if (!profile.bio) return "Write a short bio to tell your story.";
  return "Looking great! Keep your profile fresh.";
}
