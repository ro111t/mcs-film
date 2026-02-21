"use client";

import { Image as ImageIcon, Play, X } from "lucide-react";
import type { PortfolioItem } from "@/lib/types";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PORTFOLIO_CATEGORIES } from "@/lib/types";

function VideoEmbed({ url }: { url: string }) {
  let embedUrl = url;

  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
  );
  if (ytMatch) {
    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function PortfolioItemCard({ item }: { item: PortfolioItem }) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="group overflow-hidden rounded-xl bg-surface"
      >
        {item.media_type === "video" && item.video_embed_url ? (
          <VideoEmbed url={item.video_embed_url} />
        ) : item.media_type === "image" && item.media_url ? (
          <div
            className="aspect-video relative cursor-pointer overflow-hidden bg-surface-light"
            onClick={() => setLightbox(true)}
          >
            <img
              src={item.media_url}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-surface-light">
            {item.media_type === "video" ? (
              <Play className="h-10 w-10 text-border-light" />
            ) : (
              <ImageIcon className="h-10 w-10 text-border-light" />
            )}
          </div>
        )}
        <div className="border-t border-border/50 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-foreground">
                {item.title || "Untitled"}
              </h4>
              {item.description && (
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
            {item.category && (
              <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                {item.category}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && item.media_type === "image" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            <button className="absolute right-6 top-6 text-white/50 transition-colors hover:text-white">
              <X className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={item.media_url}
              alt={item.title}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function PortfolioGrid({
  items,
}: {
  items: PortfolioItem[];
}) {
  const [activeFilter, setActiveFilter] = useState("All");

  if (items.length === 0) {
    return (
      <div className="gradient-border rounded-2xl bg-surface p-12 text-center">
        <p className="text-muted">No portfolio items yet.</p>
      </div>
    );
  }

  const usedCategories = PORTFOLIO_CATEGORIES.filter(
    (c) => c === "All" || items.some((i) => i.category === c)
  );
  const hasCategories = usedCategories.length > 1;

  const filtered =
    activeFilter === "All"
      ? items
      : items.filter((i) => i.category === activeFilter);

  return (
    <div>
      {hasCategories && (
        <div className="mb-8 flex flex-wrap gap-2">
          {usedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 ${
                activeFilter === cat
                  ? "bg-accent text-background"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {cat}
              {cat !== "All" && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {items.filter((i) => i.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <PortfolioItemCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
