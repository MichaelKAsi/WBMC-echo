import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAddPastorPost, usePastorPostsAdmin, useDeletePastorPost, useUpdatePastorPost, PastorPost } from "@/hooks/usePastorPosts";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Image as ImageIcon, Video, Loader2, Send, Trash2, X, CalendarIcon, Clock, FileText, Pencil, Eye } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function getDocumentIcon(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "PDF";
  if (lower.includes(".doc") || lower.includes(".docx")) return "DOC";
  if (lower.includes(".ppt") || lower.includes(".pptx")) return "PPT";
  return "FILE";
}

function isDocumentUrl(url: string) {
  const lower = url.toLowerCase();
  return lower.includes(".pdf") || lower.includes(".doc") || lower.includes(".docx") || lower.includes(".ppt") || lower.includes(".pptx");
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

function PostComposer({
  initialContent = "",
  initialMediaUrls = [],
  initialMediaType = "text",
  initialScheduledAt = null as string | null,
  editingId = null as string | null,
  onCancel,
}: {
  initialContent?: string;
  initialMediaUrls?: string[];
  initialMediaType?: string;
  initialScheduledAt?: string | null;
  editingId?: string | null;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(initialMediaUrls);
  const [uploading, setUploading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(initialScheduledAt ? new Date(initialScheduledAt) : undefined);
  const [scheduledTime, setScheduledTime] = useState(initialScheduledAt ? format(new Date(initialScheduledAt), "HH:mm") : "09:00");
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const { user } = useUserRole();
  const addPost = useAddPastorPost();
  const updatePost = useUpdatePastorPost();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...mediaFiles, ...files].slice(0, 4);
    setMediaFiles(newFiles);
    setMediaPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMediaUrls(existingMediaUrls.filter((_, i) => i !== index));
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleSubmit = async () => {
    const hasContent = stripHtml(content).trim().length > 0;
    if (!hasContent && mediaFiles.length === 0 && existingMediaUrls.length === 0) return;
    if (!user) return;
    setUploading(true);

    try {
      let mediaUrls: string[] = [...existingMediaUrls];
      let mediaType = "text";

      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from("pastor-media").upload(path, file);
          if (error) throw error;
          const { data: urlData } = supabase.storage.from("pastor-media").getPublicUrl(path);
          mediaUrls.push(urlData.publicUrl);
        }
      }

      // Determine media type
      if (mediaUrls.length > 0) {
        const hasDoc = mediaUrls.some(isDocumentUrl);
        const hasImg = mediaUrls.some(u => !isDocumentUrl(u) && !u.match(/\.(mp4|mov|avi|webm)$/i));
        const hasVid = mediaUrls.some(u => u.match(/\.(mp4|mov|avi|webm)$/i));
        if (hasDoc && !hasImg && !hasVid) mediaType = "document";
        else if (hasVid) mediaType = "video";
        else if (hasImg) mediaType = "image";
        else mediaType = "mixed";
      }

      let scheduledAt: string | null = null;
      if (scheduledDate) {
        const [hours, mins] = scheduledTime.split(":").map(Number);
        const dt = new Date(scheduledDate);
        dt.setHours(hours, mins, 0, 0);
        scheduledAt = dt.toISOString();
      }

      if (editingId) {
        await updatePost.mutateAsync({ id: editingId, content, mediaUrls, mediaType, scheduledAt });
        toast({ title: "Updated!", description: "Post has been updated." });
      } else {
        await addPost.mutateAsync({ content, mediaUrls, mediaType, userId: user.id, scheduledAt });
        toast({ title: scheduledAt ? "Scheduled!" : "Posted!", description: scheduledAt ? `Will be published ${format(new Date(scheduledAt), "PPP 'at' p")}` : "Your post has been shared." });
      }

      setContent("");
      setMediaFiles([]);
      setMediaPreviews([]);
      setExistingMediaUrls([]);
      setScheduledDate(undefined);
      setScheduledTime("09:00");
      onCancel?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to post.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {editingId && (
        <div className="flex items-center justify-between">
          <Badge variant="secondary"><Pencil className="h-3 w-3 mr-1" />Editing Post</Badge>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
      )}

      <RichTextEditor content={content} onChange={setContent} placeholder="What's on your heart today, Pastor?" />

      {/* Existing media */}
      {existingMediaUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {existingMediaUrls.map((url, i) => (
            <div key={i} className="relative">
              {isDocumentUrl(url) ? (
                <div className="w-full h-32 rounded-lg bg-muted flex flex-col items-center justify-center gap-1">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground">{getDocumentIcon(url)}</span>
                </div>
              ) : url.match(/\.(mp4|mov|avi|webm)$/i) ? (
                <video src={url} className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <img src={url} alt="" className="w-full h-32 object-cover rounded-lg" />
              )}
              <button onClick={() => removeExistingMedia(i)} className="absolute top-1 right-1 h-6 w-6 bg-background/80 rounded-full flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New media previews */}
      {mediaPreviews.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {mediaPreviews.map((url, i) => (
            <div key={i} className="relative">
              {mediaFiles[i]?.type.startsWith("video/") ? (
                <video src={url} className="w-full h-32 object-cover rounded-lg" />
              ) : mediaFiles[i]?.type.startsWith("application/") || mediaFiles[i]?.name.match(/\.(pdf|docx?|pptx?)$/i) ? (
                <div className="w-full h-32 rounded-lg bg-muted flex flex-col items-center justify-center gap-1">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[80%]">{mediaFiles[i].name}</span>
                </div>
              ) : (
                <img src={url} alt="" className="w-full h-32 object-cover rounded-lg" />
              )}
              <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 h-6 w-6 bg-background/80 rounded-full flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {scheduledDate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Clock className="h-4 w-4 text-primary" />
          <span>Scheduled: {format(scheduledDate, "PPP")} at {scheduledTime}</span>
          <button onClick={() => { setScheduledDate(undefined); setScheduledTime("09:00"); }} className="ml-auto"><X className="h-3 w-3" /></button>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex gap-1 flex-wrap">
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
          <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple className="hidden" onChange={handleFileSelect} />
          <Button variant="ghost" size="sm" onClick={() => { if (fileRef.current) { fileRef.current.accept = "image/*"; fileRef.current.click(); } }}>
            <ImageIcon className="h-4 w-4 mr-1" />Photo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { if (fileRef.current) { fileRef.current.accept = "video/*"; fileRef.current.multiple = false; fileRef.current.click(); } }}>
            <Video className="h-4 w-4 mr-1" />Video
          </Button>
          <Button variant="ghost" size="sm" onClick={() => docRef.current?.click()}>
            <FileText className="h-4 w-4 mr-1" />Doc
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <CalendarIcon className="h-4 w-4 mr-1" />Schedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className={cn("p-3 pointer-events-auto")}
              />
              <div className="px-3 pb-3">
                <label className="text-xs text-muted-foreground">Time</label>
                <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full mt-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={uploading || (stripHtml(content).trim().length === 0 && mediaFiles.length === 0 && existingMediaUrls.length === 0)}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
          {editingId ? "Update" : scheduledDate ? "Schedule" : "Post"}
        </Button>
      </div>
    </div>
  );
}

export function PastorAdminTab() {
  const [editingPost, setEditingPost] = useState<PastorPost | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const deletePost = useDeletePastorPost();
  const { data: posts = [] } = usePastorPostsAdmin();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    deletePost.mutate(id, {
      onSuccess: () => toast({ title: "Deleted", description: "Post removed." }),
      onError: (err: any) => toast({ title: "Delete failed", description: err.message || "Could not delete post.", variant: "destructive" }),
    });
  };

  const isScheduled = (post: PastorPost) => post.scheduledAt && new Date(post.scheduledAt) > new Date();

  return (
    <div className="p-4 space-y-6">
      {editingPost ? (
        <PostComposer
          key={editingPost.id}
          initialContent={editingPost.content}
          initialMediaUrls={editingPost.mediaUrls}
          initialMediaType={editingPost.mediaType}
          initialScheduledAt={editingPost.scheduledAt}
          editingId={editingPost.id}
          onCancel={() => setEditingPost(null)}
        />
      ) : (
        <PostComposer />
      )}

      {/* Existing posts */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Your Posts</h3>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm text-foreground line-clamp-3 [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: post.content }} />
                    {isScheduled(post) && (
                      <Badge variant="secondary" className="mt-1.5 text-[10px]">
                        <Clock className="h-3 w-3 mr-1" />
                        Scheduled: {format(new Date(post.scheduledAt!), "PPP 'at' p")}
                      </Badge>
                    )}
                    {/* Document attachments */}
                    {post.mediaUrls.filter(isDocumentUrl).length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {post.mediaUrls.filter(isDocumentUrl).map((url, i) => (
                          <button key={i} onClick={() => setPreviewUrl(url)} className="flex items-center gap-1 text-[10px] bg-muted rounded px-2 py-1 text-primary hover:bg-muted/80">
                            <FileText className="h-3 w-3" />
                            {getDocumentIcon(url)}
                            <Eye className="h-3 w-3 ml-1" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button onClick={() => setEditingPost(post)} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  {post.mediaUrls.length > 0 && ` · ${post.mediaUrls.length} media`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewUrl && (
        <DocumentPreviewModal url={previewUrl} open={!!previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </div>
  );
}
