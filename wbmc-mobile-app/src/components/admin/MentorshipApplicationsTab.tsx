import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Eye, Link2, Link2Off } from "lucide-react";

type AppRow = {
  id: string;
  user_id: string | null;
  matched_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio: string | null;
  interests: string | null;
  role: string;
  starting_role: string | null;
  selected_both: boolean;
  status: string;
  sessions_per_month: number | null;
  max_mentees: number | null;
  age: number | null;
  education_level: string | null;
  avatar_url: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

type Filter = "all" | "pending" | "approved" | "rejected" | "unlinked";

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const roleBadge: Record<string, string> = {
  mentor: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  mentee: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  both: "bg-primary/10 text-primary",
};

export function MentorshipApplicationsTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<AppRow | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mentorship_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load applications", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as unknown as AppRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (row: AppRow, status: "approved" | "rejected") => {
    setActing(row.id);
    const { error } = await supabase
      .from("mentorship_applications")
      .update({ status } as never)
      .eq("id", row.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Application ${status}` });
      await load();
    }
    setActing(null);
  };

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "unlinked") return !r.matched_user_id;
    return r.status === filter;
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold text-foreground mr-auto">
          Mentorship Applications <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
        </h2>
        {(["all", "pending", "approved", "rejected", "unlinked"] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No applications match this filter.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const displayRole = r.selected_both ? "both" : r.role;
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground truncate">
                        {r.first_name} {r.last_name}
                      </p>
                      <Badge className={roleBadge[displayRole] ?? "bg-muted"}>{displayRole}</Badge>
                      <Badge className={statusBadge[r.status] ?? "bg-muted"}>{r.status}</Badge>
                      {r.matched_user_id ? (
                        <Badge variant="outline" className="gap-1"><Link2 className="h-3 w-3" /> Linked</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-destructive border-destructive/50">
                          <Link2Off className="h-3 w-3" /> No account
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">{r.email} · {r.phone}</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                    <Eye className="h-4 w-4 mr-1" /> View details
                  </Button>
                  {r.status !== "approved" && (
                    <Button size="sm" onClick={() => setStatus(r, "approved")} disabled={acting === r.id}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="destructive" onClick={() => setStatus(r, "rejected")} disabled={acting === r.id}>
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selected?.first_name} {selected?.last_name}
            </DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>
          {selected && (
            <ScrollArea className="max-h-[60vh] pr-3">
              <div className="space-y-3 text-sm">
                <Field label="Phone" value={selected.phone} />
                <Field label="Role" value={selected.selected_both ? `both (starting as ${selected.starting_role ?? "-"})` : selected.role} />
                <Field label="Status" value={selected.status} />
                <Field label="Age" value={selected.age?.toString() ?? "-"} />
                <Field label="Education" value={selected.education_level ?? "-"} />
                <Field label="Sessions / month" value={selected.sessions_per_month?.toString() ?? "-"} />
                <Field label="Max mentees" value={selected.max_mentees?.toString() ?? "-"} />
                <Field label="Bio" value={selected.bio ?? "-"} />
                <Field label="Interests" value={selected.interests ?? "-"} />
                <Field label="Linked account" value={selected.matched_user_id ?? "not linked"} />
                {selected.details && Object.keys(selected.details).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Additional details</p>
                    <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">
                      {JSON.stringify(selected.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="text-foreground whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}
