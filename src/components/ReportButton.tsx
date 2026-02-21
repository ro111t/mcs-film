"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Flag, X, Check } from "lucide-react";

const REASONS = [
  "Inappropriate content",
  "Spam or misleading",
  "Copyright violation",
  "Harassment or abuse",
  "Other",
];

export default function ReportButton({
  contentType,
  contentId,
}: {
  contentType: "portfolio_item" | "profile" | "post" | "comment";
  contentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const supabase = createClient();

  const submit = async () => {
    setStatus("sending");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      return;
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      reason,
    });

    if (error) {
      setStatus("error");
    } else {
      setStatus("sent");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setReason("");
      }, 1500);
    }
  };

  if (status === "sent") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
        <Check className="h-3.5 w-3.5" />
        Reported
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg p-1.5 text-muted transition-all duration-300 hover:bg-red-500/10 hover:text-red-400"
        title="Report content"
      >
        <Flag className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-surface p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Report Content</p>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-all duration-200 ${
                    reason === r
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-surface-light hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={submit}
              disabled={!reason || status === "sending"}
              className="mt-3 w-full rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-all duration-300 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === "sending" ? "Sending…" : "Submit Report"}
            </button>
            {status === "error" && (
              <p className="mt-2 text-xs text-red-400">Something went wrong. Try again.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
