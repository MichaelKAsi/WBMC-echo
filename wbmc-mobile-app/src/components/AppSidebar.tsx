import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Store, ChevronRight, X, BookHeart, BookOpen, Users, Code2, LifeBuoy, Settings as SettingsIcon, StickyNote, Bird } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { DeveloperDocsModal } from "@/components/DeveloperDocsModal";
import { DeveloperApplicationModal } from "@/components/DeveloperApplicationModal";
import { supabase } from "@/integrations/supabase/client";
import echoLogo from "@/assets/echo-logo-blue.png";

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToMarket?: () => void;
  onNavigateToPastorsCorner?: () => void;
  onNavigateToSermonLibrary?: () => void;
  onNavigateToMinistries?: () => void;
}

export function AppSidebar({ open, onOpenChange, onNavigateToMarket, onNavigateToPastorsCorner, onNavigateToSermonLibrary, onNavigateToMinistries }: AppSidebarProps) {
  const navigate = useNavigate();
  const { canAccessAdmin, canAccessPastorAdmin, isDeveloper, user } = useUserRole();
  const [devDocsOpen, setDevDocsOpen] = useState(false);
  const [devApplyOpen, setDevApplyOpen] = useState(false);
  const [developerStatus, setDeveloperStatus] = useState<string>("none");

  const refreshProfile = () => {
    if (!user) {
      setDeveloperStatus("none");
      return;
    }
    supabase
      .from("profiles")
      .select("developer_status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDeveloperStatus((data?.developer_status as string) ?? "none");
      });
  };

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const menuItems = [
    { label: "Ministries", icon: Users, action: "ministries" as const, path: undefined as string | undefined, show: true },
    { label: "Sermon Library", icon: BookOpen, action: "sermon" as const, path: undefined as string | undefined, show: true },
    { label: "Marketplace", icon: Store, action: "market" as const, path: undefined as string | undefined, show: true },
    { label: "Pastor's Corner", icon: BookHeart, action: "pastor" as const, path: undefined as string | undefined, show: true },
    { label: "My Notes", icon: StickyNote, action: undefined as string | undefined, path: "/notes", show: !!user },
    { label: "Eagles Mentorship", icon: Bird, action: undefined as string | undefined, path: "/mentorship", show: !!user },
    { label: "Pastor Admin", icon: BookHeart, action: undefined as string | undefined, path: "/pastor-admin", show: canAccessPastorAdmin },
    { label: "Admin", icon: Shield, action: undefined as string | undefined, path: "/login", show: canAccessAdmin },
    { label: "Developers", icon: Code2, action: "developers" as const, path: undefined as string | undefined, show: !!user },
    { label: "Helpdesk", icon: LifeBuoy, action: undefined as string | undefined, path: "/helpdesk", show: !!user },
    { label: "Settings", icon: SettingsIcon, action: undefined as string | undefined, path: "/settings", show: !!user },
  ].filter((item) => item.show);

  const handleItemClick = (item: typeof menuItems[number]) => {
    if (item.action === "developers") {
      if (isDeveloper) {
        setDevDocsOpen(true);
      } else {
        setDevApplyOpen(true);
      }
      onOpenChange(false);
      return;
    }
    if (item.action === "ministries") {
      if (onNavigateToMinistries) onNavigateToMinistries();
      else navigate("/?view=ministries");
    } else if (item.action === "sermon") {
      if (onNavigateToSermonLibrary) onNavigateToSermonLibrary();
      else navigate("/?view=sermon");
    } else if (item.action === "market") {
      if (onNavigateToMarket) onNavigateToMarket();
      else navigate("/?view=market");
    } else if (item.action === "pastor") {
      if (onNavigateToPastorsCorner) onNavigateToPastorsCorner();
      else navigate("/?view=pastor");
    } else if (item.path) {
      navigate(item.path);
    }
    onOpenChange(false);
  };

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <img src={echoLogo} alt="WBMC Logo" className="h-10 w-10 object-contain" />
                <div>
                  <p className="font-bold text-foreground text-sm">Echo</p>
                  <p className="text-[11px] text-muted-foreground">Word Based Missional Church</p>
                </div>
              </div>
              <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Menu
              </p>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="flex-1 font-medium text-sm text-foreground">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      <DeveloperDocsModal open={devDocsOpen} onOpenChange={setDevDocsOpen} />
      {user && (
        <DeveloperApplicationModal
          open={devApplyOpen}
          onOpenChange={setDevApplyOpen}
          userId={user.id}
          status={developerStatus}
          onSubmitted={refreshProfile}
        />
      )}
    </>
  );
}
