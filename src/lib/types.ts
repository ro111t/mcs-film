export interface Chapter {
  id: string;
  name: string;
  slug: string;
  school: string;
  description: string;
  logo_url: string;
  banner_url: string;
  accent_color: string;
  website_url: string;
  instagram_url: string;
  is_active: boolean;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  bio: string;
  role: string;
  headshot_url: string;
  banner_url: string;
  website_url: string;
  instagram_url: string;
  vimeo_url: string;
  youtube_url: string;
  imdb_url: string;
  is_admin: boolean;
  member_role: "admin" | "officer" | "member";
  chapter_id: string | null;
  is_visible: boolean;
  skills: string[];
  gear: string[];
  availability: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  team_role_name: string | null;
  team_permissions: TeamPermissions;
  created_at: string;
  updated_at: string;
}

export interface TeamPermissions {
  can_manage_events?: boolean;
  can_manage_jobs?: boolean;
  can_manage_feed?: boolean;
  can_manage_members?: boolean;
  can_manage_seasons?: boolean;
  can_manage_roles?: boolean;
}

export const PERMISSION_OPTIONS = [
  { key: "can_manage_events", label: "Manage Events", description: "Create and edit events, meetings, and screenings" },
  { key: "can_manage_jobs", label: "Manage Jobs", description: "Post crew calls and job listings" },
  { key: "can_manage_feed", label: "Manage Feed", description: "Pin/delete posts, post announcements" },
  { key: "can_manage_members", label: "Manage Members", description: "Toggle member visibility, view all profiles" },
  { key: "can_manage_seasons", label: "Manage Seasons", description: "Create and edit curated collections" },
  { key: "can_manage_roles", label: "Manage Roles", description: "Assign roles and permissions to other members" },
] as const;

export interface PortfolioItem {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  media_type: "image" | "video";
  media_url: string;
  video_embed_url: string;
  category: string;
  section_id: string | null;
  grid_size: string;
  show_info: string;
  sort_order: number;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  uploaded_by: string | null;
  title: string;
  description: string;
  image_url: string;
  category: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileSection {
  id: string;
  profile_id: string;
  section_type: string;
  title: string;
  subtitle: string;
  layout: string;
  content: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string | null;
  location: string;
  location_url: string;
  event_type: "meeting" | "shoot" | "screening" | "workshop" | "social" | "other";
  cover_image_url: string;
  created_by: string;
  is_published: boolean;
  created_at: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: "going" | "maybe" | "not_going";
  created_at: string;
}

export const EVENT_TYPES = [
  { value: "meeting", label: "Meeting", icon: "users" },
  { value: "shoot", label: "Shoot", icon: "camera" },
  { value: "screening", label: "Screening", icon: "play" },
  { value: "workshop", label: "Workshop", icon: "book" },
  { value: "social", label: "Social", icon: "heart" },
  { value: "other", label: "Other", icon: "calendar" },
] as const;

export interface Season {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  season_type: "season" | "collection" | "showcase" | "event_collection";
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_by: string;
  created_at: string;
}

export interface SeasonItem {
  id: string;
  season_id: string;
  portfolio_item_id: string | null;
  profile_id: string | null;
  title: string;
  description: string;
  media_url: string;
  sort_order: number;
  created_at: string;
}

export const SEASON_TYPES = [
  { value: "season", label: "Season", desc: "e.g. Fall 2026 Productions" },
  { value: "collection", label: "Collection", desc: "Curated set of member work" },
  { value: "showcase", label: "Showcase", desc: "Best-of highlights" },
  { value: "event_collection", label: "Event Collection", desc: "Content from a specific event" },
] as const;

export interface Post {
  id: string;
  author_id: string;
  body: string;
  image_url: string;
  post_type: "post" | "announcement" | "question";
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
  shoot_date: string | null;
  location: string;
  required_skills: string[];
  required_gear: string[];
  status: "open" | "filled" | "closed";
  event_id: string | null;
  created_by: string;
  created_at: string;
}

export interface JobApplication {
  id: string;
  listing_id: string;
  user_id: string;
  message: string;
  status: "applied" | "accepted" | "rejected";
  created_at: string;
}

export const SKILLS = [
  "Directing",
  "Cinematography",
  "Camera Operator",
  "Editing",
  "Color Grading",
  "Sound Design",
  "Boom Operator",
  "Lighting / Gaffer",
  "Grip",
  "Production Design",
  "Screenwriting",
  "Acting",
  "Producing",
  "VFX / Motion Graphics",
  "Drone Operator",
  "Storyboarding",
  "Music Composition",
  "Photography",
  "Graphic Design",
  "Social Media",
] as const;

export const GEAR = [
  "Canon R5 / R6",
  "Sony FX3 / FX6",
  "Sony A7 Series",
  "Blackmagic Pocket",
  "RED Camera",
  "ARRI (any)",
  "DJI RS3 / RS4 (Gimbal)",
  "DJI Ronin",
  "DJI Drone",
  "Tripod",
  "Slider",
  "Zoom H6 / H8 (Audio)",
  "Rode Mic",
  "Boom Pole + Shotgun Mic",
  "Wireless Lav Kit",
  "LED Panel Lights",
  "Aputure Lights",
  "Reflector / Diffusion",
  "Monitor (Field)",
  "Editing Workstation",
  "DaVinci Resolve",
  "Adobe Premiere",
  "Final Cut Pro",
] as const;

export const PORTFOLIO_CATEGORIES = [
  "All",
  "Highlights",
  "Film",
  "Photography",
  "Behind the Scenes",
  "Reels",
  "Commercial",
  "Music Video",
  "Documentary",
  "Other",
] as const;

export const SECTION_PRESETS = [
  { type: "featured", label: "Featured Reel", description: "Hero section with your best work front and center", icon: "star" },
  { type: "gallery", label: "Photo Gallery", description: "A grid of your best stills and images", icon: "grid" },
  { type: "video_showcase", label: "Video Showcase", description: "Embedded videos from YouTube or Vimeo", icon: "play" },
  { type: "bts", label: "Behind the Scenes", description: "Show the process — on-set photos and stories", icon: "camera" },
  { type: "text", label: "Text Block", description: "A custom text section — bio, artist statement, etc.", icon: "type" },
  { type: "credits", label: "Credits & Roles", description: "List your key projects and roles", icon: "award" },
  { type: "custom", label: "Custom Section", description: "Name it anything and fill it with your work", icon: "plus" },
] as const;

export const LAYOUT_OPTIONS = [
  { value: "grid-2", label: "2-Column Grid", description: "Clean two-column layout" },
  { value: "grid-3", label: "3-Column Grid", description: "Compact three-column layout" },
  { value: "large-feature", label: "Large Feature", description: "One big hero item" },
  { value: "masonry", label: "Alternating", description: "Mixed large and small tiles" },
  { value: "carousel", label: "Horizontal Scroll", description: "Swipeable row of items" },
] as const;
