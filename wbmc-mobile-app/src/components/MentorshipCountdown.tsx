import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Bird, Rocket, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const LAUNCH_DATE = new Date("2026-07-07T00:00:00").getTime();

function getRemaining() {
  const diff = Math.max(0, LAUNCH_DATE - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export const MentorshipCountdown = () => {
  const navigate = useNavigate();
  const [t, setT] = useState(getRemaining());

  useEffect(() => {
    const id = setInterval(() => setT(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const Box = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-primary/10 border border-primary/20 rounded-xl px-3 py-3 min-w-[68px]">
      <span className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Eagles Mentorship" onNavigateHome={() => navigate("/")} />
      <main className="max-w-md mx-auto p-6 text-center space-y-6 mt-8">
        <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Bird className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-3 py-1">
            <Rocket className="h-3.5 w-3.5" /> In Development
          </div>
          <h1 className="text-2xl font-bold">Eagles Mentorship Program</h1>
          <p className="text-sm text-muted-foreground">
            We're building something great. Launching <span className="font-semibold text-foreground">7 July 2026</span>.
          </p>
        </div>

        <div className="flex justify-center gap-2 sm:gap-3">
          <Box value={t.days} label="Days" />
          <Box value={t.hours} label="Hours" />
          <Box value={t.minutes} label="Mins" />
          <Box value={t.seconds} label="Secs" />
        </div>

        <p className="text-xs text-muted-foreground">
          Your registration is saved — we'll notify you when the program goes live.
        </p>

        <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back home
        </Button>
      </main>
    </div>
  );
};
