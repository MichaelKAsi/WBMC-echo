import { useState } from "react";
import echoLogo from "@/assets/echo-logo-blue.png";
import { GallerySlide } from "@/types/gallery";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface GalleryTabProps {
  slides: GallerySlide[];
}

function ImageCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full bg-muted rounded-t-xl overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
      <img
        src={images[currentIndex]}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-contain object-center transition-opacity"
        onError={(e) => {
          (e.target as HTMLImageElement).src = echoLogo;
        }}
      />

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white"
            onClick={goPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white"
            onClick={goNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function GalleryTab({ slides }: GalleryTabProps) {
  const isMobile = useIsMobile();
  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center px-6">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Image className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">Gallery</h3>
        <p className="text-sm text-muted-foreground">
          Photos and images coming soon
        </p>
      </div>
    );
  }

  return (
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-4 pb-20">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="rounded-xl overflow-hidden bg-card border border-border shadow-card"
            >
              <ImageCarousel images={isMobile && slide.mobileImages.length > 0 ? slide.mobileImages : slide.images} />

              <div className="p-4">
                <h4 className="text-foreground font-medium mb-2">{slide.title}</h4>

                {slide.googleDriveLink && (
                  <a
                    href={slide.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View all pictures
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
  );
}
