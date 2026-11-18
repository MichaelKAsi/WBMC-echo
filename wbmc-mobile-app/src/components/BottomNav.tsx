import { Radio, Image, BookOpen, Music, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabType = "feed" | "news" | "gallery" | "bible" | "difela";

const tabs = [
  { id: "bible" as TabType, label: "Bible", icon: BookOpen },
  { id: "difela" as TabType, label: "Difela", icon: Music },
  { id: "feed" as TabType, label: "Feed", icon: Radio },
  { id: "news" as TabType, label: "News", icon: Megaphone },
  { id: "gallery" as TabType, label: "Gallery", icon: Image },
];

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  badges?: Record<string, number>;
}

export function BottomNav({ activeTab, onTabChange, badges = {} }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-primary border-t border-primary safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = badges[tab.id] || 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative text-primary-foreground",
                isActive
                  ? "opacity-100"
                  : "opacity-80 hover:opacity-100"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-0.5 w-8 rounded-full bg-primary-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
