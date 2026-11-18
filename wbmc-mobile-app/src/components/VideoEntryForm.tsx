import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Link, Image, Sparkles } from "lucide-react";
import { VideoEntry, extractYoutubeId, getYoutubeThumbnail } from "@/types/video";

interface VideoEntryFormProps {
  onAddEntry: (entry: Omit<VideoEntry, "id" | "createdAt">) => void;
}

export function VideoEntryForm({ onAddEntry }: VideoEntryFormProps) {
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [autoThumbnail, setAutoThumbnail] = useState(true);

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    if (autoThumbnail) {
      const videoId = extractYoutubeId(url);
      if (videoId) {
        setThumbnailUrl(getYoutubeThumbnail(videoId));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim()) return;

    onAddEntry({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || "/placeholder.svg",
    });

    setTitle("");
    setYoutubeUrl("");
    setThumbnailUrl("");
  };

  const videoId = extractYoutubeId(youtubeUrl);

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </div>
          Add New Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Video Title
            </Label>
            <Input
              id="title"
              placeholder="Enter video title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube" className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              YouTube URL
            </Label>
            <Input
              id="youtube"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => handleYoutubeUrlChange(e.target.value)}
              className="h-11"
            />
            {videoId && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Video ID detected: {videoId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="text-sm font-medium flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              Custom Thumbnail URL
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="thumbnail"
              placeholder="Auto-generated from YouTube..."
              value={thumbnailUrl}
              onChange={(e) => {
                setThumbnailUrl(e.target.value);
                setAutoThumbnail(false);
              }}
              className="h-11"
            />
          </div>

          {thumbnailUrl && (
            <div className="rounded-lg overflow-hidden border bg-muted/50">
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                className="w-full h-32 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-brand-gradient hover:opacity-90 transition-opacity"
            disabled={!title.trim() || !youtubeUrl.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Feed
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
