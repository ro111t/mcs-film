"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Pin,
  Send,
  Megaphone,
  HelpCircle,
  MoreHorizontal,
  Trash2,
  X,
  User,
  Image as ImageIcon,
} from "lucide-react";
import type { Post, PostComment, PostLike, Profile } from "@/lib/types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const POST_TYPE_CONFIG = {
  post: { label: "Post", icon: Send, color: "" },
  announcement: { label: "Announcement", icon: Megaphone, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  question: { label: "Question", icon: HelpCircle, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

export default function FeedPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [likes, setLikes] = useState<Record<string, PostLike[]>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState("member");
  const [loading, setLoading] = useState(true);

  // New post form
  const [newBody, setNewBody] = useState("");
  const [newType, setNewType] = useState<"post" | "announcement" | "question">("post");
  const [posting, setPosting] = useState(false);

  // Comment forms
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");

  // Expanded comments
  const [showComments, setShowComments] = useState<Set<string>>(new Set());

  // Menu
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

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

    // Load posts
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setPosts(postsData || []);

    // Load all author profiles
    const authorIds = [...new Set((postsData || []).map((p: Post) => p.author_id))];
    if (authorIds.length > 0) {
      const { data: authorProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", authorIds);
      const map: Record<string, Profile> = {};
      (authorProfiles || []).forEach((p: Profile) => { map[p.id] = p; });
      setProfiles(map);
    }

    // Load comments
    const { data: commentsData } = await supabase
      .from("post_comments")
      .select("*")
      .order("created_at", { ascending: true });
    const commentMap: Record<string, PostComment[]> = {};
    (commentsData || []).forEach((c: PostComment) => {
      if (!commentMap[c.post_id]) commentMap[c.post_id] = [];
      commentMap[c.post_id].push(c);
    });
    setComments(commentMap);

    // Load comment author profiles too
    const commentAuthorIds = [...new Set((commentsData || []).map((c: PostComment) => c.author_id))];
    if (commentAuthorIds.length > 0) {
      const { data: cProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", commentAuthorIds);
      (cProfiles || []).forEach((p: Profile) => {
        setProfiles((prev) => ({ ...prev, [p.id]: p }));
      });
    }

    // Load likes
    const { data: likesData } = await supabase
      .from("post_likes")
      .select("*");
    const likeMap: Record<string, PostLike[]> = {};
    (likesData || []).forEach((l: PostLike) => {
      if (!likeMap[l.post_id]) likeMap[l.post_id] = [];
      likeMap[l.post_id].push(l);
    });
    setLikes(likeMap);

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const createPost = async () => {
    if (!userId || !newBody.trim()) return;
    setPosting(true);
    await supabase.from("posts").insert({
      author_id: userId,
      body: newBody.trim(),
      post_type: newType,
    });
    setNewBody("");
    setNewType("post");
    setPosting(false);
    loadData();
  };

  const deletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setMenuOpen(null);
    loadData();
  };

  const togglePin = async (postId: string, currentlyPinned: boolean) => {
    await supabase.from("posts").update({ is_pinned: !currentlyPinned }).eq("id", postId);
    setMenuOpen(null);
    loadData();
  };

  const toggleLike = async (postId: string) => {
    if (!userId) return;
    const postLikes = likes[postId] || [];
    const existing = postLikes.find((l) => l.user_id === userId);
    if (existing) {
      await supabase.from("post_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    }
    loadData();
  };

  const addComment = async (postId: string) => {
    if (!userId || !commentBody.trim()) return;
    await supabase.from("post_comments").insert({
      post_id: postId,
      author_id: userId,
      body: commentBody.trim(),
    });
    setCommentBody("");
    setCommentingOn(null);
    setShowComments((prev) => new Set(prev).add(postId));
    loadData();
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("post_comments").delete().eq("id", commentId);
    loadData();
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
      <div className="mx-auto max-w-2xl px-6 py-12 lg:px-8 lg:py-16">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition-all duration-300 hover:gap-3 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Community
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Feed</h1>
        </div>

        {/* Compose */}
        <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={3}
            placeholder="Share something with the club..."
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {(["post", "announcement", "question"] as const).map((type) => {
                const cfg = POST_TYPE_CONFIG[type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setNewType(type)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      newType === type ? "bg-accent/10 text-accent" : "bg-surface-light text-muted hover:text-foreground"
                    } ${type === "announcement" && !canManage ? "hidden" : ""}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={createPost}
              disabled={!newBody.trim() || posting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-background transition-all hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface py-16 text-center">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-border-light" />
              <p className="text-sm font-medium text-muted">No posts yet — be the first to share</p>
            </div>
          )}

          {posts.map((post) => {
            const author = profiles[post.author_id];
            const postLikes = likes[post.id] || [];
            const postComments = comments[post.id] || [];
            const hasLiked = postLikes.some((l) => l.user_id === userId);
            const isShowingComments = showComments.has(post.id);
            const cfg = POST_TYPE_CONFIG[post.post_type];
            const canDelete = post.author_id === userId || canManage;

            return (
              <div
                key={post.id}
                className={`rounded-2xl border bg-surface transition-all ${
                  post.post_type === "announcement" ? "border-yellow-500/20" :
                  post.post_type === "question" ? "border-blue-500/20" : "border-border"
                }`}
              >
                {/* Post header */}
                <div className="px-5 pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-light">
                        {author?.headshot_url ? (
                          <img src={author.headshot_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-4 w-4 text-border-light" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{author?.display_name || "Unknown"}</p>
                          {post.is_pinned && <Pin className="h-3 w-3 text-accent" />}
                          {post.post_type !== "post" && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted">{author?.role || "Member"} · {timeAgo(post.created_at)}</p>
                      </div>
                    </div>

                    {canDelete && (
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                          className="rounded-lg p-1.5 text-muted hover:bg-surface-light hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpen === post.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-surface py-1 shadow-xl">
                              {canManage && (
                                <button
                                  onClick={() => togglePin(post.id, post.is_pinned)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted hover:bg-surface-light hover:text-foreground"
                                >
                                  <Pin className="h-3.5 w-3.5" />
                                  {post.is_pinned ? "Unpin" : "Pin to top"}
                                </button>
                              )}
                              <button
                                onClick={() => deletePost(post.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post body */}
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.body}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 px-5 py-3">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-all ${
                      hasLiked ? "text-red-400" : "text-muted hover:text-red-400"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
                    {postLikes.length > 0 && postLikes.length}
                  </button>
                  <button
                    onClick={() => {
                      if (isShowingComments) {
                        setShowComments((prev) => { const n = new Set(prev); n.delete(post.id); return n; });
                      } else {
                        setShowComments((prev) => new Set(prev).add(post.id));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {postComments.length > 0 && postComments.length}
                  </button>
                </div>

                {/* Comments */}
                {isShowingComments && (
                  <div className="border-t border-border/50">
                    {postComments.map((c) => {
                      const cAuthor = profiles[c.author_id];
                      const canDeleteComment = c.author_id === userId || canManage;
                      return (
                        <div key={c.id} className="group flex gap-3 px-5 py-3">
                          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface-light">
                            {cAuthor?.headshot_url ? (
                              <img src={cAuthor.headshot_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <User className="h-3 w-3 text-border-light" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs">
                              <span className="font-semibold text-foreground">{cAuthor?.display_name || "Unknown"}</span>
                              <span className="ml-2 text-muted">{timeAgo(c.created_at)}</span>
                            </p>
                            <p className="mt-0.5 text-xs text-foreground">{c.body}</p>
                          </div>
                          {canDeleteComment && (
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Add comment */}
                    <div className="flex gap-2 px-5 py-3">
                      <input
                        value={commentingOn === post.id ? commentBody : ""}
                        onFocus={() => setCommentingOn(post.id)}
                        onChange={(e) => { setCommentingOn(post.id); setCommentBody(e.target.value); }}
                        onKeyDown={(e) => e.key === "Enter" && addComment(post.id)}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        disabled={commentingOn !== post.id || !commentBody.trim()}
                        className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-30"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
