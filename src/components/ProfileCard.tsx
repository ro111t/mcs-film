"use client";

import Link from "next/link";
import { User, ArrowUpRight } from "lucide-react";
import type { Profile } from "@/lib/types";
import { motion } from "framer-motion";

export default function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Link href={`/members/${profile.id}`} className="group block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="relative overflow-hidden rounded-2xl bg-surface"
      >
        {/* Image */}
        <div className="aspect-[3/4] relative overflow-hidden">
          {profile.headshot_url ? (
            <img
              src={profile.headshot_url}
              alt={profile.display_name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-light">
              <User className="h-16 w-16 text-border-light" />
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Arrow indicator */}
          <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent/0 text-white/0 backdrop-blur-sm transition-all duration-500 group-hover:bg-accent/90 group-hover:text-background">
            <ArrowUpRight className="h-4 w-4" />
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full p-5 transition-transform duration-500 ease-out group-hover:translate-y-0">
            {profile.bio && (
              <p className="line-clamp-2 text-xs leading-relaxed text-white/70">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Info bar */}
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground transition-colors duration-300 group-hover:text-accent">
                {profile.display_name || "Unnamed Member"}
              </h3>
              {profile.role && (
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted">
                  {profile.role}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Accent border on hover */}
        <div className="absolute inset-0 rounded-2xl border border-accent/0 transition-all duration-500 group-hover:border-accent/30" />
      </motion.div>
    </Link>
  );
}
