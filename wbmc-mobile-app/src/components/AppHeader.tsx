import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, Menu, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import echoLogo from "@/assets/echo-logo-blue.png";
import type { User as SupaUser } from "@supabase/supabase-js";

interface AppHeaderProps {
  title?: string;
  onNavigateToMarket?: () => void;
  onNavigateToPastorsCorner?: () => void;
  onNavigateToSermonLibrary?: () => void;
  onNavigateToMinistries?: () => void;
  onNavigateHome?: () => void;
}

export function AppHeader({ title = "Echo", onNavigateToMarket, onNavigateToPastorsCorner, onNavigateToSermonLibrary, onNavigateToMinistries, onNavigateHome }: AppHeaderProps) {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<SupaUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      setDisplayName(null);
      return;
    }
    supabase
      .from("profiles")
      .select("avatar_url, full_name, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAvatarUrl(data?.avatar_url ?? null);
        setDisplayName(
          data?.full_name ||
            [data?.first_name, data?.last_name].filter(Boolean).join(" ") ||
            null,
        );
      });
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been signed out." });
  };

  const initials =
    (displayName?.split(" ").map((p) => p[0]).slice(0, 2).join("") ||
      user?.email?.[0] ||
      "?").toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            {user && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <button
              onClick={() => {
                if (onNavigateHome) {
                  onNavigateHome();
                } else {
                  navigate("/");
                }
              }}
              aria-label="Go to feed"
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
            >
              <img
                src={echoLogo}
                alt="Echo Logo"
                className="h-9 w-9 object-contain"
              />
            </button>
            <h1 className="font-bold text-lg text-foreground tracking-tight">
              {title}
            </h1>
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Account menu"
                >
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? "Profile"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground truncate">
                      {displayName || "Account"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => setAuthOpen(true)}
              className="gap-1.5"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          )}
        </div>
      </header>

      <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} onNavigateToMarket={onNavigateToMarket} onNavigateToPastorsCorner={onNavigateToPastorsCorner} onNavigateToSermonLibrary={onNavigateToSermonLibrary} onNavigateToMinistries={onNavigateToMinistries} />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
