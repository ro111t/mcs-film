"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  Sparkles,
  Check,
  Plus,
  X,
} from "lucide-react";
import { SKILLS, GEAR } from "@/lib/types";

const EXP_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Just getting started" },
  { value: "intermediate", label: "Intermediate", desc: "Solid experience" },
  { value: "advanced", label: "Advanced", desc: "Pro-level skills" },
];

export default function SkillsPage() {
  const supabase = createClient();
  const [skills, setSkills] = useState<string[]>([]);
  const [gear, setGear] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [experience, setExperience] = useState("beginner");
  const [customSkill, setCustomSkill] = useState("");
  const [customGear, setCustomGear] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, gear, availability, experience_level")
      .eq("id", user.id)
      .single();

    if (profile) {
      setSkills(profile.skills || []);
      setGear(profile.gear || []);
      setAvailability(profile.availability || "");
      setExperience(profile.experience_level || "beginner");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      skills,
      gear,
      availability,
      experience_level: experience,
    }).eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  };

  const toggleGear = (item: string) => {
    setGear((prev) => prev.includes(item) ? prev.filter((g) => g !== item) : [...prev, item]);
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const addCustomGear = () => {
    if (customGear.trim() && !gear.includes(customGear.trim())) {
      setGear([...gear, customGear.trim()]);
      setCustomGear("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8 lg:py-16">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition-all duration-300 hover:gap-3 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Your Profile
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Skills & Gear</h1>
          <p className="mt-1 text-sm text-muted">
            Tell us what you can do and what you bring to a shoot. This helps match you to crew calls.
          </p>
        </div>

        {/* Experience Level */}
        <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Experience Level</h2>
          <div className="grid grid-cols-3 gap-3">
            {EXP_LEVELS.map((lvl) => (
              <button
                key={lvl.value}
                onClick={() => setExperience(lvl.value)}
                className={`rounded-xl border p-4 text-left transition-all duration-300 ${
                  experience === lvl.value
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/30"
                }`}
              >
                <p className={`text-sm font-semibold ${experience === lvl.value ? "text-accent" : "text-foreground"}`}>
                  {lvl.label}
                </p>
                <p className="mt-0.5 text-xs text-muted">{lvl.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Skills</h2>
            <span className="ml-auto text-xs text-muted">{skills.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  skills.includes(skill)
                    ? "bg-accent/10 text-accent"
                    : "bg-surface-light text-muted hover:text-foreground"
                }`}
              >
                {skills.includes(skill) && <Check className="h-3 w-3" />}
                {skill}
              </button>
            ))}
            {/* Custom skills that aren't in the preset list */}
            {skills.filter((s) => !SKILLS.includes(s as any)).map((s) => (
              <button
                key={s}
                onClick={() => toggleSkill(s)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
              >
                <Check className="h-3 w-3" />
                {s}
                <X className="h-3 w-3 ml-1 opacity-50" />
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
              placeholder="Add a custom skill..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
            />
            <button onClick={addCustomSkill} className="rounded-lg bg-surface-light p-1.5 text-muted hover:text-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Gear */}
        <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Gear & Software</h2>
            <span className="ml-auto text-xs text-muted">{gear.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GEAR.map((item) => (
              <button
                key={item}
                onClick={() => toggleGear(item)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  gear.includes(item)
                    ? "bg-accent/10 text-accent"
                    : "bg-surface-light text-muted hover:text-foreground"
                }`}
              >
                {gear.includes(item) && <Check className="h-3 w-3" />}
                {item}
              </button>
            ))}
            {gear.filter((g) => !GEAR.includes(g as any)).map((g) => (
              <button
                key={g}
                onClick={() => toggleGear(g)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
              >
                <Check className="h-3 w-3" />
                {g}
                <X className="h-3 w-3 ml-1 opacity-50" />
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={customGear}
              onChange={(e) => setCustomGear(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomGear()}
              placeholder="Add custom gear..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
            />
            <button onClick={addCustomGear} className="rounded-lg bg-surface-light p-1.5 text-muted hover:text-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Availability */}
        <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Availability</h2>
          <textarea
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            rows={3}
            placeholder="e.g. Weekends and after 5pm on weekdays. Open to last-minute calls."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
          />
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className={`w-full rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
            saved
              ? "bg-green-500/10 text-green-400"
              : "bg-accent text-background hover:bg-accent/80"
          } disabled:opacity-50`}
        >
          {saved ? "Saved!" : saving ? "Saving..." : "Save Skills & Gear"}
        </button>
      </div>
    </div>
  );
}
