import { useState, useEffect } from "react";
import { useBuildingFund, useUpdateBuildingFund } from "@/hooks/useBuildingFund";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Church, Save } from "lucide-react";

export function BuildingFundAdmin() {
  const { data: fund, isLoading } = useBuildingFund();
  const updateFund = useUpdateBuildingFund();
  const { toast } = useToast();

  const [currentAmount, setCurrentAmount] = useState("");
  const [goalAmount, setGoalAmount] = useState("");

  useEffect(() => {
    if (fund) {
      setCurrentAmount(String(fund.currentAmount));
      setGoalAmount(String(fund.goalAmount));
    }
  }, [fund]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!fund) return null;

  const percent = fund.goalAmount > 0 ? Math.round((fund.currentAmount / fund.goalAmount) * 100) : 0;

  const handleSave = async () => {
    const parsedCurrent = parseFloat(currentAmount);
    const parsedGoal = parseFloat(goalAmount);
    if (isNaN(parsedCurrent) || isNaN(parsedGoal) || parsedCurrent < 0 || parsedGoal <= 0) {
      toast({ title: "Invalid amounts", description: "Please enter valid numbers.", variant: "destructive" });
      return;
    }
    try {
      await updateFund.mutateAsync({ id: fund.id, currentAmount: parsedCurrent, goalAmount: parsedGoal });
      toast({ title: "Updated!", description: "Land fund progress has been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update land fund.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Church className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Land Fund</h2>
          <p className="text-xs text-muted-foreground">Currently at {percent}%</p>
        </div>
      </div>

      {/* Preview bar */}
      <div className="space-y-1">
        <div className="w-full h-3 rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(43,90%,55%)] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          R{fund.currentAmount.toLocaleString("en-ZA")} / R{fund.goalAmount.toLocaleString("en-ZA")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fundCurrent">Amount Raised (R)</Label>
          <Input
            id="fundCurrent"
            type="number"
            step="0.01"
            min="0"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fundGoal">Goal Amount (R)</Label>
          <Input
            id="fundGoal"
            type="number"
            step="0.01"
            min="1"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} disabled={updateFund.isPending} className="w-full gap-2">
          {updateFund.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
