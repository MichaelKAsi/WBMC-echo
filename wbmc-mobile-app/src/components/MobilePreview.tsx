import { useState } from "react";
import { VideoEntry } from "@/types/video";
import { GallerySlide } from "@/types/gallery";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Heart, MessageCircle, Share2, Bookmark, Wifi, Battery, Signal,
  Radio, Image, BookOpen, Store, MoreHorizontal, ChevronLeft, ChevronRight, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import echoLogo from "@/assets/echo-logo-blue.png";

type PreviewTab = "feed" | "gallery" | "bible" | "market" | "more";

interface MobilePreviewProps {
  entries: VideoEntry[];
  gallerySlides?: GallerySlide[];
}

function MiniCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  
  return (
    <div className="relative aspect-[4/3] bg-black/30">
      <img
        src={images[idx]}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
      />
      {images.length > 1 && (
        <>
          <button
            className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white/30 flex items-center justify-center"
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
          >
            <ChevronLeft className="h-3 w-3 text-white" />
          </button>
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white/30 flex items-center justify-center"
            onClick={() => setIdx((i) => (i + 1) % images.length)}
          >
            <ChevronRight className="h-3 w-3 text-white" />
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div key={i} className={cn("h-1 rounded-full", i === idx ? "w-2 bg-white" : "w-1 bg-white/50")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function MobilePreview({ entries, gallerySlides = [] }: MobilePreviewProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("feed");
  
  const tabs = [
    { id: "feed" as PreviewTab, label: "Media", icon: Radio },
    { id: "gallery" as PreviewTab, label: "Gallery", icon: Image },
    { id: "bible" as PreviewTab, label: "Bible", icon: BookOpen },
    { id: "market" as PreviewTab, label: "Market", icon: Store },
    { id: "more" as PreviewTab, label: "More", icon: MoreHorizontal },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "feed":
        return entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <Play className="h-5 w-5 text-white/50" />
            </div>
            <p className="text-xs text-white/50">No content yet</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-xl overflow-hidden bg-white/5">
              <div className="relative aspect-video bg-black/30">
                <img
                  src={entry.thumbnailUrl}
                  alt={entry.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-5 w-5 text-white" fill="white" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-white text-xs font-medium mb-2 line-clamp-2">{entry.title}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-white/60" />
                    <MessageCircle className="h-4 w-4 text-white/60" />
                    <Share2 className="h-4 w-4 text-white/60" />
                  </div>
                  <Bookmark className="h-4 w-4 text-white/60" />
                </div>
              </div>
            </div>
          ))
        );

      case "gallery":
        return gallerySlides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <Image className="h-5 w-5 text-white/50" />
            </div>
            <p className="text-xs text-white/50">No gallery slides yet</p>
          </div>
        ) : (
          gallerySlides.map((slide) => (
            <div key={slide.id} className="rounded-xl overflow-hidden bg-white/5">
              <MiniCarousel images={slide.mobileImages.length > 0 ? slide.mobileImages : slide.images} />
              <div className="p-3">
                <h4 className="text-white text-xs font-medium mb-1">{slide.title}</h4>
                {slide.googleDriveLink && (
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <ExternalLink className="h-2.5 w-2.5" />
                    View all pictures
                  </span>
                )}
              </div>
            </div>
          ))
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-xs text-white/50">Coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Mobile App Preview</h3>

      {/* Phone Frame */}
      <div className="relative">
        <div className="w-[280px] h-[580px] bg-phone-bezel rounded-[3rem] p-2 shadow-elevated">
          <div className="w-full h-full bg-phone-screen rounded-[2.5rem] overflow-hidden relative flex flex-col">
            {/* Status Bar */}
            <div className="h-7 px-6 flex items-center justify-between text-white/80 text-[10px] bg-black/20">
              <span className="font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <Battery className="h-3 w-3" />
              </div>
            </div>

            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />

            {/* App Header */}
            <div className="h-12 px-4 flex items-center gap-2 border-b border-white/10">
              <img src={echoLogo} alt="WBMC" className="h-7 w-7 object-contain" />
              <h1 className="text-white font-bold text-sm">Echo</h1>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">{renderContent()}</div>
            </ScrollArea>

            {/* Bottom Nav */}
            <div className="h-14 border-t border-white/10 flex items-center justify-around bg-black/30">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex flex-col items-center gap-0.5",
                      isActive ? "text-primary" : "text-white/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[9px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
