import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HeartHandshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

const SESSION_FLAG_PREFIX = "mentorship_prompt_shown_";

interface Props {
  user: SupaUser | null;
}

export const MentorshipPromptModal = ({ user }: Props) => {
  const [open, setOpen] = useState(false);
  const [dismissals, setDismissals] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Once per session per user
    const flagKey = SESSION_FLAG_PREFIX + user.id;
    if (sessionStorage.getItem(flagKey)) return;

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("mentorship_role, mentorship_prompt_dismissals")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;

      const role = (data as any).mentorship_role;
      const count = (data as any).mentorship_prompt_dismissals ?? 0;
      setDismissals(count);

      if (role === "mentor" || role === "mentee") return;
      if (count >= 3) return;

      sessionStorage.setItem(flagKey, "1");
      setOpen(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const recordDismissal = async () => {
    if (!user) return;
    const next = dismissals + 1;
    setDismissals(next);
    await supabase
      .from("profiles")
      .update({ mentorship_prompt_dismissals: next } as any)
      .eq("user_id", user.id);
  };

  const handleClose = async (nextOpen: boolean) => {
    if (!nextOpen && open) {
      await recordDismissal();
    }
    setOpen(nextOpen);
  };

  const handleJoin = () => {
    setOpen(false);
    navigate("/settings?tab=mentorship");
  };

  const handleLater = async () => {
    await recordDismissal();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <HeartHandshake className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Join the WBMC Youth Mentorship Programme
          </DialogTitle>
          <DialogDescription className="text-center">
            Grow with a mentor or pour into the next generation as a mentee guide.
            Complete your mentorship profile to get matched.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleJoin} className="w-full">
            Join Mentorship Programme
          </Button>
          <Button onClick={handleLater} variant="ghost" className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
