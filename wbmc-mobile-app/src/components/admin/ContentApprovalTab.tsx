import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Megaphone, ImageIcon, Radio, Clock, ShoppingBag } from "lucide-react";

interface PendingItem {
  id: string;
  type: "announcement" | "gallery" | "video" | "marketplace";
  title: string;
  submittedBy: string | null;
  submitterName: string | null;
  createdAt: string;
}

export function ContentApprovalTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingItems = [], isLoading } = useQuery({
    queryKey: ["pending_content"],
    queryFn: async (): Promise<PendingItem[]> => {
      const items: PendingItem[] = [];

      // Fetch pending announcements
      const { data: announcements } = await supabase
        .from("announcements")
        .select("id, title, submitted_by, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      for (const a of announcements ?? []) {
        items.push({
          id: a.id,
          type: "announcement",
          title: a.title,
          submittedBy: a.submitted_by,
          submitterName: null,
          createdAt: a.created_at,
        });
      }

      // Fetch pending gallery slides
      const { data: slides } = await supabase
        .from("gallery_slides")
        .select("id, title, submitted_by, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      for (const s of slides ?? []) {
        items.push({
          id: s.id,
          type: "gallery",
          title: s.title,
          submittedBy: s.submitted_by,
          submitterName: null,
          createdAt: s.created_at,
        });
      }

      // Fetch pending videos
      const { data: videos } = await supabase
        .from("videos")
        .select("id, title, submitted_by, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      for (const v of videos ?? []) {
        items.push({
          id: v.id,
          type: "video",
          title: v.title,
          submittedBy: v.submitted_by,
          submitterName: null,
          createdAt: v.created_at,
        });
      }

      // Fetch pending marketplace items
      const { data: marketplaceItems } = await supabase
        .from("marketplace_items")
        .select("id, title, user_id, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      for (const m of marketplaceItems ?? []) {
        items.push({
          id: m.id,
          type: "marketplace",
          title: m.title,
          submittedBy: m.user_id,
          submitterName: null,
          createdAt: m.created_at,
        });
      }

      // Resolve submitter names
      const submitterIds = [...new Set(items.map((i) => i.submittedBy).filter(Boolean))] as string[];
      if (submitterIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", submitterIds);

        const profileMap = new Map(
          (profiles ?? []).map((p: any) => [p.user_id, p.full_name || p.email || "Unknown"])
        );

        for (const item of items) {
          if (item.submittedBy) {
            item.submitterName = profileMap.get(item.submittedBy) ?? "Unknown";
          }
        }
      }

      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });

  const approveContentMutation = useMutation({
    mutationFn: async ({ id, type, approve }: { id: string; type: string; approve: boolean }) => {
      const status = approve ? "approved" : "rejected";
      const table = type === "announcement" ? "announcements" : type === "gallery" ? "gallery_slides" : type === "marketplace" ? "marketplace_items" : "videos";
      const { data, error } = await supabase.from(table).update({ status }).eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("You don't have permission to update this item.");
      if (approve && type === "gallery") {
        supabase.functions.invoke("notify-gallery-upload", { body: { slideId: id } }).then(({ error: nErr }) => {
          if (nErr) console.error("Gallery notification failed:", nErr);
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["pending_content"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["gallery_slides"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace_items"] });
      toast({ title: vars.approve ? "Content approved" : "Content rejected" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const typeIcons: Record<string, any> = {
    announcement: Megaphone,
    gallery: ImageIcon,
    video: Radio,
    marketplace: ShoppingBag,
  };

  const typeLabels: Record<string, string> = {
    announcement: "Announcement",
    gallery: "Gallery Slide",
    video: "Video",
    marketplace: "Marketplace",
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (pendingItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">All caught up</h3>
        <p className="text-sm text-muted-foreground">No pending content to review.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Pending Approval</h2>
        <Badge variant="secondary">{pendingItems.length} pending</Badge>
      </div>

      <div className="space-y-3">
        {pendingItems.map((item) => {
          const Icon = typeIcons[item.type];
          return (
            <div key={`${item.type}-${item.id}`} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{typeLabels[item.type]}</Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-medium text-foreground mt-1 line-clamp-2">{item.title}</p>
                  {item.submitterName && (
                    <p className="text-xs text-muted-foreground mt-0.5">by {item.submitterName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-12">
                <Button
                  size="sm"
                  onClick={() => approveContentMutation.mutate({ id: item.id, type: item.type, approve: true })}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => approveContentMutation.mutate({ id: item.id, type: item.type, approve: false })}
                  className="gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
