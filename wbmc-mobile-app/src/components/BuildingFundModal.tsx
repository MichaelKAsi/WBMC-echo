import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Church, Loader2 } from "lucide-react";
import { useBuildingFund } from "@/hooks/useBuildingFund";
import { GiveNowModal } from "@/components/GiveNowModal";

function formatRand(n: number) {
  return `R${n.toLocaleString("en-ZA")}`;
}

function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, active]);

  return value;
}

interface BuildingFundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuildingFundModal({ open, onOpenChange }: BuildingFundModalProps) {
  const { data: fund, isLoading, refetch } = useBuildingFund();
  const [animateBar, setAnimateBar] = useState(false);
  const [giveNowOpen, setGiveNowOpen] = useState(false);

  // Refetch fresh data every time the modal opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const goal = fund?.goalAmount ?? 1000000;
  const raised = fund?.currentAmount ?? 0;
  const percent = goal > 0 ? Math.round((raised / goal) * 100) : 0;

  const countedAmount = useCountUp(raised, 1500, open && !isLoading);
  const countedPercent = useCountUp(percent, 1500, open && !isLoading);

  useEffect(() => {
    if (open && !isLoading) {
      const t = setTimeout(() => setAnimateBar(true), 100);
      return () => clearTimeout(t);
    } else {
      setAnimateBar(false);
    }
  }, [open, isLoading]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-auto rounded-2xl p-0 overflow-hidden border-none shadow-xl bg-card">
        <div className="h-1.5 w-full bg-gradient-to-r from-[hsl(43,90%,55%)] to-[hsl(30,85%,50%)]" />

        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-1 items-center text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <Church className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Church Land Fund Progress
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Help us secure land for the Lord's house
            </p>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="text-center">
                <span className="text-4xl font-bold text-foreground tabular-nums">
                  {countedPercent}%
                </span>
                <span className="text-sm text-muted-foreground ml-1.5">Funded</span>
              </div>

              <div className="relative w-full h-5 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-[hsl(43,90%,55%)] transition-all duration-[1500ms] ease-out"
                  style={{ width: animateBar ? `${percent}%` : "0%" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-foreground drop-shadow-sm">
                    {countedPercent}% Funded
                  </span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">
                  {formatRand(countedAmount)}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-foreground">
                  {formatRand(goal)}
                </span>
                {" "}raised
              </p>
            </>
          )}

          <Button
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(43,90%,55%)] hover:opacity-90 text-primary-foreground"
            onClick={() => setGiveNowOpen(true)}
          >
            Give Now
          </Button>
        </div>
      </DialogContent>

      <GiveNowModal open={giveNowOpen} onOpenChange={setGiveNowOpen} />
    </Dialog>
  );
}
