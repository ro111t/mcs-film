"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Check,
  X,
  Loader2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video,
  LayoutGrid,
  Pencil,
  Upload,
  Link as LinkIcon,
  Globe,
  Camera,
  User,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Profile, ProfileSection, PortfolioItem } from "@/lib/types";
import { SECTION_PRESETS, PORTFOLIO_CATEGORIES } from "@/lib/types";

/* ── wiggle CSS ── */
const wiggleCSS = `
@keyframes wiggle {
  0%{transform:rotate(-0.5deg)}
  50%{transform:rotate(0.5deg)}
  100%{transform:rotate(-0.5deg)}
}
.wig{animation:wiggle .3s ease-in-out infinite}
.wig:nth-child(2n){animation-delay:.15s}
.wig:nth-child(3n){animation-delay:.08s}
`;

/* ── grid sizes ── */
const GRID_SIZES = [
  { value: "xs", label: "XS", cols: "col-span-2", aspect: "aspect-square", desc: "Tiny" },
  { value: "small", label: "S", cols: "col-span-3", aspect: "aspect-square", desc: "Small" },
  { value: "medium", label: "M", cols: "col-span-4", aspect: "aspect-[4/3]", desc: "Medium" },
  { value: "large", label: "L", cols: "col-span-6", aspect: "aspect-video", desc: "Large" },
  { value: "full", label: "XL", cols: "col-span-12", aspect: "aspect-[21/9]", desc: "Full Width" },
];
const INFO_MODES = [
  { value: "hover", label: "On Hover" },
  { value: "always", label: "Always" },
  { value: "hidden", label: "Hidden" },
];
const sizeOf = (v: string) => GRID_SIZES.find((s) => s.value === v) || GRID_SIZES[2];

