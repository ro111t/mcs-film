"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  User,
  Users,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/lib/types";

interface Report {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function AdminPanel({ members, reports: initialReports }: { members: Profile[]; reports: Report[] }) {
  const [memberList, setMemberList] = useState(members);
  const [reportList, setReportList] = useState(initialReports);
  const [message, setMessage] = useState({ type: "", text: "" });
  const supabase = createClient();

  const pendingReports = reportList.filter((r) => r.status === "pending");

  const updateReport = async (reportId: string, status: "reviewed" | "dismissed") => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("reports")
      .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq("id", reportId);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setReportList(reportList.map((r) => r.id === reportId ? { ...r, status } : r));
  };

  const toggleVisibility = async (id: string, currentlyVisible: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_visible: !currentlyVisible })
      .eq("id", id);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMemberList(
      memberList.map((m) =>
        m.id === id ? { ...m, is_visible: !currentlyVisible } : m
      )
    );
  };

  const ROLE_CYCLE: Record<string, "admin" | "officer" | "member"> = {
    member: "officer",
    officer: "admin",
    admin: "member",
  };

  const cycleRole = async (id: string, currentRole: string) => {
    const nextRole = ROLE_CYCLE[currentRole] || "member";
    const isAdmin = nextRole === "admin";
    const { error } = await supabase
      .from("profiles")
      .update({ member_role: nextRole, is_admin: isAdmin })
      .eq("id", id);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMemberList(
      memberList.map((m) =>
        m.id === id ? { ...m, member_role: nextRole, is_admin: isAdmin } : m
      )
    );
  };

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
            Administration
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage club members and visibility settings
          </p>
        </div>

        {message.text && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              message.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-green-500/20 bg-green-500/10 text-green-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <Users className="h-5 w-5 text-accent" />
            <p className="mt-3 text-2xl font-bold text-foreground">
              {memberList.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Total Members
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <Eye className="h-5 w-5 text-green-400" />
            <p className="mt-3 text-2xl font-bold text-foreground">
              {memberList.filter((m) => m.is_visible).length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Visible</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <Shield className="h-5 w-5 text-accent" />
            <p className="mt-3 text-2xl font-bold text-foreground">
              {memberList.filter((m) => m.member_role === "officer").length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Officers</p>
          </div>
          <div className={`rounded-xl border p-5 ${
            pendingReports.length > 0
              ? "border-red-500/30 bg-red-500/5"
              : "border-border bg-surface"
          }`}>
            <Flag className={`h-5 w-5 ${pendingReports.length > 0 ? "text-red-400" : "text-muted"}`} />
            <p className="mt-3 text-2xl font-bold text-foreground">
              {pendingReports.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Pending Reports</p>
          </div>
        </div>

        {/* Flagged Content */}
        {pendingReports.length > 0 && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-surface">
            <div className="flex items-center gap-2 border-b border-red-500/20 px-5 py-4">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-red-400">
                Flagged Content ({pendingReports.length})
              </h2>
            </div>
            <div className="divide-y divide-border/50">
              {pendingReports.map((report) => {
                const reporter = memberList.find((m) => m.id === report.reporter_id);
                const target = report.content_type === "profile"
                  ? memberList.find((m) => m.id === report.content_id)
                  : null;
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between px-5 py-4 transition-colors duration-300 hover:bg-surface-light"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-surface-light px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                          {report.content_type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {report.reason}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Reported by {reporter?.display_name || "Unknown"}
                        {target ? ` — against ${target.display_name || "Unknown"}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateReport(report.id, "reviewed")}
                        className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-all duration-300 hover:bg-red-500/20"
                        title="Mark as reviewed (take action)"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateReport(report.id, "dismissed")}
                        className="rounded-lg bg-surface-light p-2 text-muted transition-all duration-300 hover:text-foreground"
                        title="Dismiss report"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Members table */}
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              All Members
            </h2>
          </div>
          <div className="divide-y divide-border/50">
            {memberList.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-5 py-4 transition-colors duration-300 hover:bg-surface-light"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-light">
                    {member.headshot_url ? (
                      <img
                        src={member.headshot_url}
                        alt={member.display_name}
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
                    <p className="text-xs text-muted">
                      {member.role || "No role"}{" "}
                      {member.member_role === "admin" && (
                        <span className="ml-1 inline-flex items-center rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          Admin
                        </span>
                      )}
                      {member.member_role === "officer" && (
                        <span className="ml-1 inline-flex items-center rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                          Officer
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      toggleVisibility(member.id, member.is_visible)
                    }
                    className={`rounded-lg p-2 text-sm transition-all duration-300 ${
                      member.is_visible
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        : "bg-surface-light text-muted hover:text-foreground"
                    }`}
                    title={
                      member.is_visible ? "Hide from public" : "Show on public"
                    }
                  >
                    {member.is_visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => cycleRole(member.id, member.member_role || "member")}
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                      member.member_role === "admin"
                        ? "bg-accent/10 text-accent hover:bg-accent/20"
                        : member.member_role === "officer"
                        ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                        : "bg-surface-light text-muted hover:text-foreground"
                    }`}
                    title={`Current: ${member.member_role || "member"} — click to cycle`}
                  >
                    {member.member_role || "member"}
                  </button>
                </div>
              </div>
            ))}

            {memberList.length === 0 && (
              <div className="py-10 text-center text-sm text-muted">
                No members yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
