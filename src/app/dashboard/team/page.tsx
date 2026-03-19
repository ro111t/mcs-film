"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Shield,
  User,
  X,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Briefcase,
  MessageCircle,
  Eye,
  Star,
  Crown,
} from "lucide-react";
import type { Profile, TeamPermissions } from "@/lib/types";
import { PERMISSION_OPTIONS } from "@/lib/types";

const ROLE_PRESETS = [
  {
    name: "President",
    permissions: {
      can_manage_events: true,
      can_manage_jobs: true,
      can_manage_feed: true,
      can_manage_members: true,
      can_manage_seasons: true,
      can_manage_roles: true,
    },
  },
  {
    name: "Vice President",
    permissions: {
      can_manage_events: true,
      can_manage_jobs: true,
      can_manage_feed: true,
      can_manage_members: true,
      can_manage_seasons: true,
      can_manage_roles: false,
    },
  },
  {
    name: "Officer",
    permissions: {
      can_manage_events: true,
      can_manage_jobs: true,
      can_manage_feed: true,
      can_manage_members: false,
      can_manage_seasons: true,
      can_manage_roles: false,
    },
  },
  {
    name: "Developer",
    permissions: {
      can_manage_events: true,
      can_manage_jobs: true,
      can_manage_feed: true,
      can_manage_members: true,
      can_manage_seasons: true,
      can_manage_roles: true,
    },
  },
];

const PERM_ICONS: Record<string, any> = {
  can_manage_events: Calendar,
  can_manage_jobs: Briefcase,
  can_manage_feed: MessageCircle,
  can_manage_members: Eye,
  can_manage_seasons: Star,
  can_manage_roles: Crown,
};

