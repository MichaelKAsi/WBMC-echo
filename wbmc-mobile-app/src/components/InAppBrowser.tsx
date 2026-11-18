import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InAppBrowserProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export function InAppBrowser({ url, title = "View All Pictures", onClose }: InAppBrowserProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4">
        <h1 className="font-medium text-foreground truncate flex-1">{title}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(url, "_blank")}
            className="h-9 w-9"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Iframe */}
      <div className="flex-1">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={title}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
