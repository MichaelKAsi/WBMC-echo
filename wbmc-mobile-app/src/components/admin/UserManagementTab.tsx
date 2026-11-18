import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, XCircle, User, Store, Shield, Crown, Image,
  Trash2, Loader2, UserPlus, Code2, HeartHandshake, GraduationCap, Church, ChevronDown,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AppRole =
  | "general_user"
  | "approved_merchant"
  | "manager"
  | "admin"
  | "pastor"
  | "developer"
  | "mentor"
  | "mentee"
  | "church_member";

interface ProfileWithRole {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: AppRole;
  wantsMerchant: boolean;
  merchantStatus: string;
  merchantPaymentProofUrl: string | null;
  developerStatus: string;
  developerReason: string | null;
  developerSkills: string | null;
  wantsMentorship: boolean;
  mentorshipRole: string | null;
  isWbmcMember: boolean;
  allRoles: AppRole[];
  createdAt: string;

}

const roleLabels: Record<AppRole, string> = {
  general_user: "General User",
  approved_merchant: "Merchant",
  manager: "Manager",
  admin: "Admin",
  pastor: "Pastor",
  developer: "Developer",
  mentor: "Mentor",
  mentee: "Mentee",
  church_member: "Church Member",
};

const roleIcons: Record<AppRole, React.ElementType> = {
  general_user: User,
  approved_merchant: Store,
  manager: Shield,
  admin: Crown,
  pastor: User,
  developer: Code2,
  mentor: HeartHandshake,
  mentee: GraduationCap,
  church_member: Church,
};

