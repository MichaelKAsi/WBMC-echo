import { useState } from "react";
import { VideoEntry, extractYoutubeId } from "@/types/video";
import { Announcement, useFeaturedAnnouncements } from "@/hooks/useAnnouncements";
import { useAuth, useVideoLikes, useUserLiked, useToggleLike, useVideoComments, useAddComment } from "@/hooks/useVideoInteractions";
import { Play, Heart, MessageCircle, Share2, Megaphone, Bell, Send, X, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

interface FeedTabProps {
  entries: VideoEntry[];
}

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 shadow-card">
      {item.image_url && (
        <img src={item.image_url} alt={item.title} className="w-full object-contain" />
      )}
      <div className="p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          {item.type === "reminder" ? <Bell className="h-5 w-5 text-primary" /> : <Megaphone className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {item.type === "reminder" ? "Reminder" : "Announcement"}
          </span>
          <h4 className="text-foreground font-medium mt-0.5">{item.title}</h4>
          <div
            className="text-sm text-muted-foreground mt-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </div>
      </div>
    </div>
  );
}

function VideoActions({ videoId, videoTitle }: { videoId: string; videoTitle: string }) {
  const user = useAuth();
  const { toast } = useToast();
  const { data: likeCount = 0 } = useVideoLikes(videoId);
  const { data: liked = false } = useUserLiked(videoId, user?.id);
  const toggleLike = useToggleLike(videoId);
  const { data: comments = [] } = useVideoComments(videoId);
  const addComment = useAddComment(videoId);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const requireAuth = (action: string) => {
    toast({ title: "Sign in required", description: `Please sign in to ${action}.`, variant: "destructive" });
  };

  const handleLike = () => {
    if (!user) return requireAuth("like videos");
    toggleLike.mutate({ userId: user.id, liked });
  };

  const handleComment = () => {
    if (!user) return requireAuth("comment");
    setShowComments(!showComments);
  };

  const handleShare = async () => {
    if (!user) return requireAuth("share videos");
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: videoTitle, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Video link copied to clipboard." });
    }
  };

  const submitComment = () => {
    if (!user || !commentText.trim()) return;
    addComment.mutate(
      { userId: user.id, content: commentText.trim(), userName: user.user_metadata?.full_name },
      { onSuccess: () => setCommentText("") }
    );
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Heart className={`h-5 w-5 ${liked ? "fill-primary text-primary" : ""}`} />
            {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
          </button>
          <button onClick={handleComment} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle className="h-5 w-5" />
            {comments.length > 0 && <span className="text-xs">{comments.length}</span>}
          </button>
          <button onClick={handleShare} className="text-muted-foreground hover:text-primary transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {user && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                className="text-sm"
              />
              <Button size="icon" variant="ghost" onClick={submitComment} disabled={!commentText.trim() || addComment.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <span className="font-medium text-foreground">{c.user_name || "Member"}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                  <p className="text-muted-foreground mt-0.5">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function FeedTab({ entries }: FeedTabProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { data: featuredAnnouncements = [] } = useFeaturedAnnouncements();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["videos"] }),
      queryClient.invalidateQueries({ queryKey: ["featured-announcements"] }),
    ]);
    setRefreshing(false);
  };

  // Interleave: insert announcements between videos based on sort_order
  const combined: ({ type: "video"; data: VideoEntry } | { type: "announcement"; data: Announcement })[] = [];

  const announcementsByPosition = new Map<number, Announcement[]>();
  featuredAnnouncements.forEach((a) => {
    const pos = a.sort_order;
    if (!announcementsByPosition.has(pos)) announcementsByPosition.set(pos, []);
    announcementsByPosition.get(pos)!.push(a);
  });

  entries.forEach((entry, i) => {
    const anns = announcementsByPosition.get(i);
    if (anns) anns.forEach((a) => combined.push({ type: "announcement", data: a }));
    combined.push({ type: "video", data: entry });
  });
  announcementsByPosition.forEach((anns, pos) => {
    if (pos >= entries.length) {
      anns.forEach((a) => combined.push({ type: "announcement", data: a }));
    }
  });

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="p-4 space-y-4 pb-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full gap-2 text-muted-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh feed"}
        </Button>
        {combined.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Play className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No videos yet</h3>
            <p className="text-sm text-muted-foreground">Check back soon for new content</p>
          </div>
        ) : (
          combined.map((item, idx) => {
            if (item.type === "announcement") {
              return <AnnouncementCard key={`ann-${item.data.id}`} item={item.data} />;
            }

            const entry = item.data;
            const videoId = extractYoutubeId(entry.youtubeUrl);
            const isPlaying = playingId === entry.id;

            return (
              <div key={entry.id} className="rounded-xl overflow-hidden bg-card border border-border shadow-card">
                {isPlaying && videoId ? (
                  <div className="relative aspect-video w-full bg-black overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={entry.title}
                    />
                  </div>
                ) : (
                  <button onClick={() => setPlayingId(entry.id)} className="relative aspect-video w-full bg-black overflow-hidden block">
                    <img
                      src={entry.thumbnailUrl}
                      alt={entry.title}
                      className="absolute inset-0 w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const vid = extractYoutubeId(entry.youtubeUrl);
                        if (vid && img.src.includes("maxresdefault")) {
                          img.src = `https://i.ytimg.com/vi/${vid}/sddefault.jpg`;
                        } else if (vid && img.src.includes("sddefault")) {
                          img.src = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
                        } else {
                          img.src = "/placeholder.svg";
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                      <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center shadow-elevated">
                        <Play className="h-6 w-6 text-primary-foreground ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </button>
                )}
                <div className="p-4">
                  <h4 className="text-foreground font-medium mb-3 line-clamp-2">{entry.title}</h4>
                  <VideoActions videoId={videoId || entry.id} videoTitle={entry.title} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
