"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  HelpCircle,
  X,
  ExternalLink,
  Camera,
  Play,
  BookOpen,
  Heart,
  CalendarDays,
  Trash2,
} from "lucide-react";
import type { Event as ClubEvent, EventRsvp } from "@/lib/types";

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  meeting: { label: "Meeting", color: "bg-blue-500/10 text-blue-400", icon: Users },
  shoot: { label: "Shoot", color: "bg-orange-500/10 text-orange-400", icon: Camera },
  screening: { label: "Screening", color: "bg-purple-500/10 text-purple-400", icon: Play },
  workshop: { label: "Workshop", color: "bg-green-500/10 text-green-400", icon: BookOpen },
  social: { label: "Social", color: "bg-pink-500/10 text-pink-400", icon: Heart },
  other: { label: "Other", color: "bg-surface-light text-muted", icon: CalendarDays },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [allRsvps, setAllRsvps] = useState<Record<string, EventRsvp[]>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("member");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [calMonth, setCalMonth] = useState(new Date());
  const [view, setView] = useState<"upcoming" | "calendar">("upcoming");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    end_date: "",
    location: "",
    location_url: "",
    event_type: "meeting" as string,
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

    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: true });
    setEvents(eventsData || []);

    const { data: myRsvps } = await supabase
      .from("event_rsvps")
      .select("*")
      .eq("user_id", user.id);
    setRsvps(myRsvps || []);

    // Load all RSVPs for counts
    const { data: allRsvpData } = await supabase
      .from("event_rsvps")
      .select("*");
    const grouped: Record<string, EventRsvp[]> = {};
    (allRsvpData || []).forEach((r: EventRsvp) => {
      if (!grouped[r.event_id]) grouped[r.event_id] = [];
      grouped[r.event_id].push(r);
    });
    setAllRsvps(grouped);

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRsvp = async (eventId: string, status: "going" | "maybe" | "not_going") => {
    if (!userId) return;
    const existing = rsvps.find((r) => r.event_id === eventId);

    if (existing && existing.status === status) {
      // Remove RSVP
      await supabase.from("event_rsvps").delete().eq("id", existing.id);
      setRsvps(rsvps.filter((r) => r.id !== existing.id));
      setAllRsvps((prev) => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter((r) => r.id !== existing.id),
      }));
    } else if (existing) {
      // Update RSVP
      await supabase.from("event_rsvps").update({ status }).eq("id", existing.id);
      setRsvps(rsvps.map((r) => r.id === existing.id ? { ...r, status } : r));
      setAllRsvps((prev) => ({
        ...prev,
        [eventId]: (prev[eventId] || []).map((r) => r.user_id === userId ? { ...r, status } : r),
      }));
    } else {
      // Insert RSVP
      const { data } = await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: userId, status }).select().single();
      if (data) {
        setRsvps([...rsvps, data]);
        setAllRsvps((prev) => ({
          ...prev,
          [eventId]: [...(prev[eventId] || []), data],
        }));
      }
    }
  };

  const createOrUpdateEvent = async () => {
    if (!userId || !form.title || !form.event_date) return;

    const payload = {
      title: form.title,
      description: form.description,
      event_date: new Date(form.event_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      location: form.location,
      location_url: form.location_url,
      event_type: form.event_type,
      created_by: userId,
    };

    if (editingEvent) {
      await supabase.from("events").update(payload).eq("id", editingEvent.id);
    } else {
      await supabase.from("events").insert(payload);
    }

    setShowCreate(false);
    setEditingEvent(null);
    setForm({ title: "", description: "", event_date: "", end_date: "", location: "", location_url: "", event_type: "meeting" });
    loadData();
  };

  const deleteEvent = async (eventId: string) => {
    await supabase.from("events").delete().eq("id", eventId);
    setSelectedEvent(null);
    loadData();
  };

  const openEdit = (event: ClubEvent) => {
    setForm({
      title: event.title,
      description: event.description,
      event_date: event.event_date.slice(0, 16),
      end_date: event.end_date ? event.end_date.slice(0, 16) : "",
      location: event.location,
      location_url: event.location_url,
      event_type: event.event_type,
    });
    setEditingEvent(event);
    setShowCreate(true);
  };

  // Calendar helpers
  const calYear = calMonth.getFullYear();
  const calMo = calMonth.getMonth();
  const firstDay = new Date(calYear, calMo, 1).getDay();
  const daysInMonth = new Date(calYear, calMo + 1, 0).getDate();
  const today = new Date();

  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date(today.toDateString()));
  const pastEvents = events.filter((e) => new Date(e.event_date) < new Date(today.toDateString()));

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
              Events
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Meetings & Events
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              <button
                onClick={() => setView("upcoming")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view === "upcoming" ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view === "calendar" ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
              >
                Calendar
              </button>
            </div>
            {canManage && (
              <button
                onClick={() => { setEditingEvent(null); setForm({ title: "", description: "", event_date: "", end_date: "", location: "", location_url: "", event_type: "meeting" }); setShowCreate(true); }}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80"
              >
                <Plus className="h-4 w-4" />
                New Event
              </button>
            )}
          </div>
        </div>

        {/* Calendar View */}
        {view === "calendar" && (
          <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setCalMonth(new Date(calYear, calMo - 1, 1))} className="rounded-lg p-2 text-muted hover:bg-surface-light hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-sm font-semibold text-foreground">
                {calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <button onClick={() => setCalMonth(new Date(calYear, calMo + 1, 1))} className="rounded-lg p-2 text-muted hover:bg-surface-light hover:text-foreground">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-px">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(calYear, calMo, day);
                const isToday = isSameDay(date, today);
                const dayEvents = events.filter((e) => isSameDay(new Date(e.event_date), date));
                return (
                  <button
                    key={day}
                    onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
                    className={`relative aspect-square rounded-lg p-1 text-xs transition-all ${
                      isToday ? "bg-accent/10 font-bold text-accent" : "text-foreground hover:bg-surface-light"
                    } ${dayEvents.length > 0 ? "cursor-pointer" : ""}`}
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div key={e.id} className={`h-1.5 w-1.5 rounded-full ${EVENT_TYPE_CONFIG[e.event_type]?.color.split(" ")[0] || "bg-accent/30"}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {view === "upcoming" && (
          <div className="space-y-4">
            {upcomingEvents.length === 0 && (
              <div className="rounded-2xl border border-border bg-surface py-16 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-border-light" />
                <p className="text-sm font-medium text-muted">No upcoming events</p>
                {canManage && <p className="mt-1 text-xs text-muted">Create one to get started</p>}
              </div>
            )}
            {upcomingEvents.map((event) => {
              const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.other;
              const Icon = config.icon;
              const myRsvp = rsvps.find((r) => r.event_id === event.id);
              const goingCount = (allRsvps[event.id] || []).filter((r) => r.status === "going").length;
              const maybeCount = (allRsvps[event.id] || []).filter((r) => r.status === "maybe").length;

              return (
                <div
                  key={event.id}
                  className="group rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:border-accent/20"
                >
                  <div className="flex items-start gap-4">
                    {/* Date badge */}
                    <div className="flex shrink-0 flex-col items-center rounded-xl bg-background px-4 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                        {new Date(event.event_date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        {new Date(event.event_date).getDate()}
                      </span>
                      <span className="text-[10px] text-muted">
                        {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-lg font-semibold text-foreground">{event.title}</h3>
                      {event.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{event.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(event.event_date)}
                          {event.end_date && ` – ${formatTime(event.end_date)}`}
                        </span>
                        {event.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location_url ? (
                              <a href={event.location_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                                {event.location} <ExternalLink className="inline h-3 w-3" />
                              </a>
                            ) : event.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {goingCount} going{maybeCount > 0 && `, ${maybeCount} maybe`}
                        </span>
                      </div>
                    </div>

                    {/* RSVP + manage */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleRsvp(event.id, "going")}
                          className={`rounded-lg p-2 transition-all ${myRsvp?.status === "going" ? "bg-green-500/10 text-green-400" : "bg-surface-light text-muted hover:text-foreground"}`}
                          title="Going"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRsvp(event.id, "maybe")}
                          className={`rounded-lg p-2 transition-all ${myRsvp?.status === "maybe" ? "bg-yellow-500/10 text-yellow-400" : "bg-surface-light text-muted hover:text-foreground"}`}
                          title="Maybe"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRsvp(event.id, "not_going")}
                          className={`rounded-lg p-2 transition-all ${myRsvp?.status === "not_going" ? "bg-red-500/10 text-red-400" : "bg-surface-light text-muted hover:text-foreground"}`}
                          title="Can't go"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {canManage && (
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(event)}
                            className="rounded-md px-2 py-1 text-[10px] font-medium text-muted hover:bg-surface-light hover:text-foreground"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="rounded-md px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Past events */}
            {pastEvents.length > 0 && (
              <div className="pt-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted">Past Events</h3>
                <div className="space-y-3">
                  {pastEvents.slice(0, 5).map((event) => {
                    const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.other;
                    const goingCount = (allRsvps[event.id] || []).filter((r) => r.status === "going").length;
                    return (
                      <div key={event.id} className="flex items-center gap-4 rounded-xl border border-border/50 bg-surface/50 px-4 py-3 opacity-60">
                        <span className="text-xs font-medium text-muted">{formatDate(event.event_date)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>{config.label}</span>
                        <span className="flex-1 truncate text-sm text-foreground">{event.title}</span>
                        <span className="text-xs text-muted">{goingCount} attended</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event detail modal (from calendar click) */}
        {selectedEvent && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSelectedEvent(null)} />
            <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${EVENT_TYPE_CONFIG[selectedEvent.event_type]?.color}`}>
                    {EVENT_TYPE_CONFIG[selectedEvent.event_type]?.label}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-foreground">{selectedEvent.title}</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {selectedEvent.description && <p className="mt-3 text-sm text-muted">{selectedEvent.description}</p>}
              <div className="mt-4 space-y-2 text-sm text-muted">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(selectedEvent.event_date)} at {formatTime(selectedEvent.event_date)}</div>
                {selectedEvent.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {selectedEvent.location}</div>}
              </div>
              <div className="mt-5 flex gap-2">
                {(["going", "maybe", "not_going"] as const).map((s) => {
                  const myRsvp = rsvps.find((r) => r.event_id === selectedEvent.id);
                  const labels = { going: "Going", maybe: "Maybe", not_going: "Can't Go" };
                  const colors = { going: "bg-green-500/10 text-green-400", maybe: "bg-yellow-500/10 text-yellow-400", not_going: "bg-red-500/10 text-red-400" };
                  return (
                    <button
                      key={s}
                      onClick={() => handleRsvp(selectedEvent.id, s)}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${myRsvp?.status === s ? colors[s] : "bg-surface-light text-muted hover:text-foreground"}`}
                    >
                      {labels[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Create / Edit modal */}
        {showCreate && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowCreate(false)} />
            <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl" style={{ maxHeight: "90vh" }}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">
                  {editingEvent ? "Edit Event" : "New Event"}
                </h3>
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
                    placeholder="Club meeting, shoot, screening..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setForm({ ...form, event_type: key })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${form.event_type === key ? cfg.color : "bg-surface-light text-muted hover:text-foreground"}`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Start *</label>
                    <input
                      type="datetime-local"
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">End</label>
                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    placeholder="e.g. Room 204, SF campus"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Location URL (maps link)</label>
                  <input
                    value={form.location_url}
                    onChange={(e) => setForm({ ...form, location_url: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    placeholder="What's this event about?"
                  />
                </div>

                <button
                  onClick={createOrUpdateEvent}
                  disabled={!form.title || !form.event_date}
                  className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingEvent ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
