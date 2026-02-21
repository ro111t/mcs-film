"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Play, X } from "lucide-react";
import type { ProfileSection, PortfolioItem } from "@/lib/types";

function VideoEmbed({ url }: { url: string }) {
  let embedUrl = url;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl">
      <iframe
        src={embedUrl}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

const SIZE_SPAN: Record<string, string> = {
  xs: "col-span-2",
  small: "col-span-3",
  medium: "col-span-4",
  large: "col-span-6",
  full: "col-span-12",
};
const SIZE_ASPECT: Record<string, string> = {
  xs: "aspect-square",
  small: "aspect-square",
  medium: "aspect-[4/3]",
  large: "aspect-video",
  full: "aspect-[21/9]",
};

function ItemCard({ item }: { item: PortfolioItem }) {
  const [lightbox, setLightbox] = useState(false);
  const span = SIZE_SPAN[item.grid_size] || "col-span-4";
  const aspect = SIZE_ASPECT[item.grid_size] || "aspect-[4/3]";
  const showAlways = item.show_info === "always";
  const showHidden = item.show_info === "hidden";

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className={`${span} group overflow-hidden rounded-xl bg-surface`}
      >
        {item.media_type === "video" && item.video_embed_url ? (
          <VideoEmbed url={item.video_embed_url} />
        ) : item.media_type === "image" && item.media_url ? (
          <div
            className={`${aspect} relative cursor-pointer overflow-hidden bg-surface-light`}
            onClick={() => setLightbox(true)}
          >
            <img
              src={item.media_url}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />

            {/* Always-visible info overlay */}
            {showAlways && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                <h4 className="text-sm font-semibold text-white">{item.title || "Untitled"}</h4>
                {item.description && <p className="mt-0.5 text-xs text-white/70 line-clamp-2">{item.description}</p>}
              </div>
            )}

            {/* Hover info overlay */}
            {!showAlways && !showHidden && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <h4 className="text-sm font-semibold text-white">{item.title || "Untitled"}</h4>
                {item.description && <p className="mt-0.5 text-xs text-white/70 line-clamp-2">{item.description}</p>}
              </div>
            )}
          </div>
        ) : (
          <div className={`${aspect} flex items-center justify-center bg-surface-light`}>
            {item.media_type === "video" ? <Play className="h-10 w-10 text-border-light" /> : <ImageIcon className="h-10 w-10 text-border-light" />}
          </div>
        )}
      </motion.div>

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

function TextSection({ section }: { section: ProfileSection }) {
  if (!section.content) return null;
  return (
    <div className="max-w-2xl">
      {section.content.split("\n").map((line, i) => (
        <p key={i} className={`text-base leading-relaxed text-muted ${line.trim() === "" ? "h-4" : ""}`}>
          {line}
        </p>
      ))}
    </div>
  );
}

function CreditsSection({ section }: { section: ProfileSection }) {
  if (!section.content) return null;
  const lines = section.content.split("\n").filter((l) => l.trim());
  return (
    <div className="max-w-2xl space-y-3">
      {lines.map((line, i) => {
        const [role, ...rest] = line.split("—").map((s) => s.trim());
        const project = rest.join(" — ");
        return (
          <div key={i} className="flex items-baseline gap-3 rounded-xl bg-surface p-4">
            <span className="shrink-0 text-sm font-semibold text-accent">{role}</span>
            {project && <span className="text-sm text-muted">{project}</span>}
          </div>
        );
      })}
    </div>
  );
}

function PortfolioLayout({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted/50">No items in this section yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default function SectionRenderer({
  section,
  items,
}: {
  section: ProfileSection;
  items: PortfolioItem[];
}) {
  const isTextType = section.section_type === "text";
  const isCreditsType = section.section_type === "credits";

  return (
    <div className="py-14 first:pt-16">
      {/* Section header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {section.title}
          </h2>
          <div className="h-px flex-1 bg-border/50" />
        </div>
        {section.subtitle && (
          <p className="mt-1 text-sm text-muted">{section.subtitle}</p>
        )}
      </div>

      {/* Section content */}
      {isTextType ? (
        <TextSection section={section} />
      ) : isCreditsType ? (
        <CreditsSection section={section} />
      ) : (
        <PortfolioLayout items={items} />
      )}
    </div>
  );
}
