import { GallerySlide } from "@/types/gallery";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GalleryEntryListProps {
  entries: GallerySlide[];
  onDeleteEntry: (id: string) => void;
}

export function GalleryEntryList({ entries, onDeleteEntry }: GalleryEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No gallery slides yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3 pr-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            {/* Thumbnail Grid */}
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 grid grid-cols-2 gap-0.5">
              {entry.images.slice(0, 4).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ))}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground truncate">
                {entry.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {entry.images.length} image{entry.images.length !== 1 ? "s" : ""} •{" "}
                {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
              </p>
              {entry.googleDriveLink && (
                <a
                  href={entry.googleDriveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Drive Link
                </a>
              )}
            </div>

            {/* Actions */}
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDeleteEntry(entry.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
