"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Video,
  Loader2,
  Save,
  Check,
  X,
  Film,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { PortfolioItem } from "@/lib/types";
import { PORTFOLIO_CATEGORIES } from "@/lib/types";
import { Tag } from "lucide-react";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState("All");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("profile_id", user.id)
        .order("sort_order", { ascending: true });

      if (data) setItems(data);
      setLoading(false);
    };
    load();
  }, []);

  const addItem = (type: "image" | "video" = "image") => {
    const newItem: PortfolioItem = {
      id: crypto.randomUUID(),
      profile_id: userId!,
      title: "",
      description: "",
      media_type: type,
      media_url: "",
      video_embed_url: "",
      category: "",
      section_id: null,
      grid_size: "medium",
      show_info: "hover",
      sort_order: items.length,
      created_at: new Date().toISOString(),
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<PortfolioItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeItem = async (id: string) => {
    await supabase.from("portfolio_items").delete().eq("id", id);
    setItems(items.filter((item) => item.id !== id));
  };

  const processImageUpload = useCallback(
    async (itemId: string, file: File) => {
      if (!userId || !file.type.startsWith("image/")) return;

      setUploadingIds((prev) => new Set(prev).add(itemId));

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${itemId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setMessage({ type: "error", text: uploadError.message });
        setUploadingIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio").getPublicUrl(filePath);

      updateItem(itemId, { media_url: publicUrl });
      setUploadingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    },
    [userId, supabase]
  );

  const handleFileDrop = useCallback(
    (itemId: string, e: React.DragEvent) => {
      e.preventDefault();
      setDragOverId(null);
      const file = e.dataTransfer.files[0];
      if (file) processImageUpload(itemId, file);
    },
    [processImageUpload]
  );

  const handleQuickDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverId("new");
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      files.forEach((file) => {
        const id = crypto.randomUUID();
        const newItem: PortfolioItem = {
          id,
          profile_id: userId!,
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: "",
          media_type: "image",
          media_url: "",
          video_embed_url: "",
          category: "",
          section_id: null,
          grid_size: "medium",
          show_info: "hover",
          sort_order: items.length,
          created_at: new Date().toISOString(),
        };
        setItems((prev) => [...prev, newItem]);
        processImageUpload(id, file);
      });
      setTimeout(() => setDragOverId(null), 200);
    },
    [userId, items.length, processImageUpload]
  );

  const saveAll = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    setMessage({ type: "", text: "" });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { error } = await supabase.from("portfolio_items").upsert({
        id: item.id,
        profile_id: userId,
        title: item.title,
        description: item.description,
        media_type: item.media_type,
        media_url: item.media_url,
        video_embed_url: item.video_embed_url,
        category: item.category || "",
        sort_order: i,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/50 transition-all duration-300 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs text-muted">Loading portfolio...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Floating save toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 top-20 z-50 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_0_30px_rgba(78,205,196,0.3)]">
              <Check className="h-4 w-4" />
              Portfolio saved!
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
            <div
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
                message.type === "error"
                  ? "bg-red-500/90 text-white"
                  : "bg-green-500/90 text-white"
              }`}
            >
              {message.text}
              <button onClick={() => setMessage({ type: "", text: "" })}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-all duration-300 hover:gap-3 hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 flex items-start justify-between"
        >
          <div>
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Your Stage
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Portfolio
            </h1>
            <p className="mt-2 text-muted">
              {items.length > 0
                ? `${items.length} piece${items.length !== 1 ? "s" : ""} — your work speaks for itself.`
                : "This is where your work lives. Make it count."}
            </p>
          </div>
          <motion.button
            onClick={saveAll}
            disabled={saving || items.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 hover:shadow-[0_0_30px_rgba(78,205,196,0.25)] disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save All"}
          </motion.button>
        </motion.div>

        {/* Empty state — big inspiring hero */}
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverId("hero");
            }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={handleQuickDrop}
            className={`relative mb-8 overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 ${
              dragOverId === "hero"
                ? "border-accent bg-accent/5 shadow-[0_0_80px_rgba(78,205,196,0.1)]"
                : "border-border"
            }`}
          >
            <div className="flex flex-col items-center justify-center py-28 sm:py-36">
              <motion.div
                animate={dragOverId === "hero" ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-accent/10"
              >
                <ImageIcon className="h-10 w-10 text-accent" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                {dragOverId === "hero" ? "Drop to add" : "Show your best work"}
              </h2>
              <p className="mt-3 max-w-md text-center text-muted">
                Upload stills, behind-the-scenes shots, or embed video reels. Drag images directly here or use the buttons below.
              </p>
              <div className="mt-8 flex gap-3">
                <motion.button
                  onClick={() => addItem("image")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-sm font-semibold text-background transition-all duration-300 hover:shadow-[0_0_30px_rgba(78,205,196,0.25)]"
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
                </motion.button>
                <motion.button
                  onClick={() => addItem("video")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border px-7 py-3.5 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/50 hover:text-accent"
                >
                  <Video className="h-4 w-4" />
                  Embed Video
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category filter tabs */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex flex-wrap gap-2"
          >
            {PORTFOLIO_CATEGORIES.filter(c => c === "All" || items.some(i => i.category === c)).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 ${
                  activeFilter === cat
                    ? "bg-accent text-background"
                    : "bg-surface-light text-muted hover:text-foreground"
                }`}
              >
                {cat}
                {cat !== "All" && (
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {items.filter(i => i.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* Portfolio items */}
        <div className="space-y-5">
          <AnimatePresence>
            {items.filter(i => activeFilter === "All" || i.category === activeFilter).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-3xl border border-border bg-surface"
              >
                {/* Image/video area */}
                {item.media_type === "image" ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverId(item.id);
                    }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => handleFileDrop(item.id, e)}
                    className={`relative transition-all duration-300 ${
                      dragOverId === item.id ? "ring-2 ring-accent ring-inset" : ""
                    }`}
                  >
                    {item.media_url ? (
                      <div className="group relative">
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 opacity-0 transition-all duration-500 group-hover:bg-black/40 group-hover:opacity-100">
                          <div className="flex items-center gap-2 rounded-2xl bg-black/40 px-5 py-3 text-sm font-medium text-white backdrop-blur-md">
                            <Upload className="h-4 w-4" />
                            Replace Image
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) processImageUpload(item.id, f);
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label
                        className={`flex cursor-pointer flex-col items-center justify-center gap-4 border-b border-dashed py-20 transition-all duration-300 ${
                          dragOverId === item.id
                            ? "border-accent bg-accent/5"
                            : "border-border hover:bg-surface-light"
                        }`}
                      >
                        {uploadingIds.has(item.id) ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-accent" />
                            <span className="text-sm text-muted">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                              <Upload className="h-6 w-6 text-accent" />
                            </div>
                            <div className="text-center">
                              <p className="text-base font-medium text-foreground">
                                Drop an image or click to upload
                              </p>
                              <p className="mt-1 text-sm text-muted">
                                JPG, PNG, WebP — high quality recommended
                              </p>
                            </div>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) processImageUpload(item.id, f);
                          }}
                        />
                      </label>
                    )}
                    {uploadingIds.has(item.id) && item.media_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-accent" />
                          <span className="text-sm font-medium text-white">Replacing...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-b border-border bg-surface-light p-6">
                    <div className="flex items-center gap-3 text-sm text-muted">
                      <Film className="h-5 w-5 text-accent" />
                      <span className="font-medium">Video Embed</span>
                    </div>
                    <input
                      type="url"
                      value={item.video_embed_url}
                      onChange={(e) =>
                        updateItem(item.id, { video_embed_url: e.target.value })
                      }
                      className={inputClass + " mt-3"}
                      placeholder="Paste YouTube or Vimeo URL..."
                    />
                  </div>
                )}

                {/* Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          updateItem(item.id, { title: e.target.value })
                        }
                        className="w-full bg-transparent text-xl font-bold text-foreground placeholder:text-muted/30 focus:outline-none"
                        placeholder="Name this piece"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, { description: e.target.value })
                        }
                        rows={1}
                        className="w-full resize-none bg-transparent text-sm text-muted placeholder:text-muted/20 focus:outline-none"
                        placeholder="Add context — what's the story behind this?"
                      />
                      {/* Category selector */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Tag className="h-3.5 w-3.5 text-muted/40" />
                        {PORTFOLIO_CATEGORIES.filter(c => c !== "All").map((cat) => (
                          <button
                            key={cat}
                            onClick={() => updateItem(item.id, { category: item.category === cat ? "" : cat })}
                            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-200 ${
                              item.category === cat
                                ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                                : "bg-surface-light text-muted/60 hover:text-muted"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          updateItem(item.id, {
                            media_type:
                              item.media_type === "image" ? "video" : "image",
                          })
                        }
                        className="rounded-xl p-2.5 text-muted transition-all duration-300 hover:bg-surface-light hover:text-foreground"
                        title={`Switch to ${item.media_type === "image" ? "video" : "image"}`}
                      >
                        {item.media_type === "image" ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded-xl p-2.5 text-muted transition-all duration-300 hover:bg-red-500/10 hover:text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add new / drop zone — always visible when there are items */}
          {items.length > 0 && (
            <motion.div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId("new");
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={handleQuickDrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`rounded-3xl border-2 border-dashed transition-all duration-500 ${
                dragOverId === "new"
                  ? "border-accent bg-accent/5 shadow-[0_0_60px_rgba(78,205,196,0.08)]"
                  : "border-border"
              }`}
            >
              <div className="flex flex-col items-center justify-center py-16">
                <p className="mb-5 text-sm text-muted">
                  {dragOverId === "new"
                    ? "Drop images here to add them"
                    : "Keep building — add more work"}
                </p>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => addItem("image")}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-background transition-all duration-300 hover:shadow-[0_0_20px_rgba(78,205,196,0.2)]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Image
                  </motion.button>
                  <motion.button
                    onClick={() => addItem("video")}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-border px-6 py-3 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/50 hover:text-accent"
                  >
                    <Video className="h-4 w-4" />
                    Add Video
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
