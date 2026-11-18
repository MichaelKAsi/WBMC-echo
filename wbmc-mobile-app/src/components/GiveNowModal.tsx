import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Church, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GiveNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied!`);
}

export function GiveNowModal({ open, onOpenChange }: GiveNowModalProps) {
  const details = [
    { label: "Bank", value: "FNB" },
    { label: "Account Type", value: "Cheque" },
    { label: "Account Number", value: "62794643504" },
    { label: "Branch Code", value: "250655" },
    { label: "Reference", value: "Your Name" },
  ];

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
              WBMC Land Account Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {details.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(value, label)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <blockquote className="border-l-4 border-primary/50 pl-4 py-2 bg-primary/5 rounded-r-lg">
            <p className="text-sm italic text-muted-foreground leading-relaxed">
              "Go up to the mountain, bring wood and build the temple, that I may be pleased with it and be glorified,"
              says the LORD.
            </p>
            <cite className="text-xs font-semibold text-primary mt-1 block not-italic">
              — Haggai 1:8
            </cite>
          </blockquote>
        </div>
      </DialogContent>
    </Dialog>
  );
}