const roleBadgeVariants: Record<AppRole, string> = {
  general_user: "bg-muted text-muted-foreground",
  approved_merchant: "bg-green-500/10 text-green-700 dark:text-green-400",
  manager: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  admin: "bg-primary/10 text-primary",
  pastor: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  developer: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  mentor: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  mentee: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  church_member: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

export function UserManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (key: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Add user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("general_user");
  const [addingUser, setAddingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async (): Promise<ProfileWithRole[]> => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("*");
      if (rErr) throw rErr;

      const rolesByUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r: any) => {
        const list = rolesByUser.get(r.user_id) ?? [];
        list.push(r.role);
        rolesByUser.set(r.user_id, list);
      });

      const pickPrimary = (list: AppRole[]): AppRole => {
        const priority: AppRole[] = ["admin","pastor","manager","developer","mentor","mentee","approved_merchant","church_member","general_user"];
        for (const p of priority) if (list.includes(p)) return p;
        return "general_user";
      };

      return (profiles ?? []).map((p: any) => {
        const userRoles = rolesByUser.get(p.user_id) ?? [];
        return {
          userId: p.user_id,
          fullName: p.full_name,
          email: p.email,
          role: pickPrimary(userRoles),
          wantsMerchant: p.wants_merchant,
          merchantStatus: p.merchant_status,
          merchantPaymentProofUrl: p.merchant_payment_proof_url,
          developerStatus: p.developer_status ?? "none",
          developerReason: p.developer_reason ?? null,
          developerSkills: p.developer_skills ?? null,
          wantsMentorship: !!p.wants_mentorship,
          mentorshipRole: p.mentorship_role ?? null,
          isWbmcMember: !!p.is_wbmc_member || userRoles.includes("church_member"),
          allRoles: userRoles,
          createdAt: p.created_at,
        };

      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast({ title: "Role updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const approveMerchantMutation = useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ merchant_status: approve ? "approved" : "rejected" })
        .eq("user_id", userId);
      if (pErr) throw pErr;

      if (approve) {
        const { error: rErr } = await supabase
          .from("user_roles")
          .update({ role: "approved_merchant" })
          .eq("user_id", userId);
        if (rErr) throw rErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast({ title: "Merchant request processed" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const handleAddUser = async () => {
    if (!newEmail || !newPassword) return;
    setAddingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "create_user",
          email: newEmail,
          password: newPassword,
          full_name: newFullName,
          role: newRole,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "User created", description: `${newEmail} has been added.` });
      setAddUserOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("general_user");
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setDeletingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete_user", user_id: deleteUserId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "User deleted", description: `${deleteUserName} has been removed.` });
      setDeleteUserId(null);
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeletingUser(false);
    }
  };

  const approveDeveloperMutation = useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ developer_status: approve ? "approved" : "rejected" })
        .eq("user_id", userId);
      if (pErr) throw pErr;
      if (approve) {
        const { error: rErr } = await supabase
          .from("user_roles")
          .update({ role: "developer" })
          .eq("user_id", userId);
        if (rErr) throw rErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast({ title: "Developer request processed" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const pendingMerchants = users.filter((u) => u.wantsMerchant && u.merchantStatus === "pending");
  const pendingDevelopers = users.filter((u) => u.developerStatus === "pending");

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Add User Button */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">User Management</h2>
        <Button size="sm" onClick={() => setAddUserOpen(true)} className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Pending Merchant Requests */}
      {pendingMerchants.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            Merchant Requests
            <Badge variant="secondary" className="ml-1">{pendingMerchants.length}</Badge>
          </h3>
          {pendingMerchants.map((u) => (
            <div key={u.userId} className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{u.fullName || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>
              </div>
              <div className="flex items-center gap-2">
                {u.merchantPaymentProofUrl && (
                  <Button variant="outline" size="sm" onClick={() => setProofUrl(u.merchantPaymentProofUrl)} className="gap-1">
                    <Image className="h-3.5 w-3.5" />
                    View Proof
                  </Button>
                )}
                <Button size="sm" onClick={() => approveMerchantMutation.mutate({ userId: u.userId, approve: true })} className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => approveMerchantMutation.mutate({ userId: u.userId, approve: false })} className="gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Developer Applications */}
      {pendingDevelopers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            Developer Applications
            <Badge variant="secondary" className="ml-1">{pendingDevelopers.length}</Badge>
          </h3>
          {pendingDevelopers.map((u) => (
            <div key={u.userId} className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{u.fullName || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>
              </div>
              {u.developerSkills && (
                <p className="text-xs text-foreground"><span className="font-semibold">Skills:</span> {u.developerSkills}</p>
              )}
              {u.developerReason && (
                <p className="text-xs text-muted-foreground italic">"{u.developerReason}"</p>
              )}
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => approveDeveloperMutation.mutate({ userId: u.userId, approve: true })} className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => approveDeveloperMutation.mutate({ userId: u.userId, approve: false })} className="gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Users grouped by role */}
      <div className="space-y-6">
        <h3 className="font-medium text-foreground">
          All Users <span className="text-sm font-normal text-muted-foreground">({users.length})</span>
        </h3>
        {(
          [
            "admin",
            "pastor",
            "manager",
            "developer",
            "mentor",
            "mentee",
            "approved_merchant",
            "church_member",
            "general_user",
          ] as AppRole[]
        ).map((groupRole) => {
          let groupUsers = users.filter((u) => u.role === groupRole);
          // For Mentor/Mentee groups, include anyone whose roles contain
          // that role (from mentorship_applications sync), regardless of primary.
          if (groupRole === "mentor") {
            const extra = users.filter(
              (u) => u.allRoles.includes("mentor") && u.role !== "mentor",
            );
            groupUsers = [...groupUsers, ...extra];
          } else if (groupRole === "mentee") {
            const extra = users.filter(
              (u) => u.allRoles.includes("mentee") && u.role !== "mentee",
            );
            groupUsers = [...groupUsers, ...extra];
          } else if (groupRole === "approved_merchant") {

            // Also include users who opted to sell on marketplace
            // (pending/rejected) so admins can review them in one place.
            const optedIn = users.filter(
              (u) => u.wantsMerchant && u.role !== "approved_merchant",
            );
            groupUsers = [...groupUsers, ...optedIn];
          } else if (groupRole === "church_member") {
            // Include everyone flagged as a WBMC member, regardless of primary role.
            const members = users.filter(
              (u) => u.isWbmcMember && u.role !== "church_member",
            );
            groupUsers = [...groupUsers, ...members];
          }
          if (groupUsers.length === 0) return null;
          const GroupIcon = roleIcons[groupRole];
          const isCollapsed = collapsedGroups[groupRole];
          return (
            <div key={groupRole} className="space-y-3">
              <button
                onClick={() => toggleGroup(groupRole)}
                className="w-full flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-1 z-10 hover:bg-accent/50 rounded-md px-1 transition-colors"
              >
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                />
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <GroupIcon className="h-3.5 w-3.5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">{roleLabels[groupRole]}s</h4>
                <Badge variant="secondary" className="ml-1">{groupUsers.length}</Badge>
              </button>
              {!isCollapsed && groupUsers.map((u) => {
                const RoleIcon = roleIcons[u.role];
                const merchantBadge =
                  u.wantsMerchant && u.merchantStatus === "approved"
                    ? { label: "Merchant: Approved", cls: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" }
                    : u.wantsMerchant && u.merchantStatus === "rejected"
                    ? { label: "Merchant: Rejected", cls: "bg-destructive/10 text-destructive border-destructive/20" }
                    : u.wantsMerchant && u.merchantStatus === "pending"
                    ? { label: "Merchant: Pending", cls: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" }
                    : null;
                return (
                  <div key={u.userId} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{u.fullName || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Badge className={`${roleBadgeVariants[u.role]} gap-1 shrink-0`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[u.role]}
                      </Badge>
                    </div>
                    {merchantBadge && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${merchantBadge.cls} gap-1 text-[10px]`}>
                          <Store className="h-3 w-3" />
                          {merchantBadge.label}
                        </Badge>
                        {u.merchantStatus === "pending" && (
                          <>
                            {u.merchantPaymentProofUrl && (
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setProofUrl(u.merchantPaymentProofUrl)}>
                                <Image className="h-3 w-3" />
                                Proof
                              </Button>
                            )}
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => approveMerchantMutation.mutate({ userId: u.userId, approve: true })}>
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => approveMerchantMutation.mutate({ userId: u.userId, approve: false })}>
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          </>
                        )}
                        {u.merchantStatus === "rejected" && (
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => approveMerchantMutation.mutate({ userId: u.userId, approve: true })}>
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </Button>
                        )}
                        {u.merchantStatus === "approved" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => approveMerchantMutation.mutate({ userId: u.userId, approve: false })}>
                            <XCircle className="h-3 w-3" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Role:</span>
                      <Select
                        value={u.role}
                        onValueChange={(v) => updateRoleMutation.mutate({ userId: u.userId, newRole: v as AppRole })}
                      >
                        <SelectTrigger className="h-8 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general_user">General User</SelectItem>
                          <SelectItem value="church_member">Church Member</SelectItem>
                          <SelectItem value="approved_merchant">Merchant</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="pastor">Pastor</SelectItem>
                          <SelectItem value="mentor">Mentor</SelectItem>
                          <SelectItem value="mentee">Mentee</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                        onClick={() => {
                          setDeleteUserId(u.userId);
                          setDeleteUserName(u.fullName || u.email || "this user");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with a specific role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="Full name" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_user">General User</SelectItem>
                  <SelectItem value="church_member">Church Member</SelectItem>
                  <SelectItem value="approved_merchant">Merchant</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="mentee">Mentee</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddUser} disabled={addingUser || !newEmail || !newPassword}>
              {addingUser && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(o) => { if (!o) setDeleteUserId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteUserName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deletingUser}>
              {deletingUser && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Proof Dialog */}
      <Dialog open={!!proofUrl} onOpenChange={(o) => { if (!o) setProofUrl(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {proofUrl && <img src={proofUrl} alt="Payment proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
