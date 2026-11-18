import { VideoEntry } from "@/types/video";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Play, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VideoEntryListProps {
  entries: VideoEntry[];
  onDeleteEntry: (id: string) => void;
}

export function VideoEntryList({ entries, onDeleteEntry }: VideoEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">No videos yet</h3>
        <p className="text-sm text-muted-foreground">
          Add your first video to get started
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-3 pr-4">
        {entries.map((entry) => (
          <Card
            key={entry.id}
            className="border-0 shadow-card hover:shadow-elevated transition-shadow group"
          >
            <CardContent className="p-3">
              <div className="flex gap-3">
                <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    src={entry.thumbnailUrl}
                    alt={entry.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-white" fill="white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate mb-1">
                    {entry.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => window.open(entry.youtubeUrl, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