export default function SectionsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // UI state
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());

  // Drag state
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [dragSection, setDragSection] = useState<string | null>(null);
  const [dragOverSIdx, setDragOverSIdx] = useState<number | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── load everything ── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      const [pRes, sRes, iRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("profile_sections").select("*").eq("profile_id", user.id).order("sort_order"),
        supabase.from("portfolio_items").select("*").eq("profile_id", user.id).order("sort_order"),
      ]);
      if (pRes.data) setProfile(pRes.data);
      if (sRes.error) { setError(sRes.error.message); }
      if (sRes.data) setSections(sRes.data);
      if (iRes.data) setItems(iRes.data);
      setLoading(false);
    })();
  }, []);

  /* ── deselect on click outside ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-item]") && !t.closest("[data-toolbar]") && !t.closest("[data-edit]")) {
        setSelectedItem(null);
        setEditingItem(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── helpers ── */
  const sectionItems = (sid: string) => items.filter((i) => i.section_id === sid);
  const unassigned = items.filter((i) => !i.section_id);

  const updateItem = (id: string, u: Partial<PortfolioItem>) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...u } : i)));

  const updateSection = (id: string, u: Partial<ProfileSection>) =>
    setSections((p) => p.map((s) => (s.id === id ? { ...s, ...u } : s)));

  const updateProfile = (u: Partial<Profile>) =>
    setProfile((p) => (p ? { ...p, ...u } : p));

  const addSection = (preset: (typeof SECTION_PRESETS)[number]) => {
    setSections((p) => [...p, {
      id: crypto.randomUUID(), profile_id: userId!, section_type: preset.type,
      title: preset.label, subtitle: "", layout: "grid-2", content: "",
      sort_order: sections.length, is_visible: true, created_at: new Date().toISOString(),
    }]);
    setShowPresets(false);
  };

  const removeSection = async (id: string) => {
    setItems((p) => p.map((i) => (i.section_id === id ? { ...i, section_id: null } : i)));
    setSections((p) => p.filter((s) => s.id !== id));
    await supabase.from("portfolio_items").update({ section_id: null }).eq("section_id", id);
    await supabase.from("profile_sections").delete().eq("id", id);
  };

  const removeItem = async (id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    setSelectedItem(null);
    setEditingItem(null);
    await supabase.from("portfolio_items").delete().eq("id", id);
  };

  /* ── image upload ── */
  const processUpload = useCallback(async (itemId: string, file: File) => {
    if (!userId || !file.type.startsWith("image/")) return;
    setUploadingIds((p) => new Set(p).add(itemId));
    const ext = file.name.split(".").pop();
    const path = `${userId}/${itemId}.${ext}`;
    const { error: ue } = await supabase.storage.from("portfolio").upload(path, file, { upsert: true });
    if (ue) { setError(ue.message); setUploadingIds((p) => { const n = new Set(p); n.delete(itemId); return n; }); return; }
    const { data: { publicUrl } } = supabase.storage.from("portfolio").getPublicUrl(path);
    updateItem(itemId, { media_url: publicUrl });
    setUploadingIds((p) => { const n = new Set(p); n.delete(itemId); return n; });
  }, [userId, supabase]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !userId) return;
    Array.from(files).filter((f) => f.type.startsWith("image/")).forEach((file) => {
      const id = crypto.randomUUID();
      const newItem: PortfolioItem = {
        id, profile_id: userId, title: file.name.replace(/\.[^/.]+$/, ""),
        description: "", media_type: "image", media_url: "", video_embed_url: "",
        category: "", section_id: null, grid_size: "medium", show_info: "hover",
        sort_order: items.length, created_at: new Date().toISOString(),
      };
      setItems((p) => [...p, newItem]);
      processUpload(id, file);
    });
    setShowUpload(false);
  };

  const addVideoItem = (url: string) => {
    if (!userId || !url.trim()) return;
    const id = crypto.randomUUID();
    const newItem: PortfolioItem = {
      id, profile_id: userId, title: "Video", description: "",
      media_type: "video", media_url: "", video_embed_url: url.trim(),
      category: "", section_id: null, grid_size: "large", show_info: "always",
      sort_order: items.length, created_at: new Date().toISOString(),
    };
    setItems((p) => [...p, newItem]);
    setShowUpload(false);
  };

  /* ── banner/headshot upload ── */
  const uploadProfileImage = async (file: File, type: "headshot" | "banner") => {
    if (!userId) return;
    const ext = file.name.split(".").pop();
    const path = `${userId}/${type}.${ext}`;
    const bucket = type === "banner" ? "banners" : "headshots";
    const { error: ue } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (ue) { setError(ue.message); return; }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    const field = type === "banner" ? "banner_url" : "headshot_url";
    updateProfile({ [field]: publicUrl } as any);
  };

  /* ── drag & drop ── */
  const onDragStart = (id: string) => { setDragItem(id); setSelectedItem(null); };
  const onDragOverSec = (e: React.DragEvent, sid: string) => { e.preventDefault(); setDragOverSection(sid); };
  const onDropSec = (sid: string) => { if (dragItem) updateItem(dragItem, { section_id: sid }); setDragItem(null); setDragOverSection(null); };
  const onDropUnassign = (e: React.DragEvent) => { e.preventDefault(); if (dragItem) updateItem(dragItem, { section_id: null }); setDragItem(null); setDragOverSection(null); };

  const onSecDragStart = (id: string) => setDragSection(id);
  const onSecDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverSIdx(idx); };
  const onSecDrop = (idx: number) => {
    if (!dragSection) return;
    const from = sections.findIndex((s) => s.id === dragSection);
    const n = [...sections]; const [m] = n.splice(from, 1); n.splice(idx, 0, m);
    setSections(n.map((s, i) => ({ ...s, sort_order: i })));
    setDragSection(null); setDragOverSIdx(null);
  };

  /* ── save everything ── */
  const saveAll = async () => {
    if (!userId) return;
    setSaving(true); setSaved(false); setError("");

    // save profile
    if (profile) {
      const { error: pe } = await supabase.from("profiles").update({
        display_name: profile.display_name, bio: profile.bio, role: profile.role,
        headshot_url: profile.headshot_url, banner_url: profile.banner_url,
        website_url: profile.website_url, instagram_url: profile.instagram_url,
        vimeo_url: profile.vimeo_url, youtube_url: profile.youtube_url, imdb_url: profile.imdb_url,
      }).eq("id", userId);
      if (pe) { setError(pe.message); setSaving(false); return; }
    }

    // save sections
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const { error: e } = await supabase.from("profile_sections").upsert({
        id: s.id, profile_id: userId, section_type: s.section_type,
        title: s.title, subtitle: s.subtitle, layout: s.layout,
        content: s.content, sort_order: i, is_visible: s.is_visible,
      });
      if (e) { setError(e.message); setSaving(false); return; }
    }

    // save items
    for (const item of items) {
      const { error: e } = await supabase.from("portfolio_items").upsert({
        id: item.id, profile_id: userId, title: item.title, description: item.description,
        media_type: item.media_type, media_url: item.media_url, video_embed_url: item.video_embed_url,
        category: item.category, section_id: item.section_id, grid_size: item.grid_size,
        show_info: item.show_info, sort_order: item.sort_order,
      }).eq("id", item.id);
      if (e) { setError(e.message); setSaving(false); return; }
    }

    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  /* ── loading ── */
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  );

  if (error && !profile) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center max-w-md">
        <p className="text-sm font-medium text-red-400">{error}</p>
        <p className="mt-2 text-xs text-muted">Run in Supabase SQL Editor:</p>
        <code className="mt-2 block rounded-lg bg-surface px-4 py-2 text-xs text-accent">NOTIFY pgrst, &apos;reload schema&apos;;</code>
      </div>
    </div>
  );

  const sel = items.find((i) => i.id === selectedItem);
  const editItem = items.find((i) => i.id === editingItem);

  return (
    <div className="min-h-screen pb-40">
      <style dangerouslySetInnerHTML={{ __html: wiggleCSS }} />
      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />

      {/* ── toasts ── */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed left-0 right-0 top-20 z-50 flex justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_0_30px_rgba(220,38,38,0.3)]">
              <Check className="h-4 w-4" /> All changes saved!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {error && profile && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed left-0 right-0 top-20 z-50 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/90 px-5 py-2.5 text-sm text-white shadow-lg">
              {error} <button onClick={() => setError("")}><X className="h-3.5 w-3.5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── floating toolbar ── */}
      <AnimatePresence>
        {sel && !editingItem && (
          <motion.div data-toolbar initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-2xl bg-foreground/95 p-1.5 shadow-2xl backdrop-blur-sm">
              {GRID_SIZES.map((s) => (
                <button key={s.value} onClick={() => updateItem(sel.id, { grid_size: s.value })}
                  className={`rounded-xl px-3 py-2 text-[11px] font-bold transition-all ${sel.grid_size === s.value ? "bg-accent text-background" : "text-background/50 hover:text-background"}`}>
                  {s.label}
                </button>
              ))}
              <div className="mx-1 h-5 w-px bg-background/20" />
              {INFO_MODES.map((m) => (
                <button key={m.value} onClick={() => updateItem(sel.id, { show_info: m.value })}
                  className={`rounded-xl px-3 py-2 text-[11px] font-bold transition-all ${sel.show_info === m.value ? "bg-accent text-background" : "text-background/50 hover:text-background"}`}>
                  {m.label}
                </button>
              ))}
              <div className="mx-1 h-5 w-px bg-background/20" />
              <button onClick={() => setEditingItem(sel.id)} className="rounded-xl px-3 py-2 text-[11px] font-bold text-background/50 hover:text-background">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={() => { updateItem(sel.id, { section_id: null }); setSelectedItem(null); }}
                className="rounded-xl px-3 py-2 text-[11px] font-bold text-background/50 hover:text-background">
                Unassign
              </button>
              <button onClick={() => removeItem(sel.id)} className="rounded-xl px-3 py-2 text-[11px] font-bold text-red-400 hover:text-red-300">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── item edit panel ── */}
      <AnimatePresence>
        {editItem && (
          <motion.div data-edit initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 w-[420px] max-w-[90vw]">
            <div className="rounded-2xl bg-foreground/95 p-5 shadow-2xl backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-background/70">Edit Item</span>
                <button onClick={() => setEditingItem(null)}><X className="h-4 w-4 text-background/50" /></button>
              </div>
              <input value={editItem.title} onChange={(e) => updateItem(editItem.id, { title: e.target.value })}
                placeholder="Title" className="mb-2 w-full rounded-xl bg-background/10 px-4 py-2.5 text-sm text-background placeholder:text-background/30 outline-none focus:ring-1 focus:ring-accent" />
              <textarea value={editItem.description} onChange={(e) => updateItem(editItem.id, { description: e.target.value })}
                placeholder="Description (optional)" rows={2} className="mb-2 w-full resize-none rounded-xl bg-background/10 px-4 py-2.5 text-sm text-background placeholder:text-background/30 outline-none focus:ring-1 focus:ring-accent" />
              <select value={editItem.category} onChange={(e) => updateItem(editItem.id, { category: e.target.value })}
                className="w-full rounded-xl bg-background/10 px-4 py-2.5 text-sm text-background outline-none">
                <option value="">No category</option>
                {PORTFOLIO_CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ CANVAS ═══════════════ */}

      {/* ── banner ── */}
      <div className="relative group/banner cursor-pointer" onClick={() => {
        const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
        inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadProfileImage(f, "banner"); };
        inp.click();
      }}>
        {profile?.banner_url ? (
          <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-80">
            <img src={profile.banner_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover/banner:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
        ) : (
          <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-surface sm:h-72 lg:h-80">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.04)_0%,_transparent_70%)]" />
            <div className="flex flex-col items-center gap-2 text-muted/30 transition-colors group-hover/banner:text-accent/40">
              <Upload className="h-8 w-8" />
              <span className="text-xs font-medium">Click to add banner</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/banner:bg-black/20 group-hover/banner:opacity-100">
          <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-black">Change Banner</span>
        </div>
      </div>

      {/* ── profile card ── */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="-mt-20 mb-12 flex flex-col gap-6 sm:flex-row sm:items-end">
          {/* headshot */}
          <div className="group/hs relative h-36 w-36 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-4 border-background bg-surface shadow-2xl sm:h-44 sm:w-44"
            onClick={() => {
              const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
              inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadProfileImage(f, "headshot"); };
              inp.click();
            }}>
            {profile?.headshot_url ? (
              <img src={profile.headshot_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-light">
                <User className="h-12 w-12 text-border-light" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/hs:bg-black/30 group-hover/hs:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* info — inline editable */}
          {editingProfile ? (
            <div data-edit className="flex-1 space-y-3 pb-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={profile?.display_name || ""} onChange={(e) => updateProfile({ display_name: e.target.value })}
                  placeholder="Your name" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-lg font-bold text-foreground outline-none focus:border-accent/50" />
                <input value={profile?.role || ""} onChange={(e) => updateProfile({ role: e.target.value })}
                  placeholder="Role (e.g. Director, DP)" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/50" />
              </div>
              <textarea value={profile?.bio || ""} onChange={(e) => updateProfile({ bio: e.target.value })}
                placeholder="Bio" rows={3} className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-accent/50" />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                  <Globe className="h-3.5 w-3.5 text-muted/50" />
                  <input value={profile?.website_url || ""} onChange={(e) => updateProfile({ website_url: e.target.value })}
                    placeholder="Website URL" className="flex-1 bg-transparent text-xs text-foreground outline-none" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                  <span className="text-xs text-muted/50">IG</span>
                  <input value={profile?.instagram_url || ""} onChange={(e) => updateProfile({ instagram_url: e.target.value })}
                    placeholder="Instagram URL" className="flex-1 bg-transparent text-xs text-foreground outline-none" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                  <span className="text-xs text-muted/50">Vim</span>
                  <input value={profile?.vimeo_url || ""} onChange={(e) => updateProfile({ vimeo_url: e.target.value })}
                    placeholder="Vimeo URL" className="flex-1 bg-transparent text-xs text-foreground outline-none" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                  <span className="text-xs text-muted/50">YT</span>
                  <input value={profile?.youtube_url || ""} onChange={(e) => updateProfile({ youtube_url: e.target.value })}
                    placeholder="YouTube URL" className="flex-1 bg-transparent text-xs text-foreground outline-none" />
                </div>
              </div>
              <button onClick={() => setEditingProfile(false)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10">
                <Check className="h-3 w-3" /> Done editing
              </button>
            </div>
          ) : (
            <div className="group/info flex-1 cursor-pointer pb-2" onClick={() => setEditingProfile(true)}>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {profile?.role || "Click to set role"}
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {profile?.display_name || "Your Name"}
              </h1>
              {profile?.bio ? (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{profile.bio}</p>
              ) : (
                <p className="mt-3 text-sm text-muted/30 italic">Click to add bio...</p>
              )}
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted/30 opacity-0 transition-opacity group-hover/info:opacity-100">
                <Pencil className="h-3 w-3" /> Click to edit
              </span>
            </div>
          )}
        </div>

        {/* ── save bar ── */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="font-medium text-muted transition-all duration-300 hover:text-accent">
              Dashboard
            </Link>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">Page Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowUpload(true); }} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted hover:border-accent/30 hover:text-accent active:scale-95 transition-all">
              <Plus className="h-4 w-4" /> Add Work
            </button>
            <button onClick={saveAll} disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3 text-sm font-semibold text-background hover:bg-accent/80 disabled:opacity-40 active:scale-95 transition-all">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>

        {/* ── upload modal ── */}
        <AnimatePresence>
          {showUpload && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="mb-8 rounded-2xl border border-accent/20 bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Add New Work</span>
                <button onClick={() => setShowUpload(false)}><X className="h-4 w-4 text-muted" /></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 transition-all hover:border-accent/40 hover:bg-accent/5">
                  <Upload className="h-8 w-8 text-accent/40" />
                  <span className="text-sm font-medium text-foreground">Drop images or click</span>
                  <span className="text-xs text-muted">JPG, PNG, WebP</span>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
                  <span className="text-xs font-semibold text-muted">Or paste a video URL</span>
                  <input id="video-url-input" placeholder="YouTube or Vimeo link" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50" />
                  <button onClick={() => { const inp = document.getElementById("video-url-input") as HTMLInputElement; addVideoItem(inp?.value || ""); }}
                    className="self-start rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-background">
                    Add Video
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── sections canvas ── */}
        <div className="space-y-16">
          {sections.map((section, idx) => {
            const si = sectionItems(section.id);
            const isText = section.section_type === "text" || section.section_type === "credits";
            const isDragOver = dragOverSection === section.id;

            return (
              <div key={section.id}
                draggable onDragStart={() => onSecDragStart(section.id)}
                onDragOver={(e) => { onSecDragOver(e, idx); if (dragItem) onDragOverSec(e, section.id); }}
                onDrop={() => { onSecDrop(idx); if (dragItem) onDropSec(section.id); }}
                onDragEnd={() => { setDragSection(null); setDragOverSIdx(null); }}
                className={`${dragOverSIdx === idx && dragSection ? "border-t-2 border-accent pt-4" : ""}`}>

                {/* section header */}
                <div className="group/sec mb-5 flex items-center gap-3 cursor-grab active:cursor-grabbing">
                  {editingTitle === section.id ? (
                    <input autoFocus value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      onBlur={() => setEditingTitle(null)} onKeyDown={(e) => e.key === "Enter" && setEditingTitle(null)}
                      className="border-b border-accent bg-transparent text-xs font-semibold uppercase tracking-[0.2em] text-accent outline-none" />
                  ) : (
                    <span onClick={() => setEditingTitle(section.id)}
                      className="cursor-text text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {section.title || "Untitled"}
                    </span>
                  )}
                  <div className="h-px flex-1 bg-border/50" />
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/sec:opacity-100">
                    {!section.is_visible && <span className="text-[10px] text-muted/50">Hidden</span>}
                    <button onClick={() => updateSection(section.id, { is_visible: !section.is_visible })} className="p-1.5 text-muted/40 hover:text-accent">
                      {section.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => removeSection(section.id)} className="p-1.5 text-muted/40 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* text sections */}
                {isText && (
                  <textarea value={section.content} onChange={(e) => updateSection(section.id, { content: e.target.value })}
                    rows={4} className="w-full resize-none rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
                    placeholder={section.section_type === "credits" ? "Director — Short Film (2024)" : "Write your content here..."} />
                )}

                {/* portfolio grid */}
                {!isText && (
                  <div onDragOver={(e) => onDragOverSec(e, section.id)} onDrop={() => onDropSec(section.id)}
                    className={`min-h-[100px] rounded-2xl transition-all ${isDragOver && dragItem ? "bg-accent/5 ring-2 ring-accent/20" : ""}`}>
                    {si.length > 0 ? (
                      <div className="grid grid-cols-12 gap-3">
                        {si.map((item) => {
                          const sz = sizeOf(item.grid_size);
                          const isSelected = selectedItem === item.id;
                          const isDragging = dragItem === item.id;
                          const uploading = uploadingIds.has(item.id);
                          return (
                            <div key={item.id} data-item draggable
                              onDragStart={(e) => { e.stopPropagation(); onDragStart(item.id); }}
                              onDragEnd={() => { setDragItem(null); setDragOverSection(null); }}
                              onClick={(e) => { e.stopPropagation(); setSelectedItem(isSelected ? null : item.id); setEditingItem(null); }}
                              className={`${sz.cols} wig relative cursor-grab overflow-hidden rounded-2xl transition-all duration-200 active:cursor-grabbing ${
                                isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-background z-10 scale-[1.02]" : ""
                              } ${isDragging ? "opacity-30 scale-90" : ""}`}>
                              <div className={`relative w-full ${sz.aspect} bg-surface-light`}>
                                {uploading && (
                                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                                  </div>
                                )}
                                {item.media_type === "image" && item.media_url ? (
                                  <img src={item.media_url} alt={item.title} className="h-full w-full object-cover" draggable={false} />
                                ) : item.media_type === "video" ? (
                                  <div className="flex h-full w-full items-center justify-center bg-surface">
                                    <Video className="h-8 w-8 text-muted/20" />
                                    <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/60">Video</span>
                                  </div>
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-surface">
                                    <ImageIcon className="h-8 w-8 text-muted/20" />
                                  </div>
                                )}
                                {/* info overlay */}
                                {item.show_info === "always" && (item.title || item.description) && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                                    <p className="text-xs font-semibold text-white">{item.title}</p>
                                    {item.description && <p className="mt-0.5 text-[10px] text-white/60 line-clamp-1">{item.description}</p>}
                                  </div>
                                )}
                                {/* size badge */}
                                <div className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/60 backdrop-blur-sm">
                                  {sz.label}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 transition-colors ${
                        isDragOver && dragItem ? "border-accent bg-accent/5" : "border-border"
                      }`}>
                        <ImageIcon className="mb-2 h-8 w-8 text-muted/15" />
                        <p className="text-xs text-muted/40">Drag items here from below</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── add section ── */}
        {!showPresets && (
          <div className="mt-14">
            <button onClick={() => setShowPresets(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-8 text-sm font-medium text-muted hover:border-accent/40 hover:text-accent">
              <Plus className="h-4 w-4" /> Add Section
            </button>
          </div>
        )}

        <AnimatePresence>
          {showPresets && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mt-8 rounded-3xl border border-accent/20 bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Add a Section</h3>
                <button onClick={() => setShowPresets(false)}><X className="h-5 w-5 text-muted" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {SECTION_PRESETS.map((p) => (
                  <button key={p.type} onClick={() => addSection(p)}
                    className="rounded-xl border border-border bg-background p-4 text-left hover:border-accent/30">
                    <span className="text-sm font-semibold text-foreground">{p.label}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{p.description}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── unassigned items dock ── */}
        {items.length > 0 && (
          <div className="mt-16" onDragOver={(e) => e.preventDefault()} onDrop={onDropUnassign}>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted/50">
                {unassigned.length > 0 ? `Your Work · ${unassigned.length} unassigned` : "All items placed ✓"}
              </span>
              <div className="h-px flex-1 bg-border/30" />
            </div>
            {unassigned.length > 0 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {unassigned.map((item) => {
                  const uploading = uploadingIds.has(item.id);
                  return (
                    <div key={item.id} data-item draggable
                      onDragStart={() => onDragStart(item.id)}
                      onDragEnd={() => { setDragItem(null); setDragOverSection(null); }}
                      onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                      className={`relative aspect-square cursor-grab overflow-hidden rounded-xl transition-all active:cursor-grabbing hover:scale-105 ${
                        selectedItem === item.id ? "ring-2 ring-accent" : ""
                      } ${dragItem === item.id ? "opacity-30 scale-90" : ""}`}>
                      {uploading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                          <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        </div>
                      )}
                      {item.media_type === "image" && item.media_url ? (
                        <img src={item.media_url} alt={item.title} className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-light">
                          {item.media_type === "video" ? <Video className="h-5 w-5 text-muted/20" /> : <ImageIcon className="h-5 w-5 text-muted/20" />}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                        <p className="truncate text-[9px] font-medium text-white/80">{item.title || "Untitled"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {unassigned.length > 0 && sections.length > 0 && (
              <p className="mt-3 text-[11px] text-muted/30">Drag items into sections above. Unassigned items appear at the bottom of your public profile.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
