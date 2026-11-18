import { useNavigate } from "react-router-dom";
import { Radio, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 shadow-card">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-1">
          <Home className="h-5 w-5" />
        </Button>
        <div className="h-10 w-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-elevated">
          <Radio className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-foreground tracking-tight">
            Echo Admin
          </h1>
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-muted-foreground">Live</span>
      </div>
    </header>
  );
}
