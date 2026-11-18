import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Code2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeveloperApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  status: "none" | "pending" | "rejected" | "approved" | string;
  onSubmitted: () => void;
}

export function DeveloperApplicationModal({
  open,
  onOpenChange,
  userId,
  status,
  onSubmitted,
}: DeveloperApplicationModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [skills, setSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim() || !skills.trim()) {
      toast({ title: "Please fill out both fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        developer_status: "pending",
        developer_reason: reason.trim(),
        developer_skills: skills.trim(),
        developer_applied_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Application submitted",
      description: "An admin will review your request shortly.",
    });
    onSubmitted();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Apply to be a Developer</DialogTitle>
          <DialogDescription>
            The Developer area is reserved for people interested in helping us build Echo. Tell us a bit about yourself
            and we'll review your request.
          </DialogDescription>
        </DialogHeader>

        {status === "pending" ? (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-foreground text-sm">Application pending</p>
              <p className="text-xs text-muted-foreground">
                Your developer application is awaiting admin approval. You'll get access to the documentation once it's
                approved.
              </p>
            </div>
          </div>
        ) : status === "rejected" ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground text-sm">Previous application not approved</p>
                <p className="text-xs text-muted-foreground">
                  You can submit a new application below with more detail.
                </p>
              </div>
            </div>
            <ApplicationForm
              reason={reason}
              skills={skills}
              setReason={setReason}
              setSkills={setSkills}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </div>
        ) : (
          <ApplicationForm
            reason={reason}
            skills={skills}
            setReason={setReason}
            setSkills={setSkills}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApplicationForm({
  reason,
  skills,
  setReason,
  setSkills,
  submitting,
  onSubmit,
}: {
  reason: string;
  skills: string;
  setReason: (v: string) => void;
  setSkills: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dev-skills">Your skills</Label>
        <Input
          id="dev-skills"
          placeholder="e.g. React, TypeScript, design"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dev-reason">Why do you want to help build Echo?</Label>
        <Textarea
          id="dev-reason"
          placeholder="Tell us a little about how you'd like to contribute..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={1000}
        />
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
        Submit Application
      </Button>
    </div>
  );
}
