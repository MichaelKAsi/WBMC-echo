import { useNavigate } from "react-router-dom";
import { Shield, Megaphone, Store, ChevronRight } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export function MoreTab() {
  const navigate = useNavigate();
  const { canAccessAdmin } = useUserRole();

  const menuItems = [
    { label: "Marketplace", icon: Store, path: "/marketplace", show: true },
    { label: "Admin", icon: Shield, path: "/login", show: canAccessAdmin },
    { label: "Announcements", icon: Megaphone, path: "/announcements", show: true },
  ].filter((item) => item.show);

  return (
    <div className="px-4 py-4 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        More Options
      </h3>
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:bg-accent transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 font-medium text-foreground">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}
