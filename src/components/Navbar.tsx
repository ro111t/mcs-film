"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Film, Menu, X, LogOut, LayoutDashboard, MessageCircle, CalendarDays, Briefcase } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollDirection } from "./motion";
import type { User as SupaUser } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hidden = useScrollDirection();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/50 bg-background/60 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg"
          >
            <img src="/mcs-logo.png" alt="MCS" className="h-9 w-9 object-contain" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            MCS
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 sm:flex">
          <NavLink href="/members">Members</NavLink>
          <NavLink href="/chapters">Chapters</NavLink>
          {user ? (
            <>
              <NavLink href="/dashboard/feed">
                <MessageCircle className="h-3.5 w-3.5" />
                Feed
              </NavLink>
              <NavLink href="/dashboard/events">
                <CalendarDays className="h-3.5 w-3.5" />
                Events
              </NavLink>
              <NavLink href="/dashboard/jobs">
                <Briefcase className="h-3.5 w-3.5" />
                Jobs
              </NavLink>
              <NavLink href="/dashboard">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </NavLink>
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="ml-3 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition-all duration-300 hover:border-accent/50 hover:text-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-3 flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background transition-all duration-300 hover:bg-accent/80 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              Enter
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-foreground/70"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl sm:hidden"
          >
            <div className="space-y-1 px-6 py-4">
              <MobileNavLink href="/members" onClick={() => setMenuOpen(false)}>
                Members
              </MobileNavLink>
              <MobileNavLink href="/chapters" onClick={() => setMenuOpen(false)}>
                Chapters
              </MobileNavLink>
              {user ? (
                <>
                  <MobileNavLink href="/dashboard/feed" onClick={() => setMenuOpen(false)}>
                    Feed
                  </MobileNavLink>
                  <MobileNavLink href="/dashboard/events" onClick={() => setMenuOpen(false)}>
                    Events
                  </MobileNavLink>
                  <MobileNavLink href="/dashboard/jobs" onClick={() => setMenuOpen(false)}>
                    Jobs
                  </MobileNavLink>
                  <MobileNavLink href="/dashboard" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </MobileNavLink>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="block w-full py-3 text-left text-sm font-medium text-muted transition-colors hover:text-accent"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <MobileNavLink href="/login" onClick={() => setMenuOpen(false)}>
                  Enter
                </MobileNavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted transition-all duration-300 hover:bg-surface-light hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block py-3 text-sm font-medium text-muted transition-colors hover:text-accent"
    >
      {children}
    </Link>
  );
}
