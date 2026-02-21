"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Film, Sparkles } from "lucide-react";

export default function CreateChapterPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    school: "",
    description: "",
    accent_color: "#4ecdc4",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("member_role")
        .eq("id", user.id)
        .single();
      setIsAdmin(profile?.member_role === "admin");
      setLoading(false);
    })();
  }, [supabase, router]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: generateSlug(name) });
  };

  const createChapter = async () => {
    if (!userId || !form.name || !form.slug) return;
    setCreating(true);
    setError("");

    const { data: chapter, error: createError } = await supabase
      .from("chapters")
      .insert({
        name: form.name,
        slug: form.slug,
        school: form.school,
        description: form.description,
        accent_color: form.accent_color,
        created_by: userId,
      })
      .select()
      .single();

    if (createError) {
      setError(createError.message.includes("unique") ? "That URL slug is already taken. Try another." : createError.message);
      setCreating(false);
      return;
    }

    // Assign the creator to this chapter
    await supabase
      .from("profiles")
      .update({ chapter_id: chapter.id })
      .eq("id", userId);

    router.push(`/chapters/${chapter.slug}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-24">
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <p className="text-muted">Only admins can create new chapters.</p>
          <Link href="/chapters" className="mt-4 inline-block text-sm text-accent hover:underline">Browse chapters</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-lg px-6 py-12 lg:py-16">
        <Link
          href="/chapters"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition-all duration-300 hover:gap-3 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chapters
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Start a New Chapter</h1>
          <p className="mt-2 text-sm text-muted">
            Create a chapter for your school&apos;s film &amp; media collective.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Chapter Name *</label>
              <input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                placeholder="e.g. MCS at UCLA"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">URL Slug *</label>
              <div className="flex items-center gap-0 rounded-lg border border-border bg-background">
                <span className="shrink-0 px-3 text-xs text-muted">frank.app/chapters/</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className="w-full border-0 bg-transparent px-1 py-2.5 text-sm text-foreground focus:outline-none"
                  placeholder="mcs-ucla"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">School / University</label>
              <input
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                placeholder="e.g. University of California, Los Angeles"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                placeholder="Tell people what your chapter is about..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border"
                />
                <span className="text-xs text-muted">{form.accent_color}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={createChapter}
              disabled={!form.name || !form.slug || creating}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? "Creating..." : "Create Chapter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
