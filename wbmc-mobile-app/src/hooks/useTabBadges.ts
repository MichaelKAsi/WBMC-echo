import { useEffect, useState } from "react";
import { useVideos } from "@/hooks/useVideos";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useGallerySlides } from "@/hooks/useGallerySlides";
import type { TabType } from "@/components/BottomNav";

function getLastSeen(tab: string): string | null {
  return localStorage.getItem(`tab_last_seen_${tab}`);
}

function setLastSeen(tab: string) {
  localStorage.setItem(`tab_last_seen_${tab}`, new Date().toISOString());
}

export function useTabBadges(activeTab: TabType) {
  const { data: videos = [] } = useVideos();
  const { data: announcements = [] } = useAnnouncements();
  const { data: gallery = [] } = useGallerySlides();
  const [badges, setBadges] = useState<Record<string, number>>({});

  // Mark current tab as seen
  useEffect(() => {
    setLastSeen(activeTab);
    setBadges((prev) => ({ ...prev, [activeTab]: 0 }));
  }, [activeTab]);

  // Compute badge counts
  useEffect(() => {
    const feedSeen = getLastSeen("feed");
    const newsSeen = getLastSeen("news");
    const gallerySeen = getLastSeen("gallery");

    const feedCount = feedSeen
      ? videos.filter((v: any) => new Date(v.created_at) > new Date(feedSeen)).length
      : videos.length > 0 ? Math.min(videos.length, 99) : 0;

    const newsCount = newsSeen
      ? announcements.filter((a) => new Date(a.created_at) > new Date(newsSeen)).length
      : announcements.length > 0 ? Math.min(announcements.length, 99) : 0;

    const galleryCount = gallerySeen
      ? gallery.filter((g: any) => new Date(g.created_at) > new Date(gallerySeen)).length
      : gallery.length > 0 ? Math.min(gallery.length, 99) : 0;

    setBadges((prev) => ({
      ...prev,
      feed: prev.feed !== undefined && activeTab === "feed" ? 0 : feedCount,
      news: prev.news !== undefined && activeTab === "news" ? 0 : newsCount,
      gallery: prev.gallery !== undefined && activeTab === "gallery" ? 0 : galleryCount,
    }));
  }, [videos, announcements, gallery, activeTab]);

  return badges;
}
