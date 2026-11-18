import { useState, useEffect } from "react";
import { X, Megaphone, Bell } from "lucide-react";
import { useFeaturedAnnouncements } from "@/hooks/useAnnouncements";

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: announcements = [] } = useFeaturedAnnouncements();

  useEffect(() => {
    if (announcements.length > 0) {
      const dismissed = sessionStorage.getItem("welcome_banner_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setVisible(true), 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [announcements]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (!visible || announcements.length === 0) return null;

  const item = announcements[currentIndex];

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("welcome_banner_dismissed", "true");
  };

  return (
    <div className="animate-fade-in mx-4 mt-3 mb-1">
      <div className="relative rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-3 shadow-card">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            {item.type === "reminder" ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <Megaphone className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              {item.type === "reminder" ? "Reminder" : "Announcement"}
              {announcements.length > 1 && (
                <span className="ml-1 text-muted-foreground">
                  · {currentIndex + 1}/{announcements.length}
                </span>
              )}
            </p>
            <h4 className="text-sm font-medium text-foreground mt-0.5 line-clamp-1">{item.title}</h4>
            <div
              className="text-xs text-muted-foreground mt-0.5 line-clamp-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