export default function TeamPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [canManageRoles, setCanManageRoles] = useState(false);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editPermissions, setEditPermissions] = useState<TeamPermissions>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, member_role, team_permissions")
        .eq("id", user.id)
        .single();

      const isAdmin = profile?.is_admin || profile?.member_role === "admin";
      const hasRolePerm = profile?.team_permissions?.can_manage_roles === true;
      if (!isAdmin && !hasRolePerm) {
        router.push("/dashboard");
        return;
      }
      setCanManageRoles(true);

      const { data: allMembers } = await supabase
        .from("profiles")
        .select("*")
        .order("display_name", { ascending: true });
      setMembers(allMembers || []);
      setLoading(false);
    })();
  }, [supabase, router]);

  const startEditing = (member: Profile) => {
    setEditingId(member.id);
    setEditRoleName(member.team_role_name || "");
    setEditPermissions(member.team_permissions || {});
  };

  const applyPreset = (preset: (typeof ROLE_PRESETS)[number]) => {
    setEditRoleName(preset.name);
    setEditPermissions(preset.permissions);
  };

  const togglePermission = (key: string) => {
    setEditPermissions((prev) => ({
      ...prev,
      [key]: !prev[key as keyof TeamPermissions],
    }));
  };

  const saveRole = async (memberId: string) => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    const memberRole = editRoleName
      ? Object.values(editPermissions).some(Boolean)
        ? "officer"
        : "member"
      : "member";

    const isAdmin =
      editPermissions.can_manage_roles && editPermissions.can_manage_members;

    const { error } = await supabase
      .from("profiles")
      .update({
        team_role_name: editRoleName || null,
        team_permissions: editRoleName ? editPermissions : {},
        member_role: isAdmin ? "admin" : memberRole,
        is_admin: isAdmin || false,
      })
      .eq("id", memberId);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                team_role_name: editRoleName || null,
                team_permissions: editRoleName ? editPermissions : {},
                member_role: isAdmin ? "admin" : memberRole,
                is_admin: isAdmin || false,
              }
            : m
        )
      );
      setMessage({ type: "success", text: `Role updated for ${members.find(m => m.id === memberId)?.display_name || "member"}` });
      setEditingId(null);
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const removeRole = async (memberId: string) => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        team_role_name: null,
        team_permissions: {},
        member_role: "member",
        is_admin: false,
      })
      .eq("id", memberId);

    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, team_role_name: null, team_permissions: {}, member_role: "member" as const, is_admin: false }
          : m
      )
    );
    setEditingId(null);
    setSaving(false);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase()) ||
      m.team_role_name?.toLowerCase().includes(search.toLowerCase())
  );

  const teamMembers = members.filter((m) => m.team_role_name);
  const unassigned = filteredMembers.filter((m) => !m.team_role_name);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!canManageRoles) return null;

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

        <div className="mb-10">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Management
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Team & Roles
          </h1>
          <p className="mt-1 text-sm text-muted">
            Assign named roles and permissions to your team members.
          </p>
        </div>

        {/* Success/error banner */}
        {message.text && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              message.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-green-500/20 bg-green-500/10 text-green-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Current team */}
        {teamMembers.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Current Team ({teamMembers.length})
            </h2>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-light">
                        {member.headshot_url ? (
                          <img
                            src={member.headshot_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-5 w-5 text-border-light" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {member.display_name || "Unnamed"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                            <Shield className="h-3 w-3" />
                            {member.team_role_name}
                          </span>
                          {member.role && (
                            <span className="text-xs text-muted">
                              {member.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.id !== userId && (
                        <button
                          onClick={() =>
                            editingId === member.id
                              ? setEditingId(null)
                              : startEditing(member)
                          }
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-all hover:bg-surface-light hover:text-foreground"
                        >
                          {editingId === member.id ? "Cancel" : "Edit"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permissions badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {PERMISSION_OPTIONS.map((perm) => {
                      const enabled =
                        member.team_permissions?.[
                          perm.key as keyof TeamPermissions
                        ];
                      if (!enabled) return null;
                      const Icon = PERM_ICONS[perm.key] || Shield;
                      return (
                        <span
                          key={perm.key}
                          className="inline-flex items-center gap-1 rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-medium text-muted"
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {perm.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Edit panel */}
                  {editingId === member.id && (
                    <RoleEditor
                      roleName={editRoleName}
                      permissions={editPermissions}
                      onRoleNameChange={setEditRoleName}
                      onTogglePermission={togglePermission}
                      onApplyPreset={applyPreset}
                      onSave={() => saveRole(member.id)}
                      onRemove={() => removeRole(member.id)}
                      saving={saving}
                      showRemove={true}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All members — assign roles */}
        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
            All Members
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {unassigned.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-light">
                      {member.headshot_url ? (
                        <img
                          src={member.headshot_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-4 w-4 text-border-light" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.display_name || "Unnamed"}
                      </p>
                      <p className="text-xs text-muted">
                        {member.role || "No role"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      editingId === member.id
                        ? setEditingId(null)
                        : startEditing(member)
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      editingId === member.id
                        ? "bg-surface-light text-muted"
                        : "bg-accent/10 text-accent hover:bg-accent/20"
                    }`}
                  >
                    {editingId === member.id ? "Cancel" : "Assign Role"}
                  </button>
                </div>

                {/* Edit panel */}
                {editingId === member.id && (
                  <RoleEditor
                    roleName={editRoleName}
                    permissions={editPermissions}
                    onRoleNameChange={setEditRoleName}
                    onTogglePermission={togglePermission}
                    onApplyPreset={applyPreset}
                    onSave={() => saveRole(member.id)}
                    onRemove={null}
                    saving={saving}
                    showRemove={false}
                  />
                )}
              </div>
            ))}

            {unassigned.length === 0 && (
              <div className="rounded-xl border border-border bg-surface py-10 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-border-light" />
                <p className="text-sm text-muted">
                  {search
                    ? "No members match your search"
                    : "All members have roles assigned"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleEditor({
  roleName,
  permissions,
  onRoleNameChange,
  onTogglePermission,
  onApplyPreset,
  onSave,
  onRemove,
  saving,
  showRemove,
}: {
  roleName: string;
  permissions: TeamPermissions;
  onRoleNameChange: (name: string) => void;
  onTogglePermission: (key: string) => void;
  onApplyPreset: (preset: (typeof ROLE_PRESETS)[number]) => void;
  onSave: () => void;
  onRemove: (() => void) | null;
  saving: boolean;
  showRemove: boolean;
}) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-4">
      {/* Role name */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-muted">
          Role Name
        </label>
        <input
          value={roleName}
          onChange={(e) => onRoleNameChange(e.target.value)}
          placeholder="e.g. President, VP, Developer..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Quick presets */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-muted">
          Quick Presets
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ROLE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onApplyPreset(preset)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                roleName === preset.name
                  ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                  : "bg-surface-light text-muted hover:text-foreground"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions grid */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-muted">
          Permissions
        </label>
        <div className="space-y-1.5">
          {PERMISSION_OPTIONS.map((perm) => {
            const enabled =
              permissions[perm.key as keyof TeamPermissions] || false;
            const Icon = PERM_ICONS[perm.key] || Shield;
            return (
              <button
                key={perm.key}
                onClick={() => onTogglePermission(perm.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                  enabled
                    ? "bg-accent/10 text-foreground"
                    : "bg-surface text-muted hover:bg-surface-light"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    enabled ? "bg-accent/20 text-accent" : "bg-surface-light"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">{perm.label}</p>
                  <p className="text-[10px] text-muted">{perm.description}</p>
                </div>
                <div
                  className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-all ${
                    enabled ? "bg-accent" : "bg-border"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {showRemove && onRemove && (
            <button
              onClick={onRemove}
              className="text-xs font-medium text-red-400 hover:text-red-300"
            >
              Remove Role
            </button>
          )}
        </div>
        <button
          onClick={onSave}
          disabled={!roleName.trim() || saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving..." : "Save Role"}
        </button>
      </div>
    </div>
  );
}
