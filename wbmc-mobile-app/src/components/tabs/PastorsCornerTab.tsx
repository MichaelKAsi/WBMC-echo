import { useState } from "react";
import { usePastorPosts, useTogglePastorPostLike, usePastorPostComments, useAddPastorPostComment, PastorPost } from "@/hooks/usePastorPosts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookHeart, Calendar, Heart, MessageCircle, Share2, Send, X, ChevronLeft, ChevronRight, FileText, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function isDocumentUrl(url: string) {
  const lower = url.toLowerCase();
  return lower.includes(".pdf") || lower.includes(".doc") || lower.includes(".docx") || lower.includes(".ppt") || lower.includes(".pptx");
}

function getDocumentIcon(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "PDF";
  if (lower.includes(".doc") || lower.includes(".docx")) return "DOC";
  if (lower.includes(".ppt") || lower.includes(".pptx")) return "PPT";
  return "FILE";
}

function DocumentPreviewModal({ url, open, onClose }: { url: string; open: boolean; onClose: () => void }) {
  const isPdf = url.toLowerCase().includes(".pdf");
  const viewerUrl = isPdf ? url : `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full h-[80vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Preview
          </DialogTitle>
        </DialogHeader>
        <iframe src={viewerUrl} className="flex-1 w-full border-0" title="Document Preview" />
        <div className="p-3 border-t border-border flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">Download</a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MediaViewer({ post, open, onClose }: { post: PastorPost; open: boolean; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageUrls = post.mediaUrls.filter(u => !isDocumentUrl(u));
  const hasMultiple = imageUrls.length > 1;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-full max-h-full p-0 bg-black/95 border-none [&>button]:hidden">
        <div className="relative flex flex-col h-full">
          <button onClick={onClose} className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-background/20 flex items-center justify-center text-white">
            <X className="h-5 w-5" />
          </button>

          <div className="flex-1 flex items-center justify-center relative">
            {post.mediaType === "video" ? (
              <video src={imageUrls[0]} controls autoPlay className="max-w-full max-h-[70vh] object-contain" />
            ) : (
              <>
                {imageUrls[currentIndex] && (
                  <img src={imageUrls[currentIndex]} alt="" className="max-w-full max-h-[70vh] object-contain" />
                )}
                {hasMultiple && (
                  <>
                    <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="absolute left-2 h-10 w-10 rounded-full bg-background/20 flex items-center justify-center text-white disabled:opacity-30">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={() => setCurrentIndex((i) => Math.min(imageUrls.length - 1, i + 1))} disabled={currentIndex === imageUrls.length - 1} className="absolute right-2 h-10 w-10 rounded-full bg-background/20 flex items-center justify-center text-white disabled:opacity-30">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          <div className="p-4 bg-black/80 text-white max-h-[25vh] overflow-y-auto">
            <p className="text-sm font-semibold mb-1">{post.authorName}</p>
            <div className="text-sm leading-relaxed opacity-90 [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsSheet({ postId, open, onClose }: { postId: string; open: boolean; onClose: () => void }) {
  const { data: comments = [], isLoading } = usePastorPostComments(postId);
  const addComment = useAddPastorPostComment();
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    addComment.mutate({ postId, content: text.trim() });
    setText("");
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Comments</h3>
        </div>
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">{c.userName || "Member"}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-foreground">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-border flex gap-2">
          <Input placeholder="Write a comment..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} className="flex-1" />
          <Button size="icon" onClick={handleSend} disabled={!text.trim() || addComment.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PostCard({ post }: { post: PastorPost }) {
  const imageMediaUrls = post.mediaUrls.filter(u => !isDocumentUrl(u));
  const docUrls = post.mediaUrls.filter(isDocumentUrl);
  const hasImageMedia = imageMediaUrls.length > 0 && post.mediaType !== "text" && post.mediaType !== "document";
  const [mediaOpen, setMediaOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const toggleLike = useTogglePastorPostLike();
  const { toast } = useToast();

  const handleShare = async () => {
    const url = `${window.location.origin}/?pastorPost=${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Pastor's Corner", text: post.content.slice(0, 100), url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with others." });
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 pb-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BookHeart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{post.authorName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="text-sm text-foreground leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Document attachments */}
        {docUrls.length > 0 && (
          <div className="px-4 pb-3 flex gap-2 flex-wrap">
            {docUrls.map((url, i) => (
              <button key={i} onClick={() => setPreviewUrl(url)} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs hover:bg-muted transition-colors">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium">{getDocumentIcon(url)}</span>
                <Eye className="h-3 w-3 text-muted-foreground ml-1" />
              </button>
            ))}
          </div>
        )}

        {/* Image/video media */}
        {hasImageMedia && post.mediaType !== "video" && (
          <div className={`grid gap-1 cursor-pointer ${imageMediaUrls.length === 1 ? "" : "grid-cols-2"}`} onClick={() => setMediaOpen(true)}>
            {imageMediaUrls.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full object-cover max-h-80" />
            ))}
          </div>
        )}
        {hasImageMedia && post.mediaType === "video" && imageMediaUrls[0] && (
          <div className="px-4 pb-2 cursor-pointer" onClick={() => setMediaOpen(true)}>
            <video src={imageMediaUrls[0]} className="w-full rounded-lg max-h-80" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center border-t border-border px-2">
          <button onClick={() => toggleLike.mutate({ postId: post.id, isLiked: post.isLiked })} className="flex items-center gap-1.5 flex-1 justify-center py-2.5 text-sm hover:bg-muted/50 transition-colors">
            <Heart className={`h-4 w-4 ${post.isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            <span className={post.isLiked ? "text-red-500" : "text-muted-foreground"}>{post.likesCount || ""}</span>
          </button>
          <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-1.5 flex-1 justify-center py-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentsCount || ""}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 flex-1 justify-center py-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <MediaViewer post={post} open={mediaOpen} onClose={() => setMediaOpen(false)} />
      <CommentsSheet postId={post.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
      {previewUrl && <DocumentPreviewModal url={previewUrl} open={!!previewUrl} onClose={() => setPreviewUrl(null)} />}
    </>
  );
}

export function PastorsCornerTab() {
  const { data: posts = [], isLoading } = usePastorPosts();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] text-center px-6">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <BookHeart className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">No posts yet</h3>
        <p className="text-sm text-muted-foreground">The pastor hasn't posted yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
