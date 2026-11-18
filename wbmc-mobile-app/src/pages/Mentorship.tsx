import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AppHeader } from "@/components/AppHeader";
import { EaglesMentorshipModal } from "@/components/EaglesMentorshipModal";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Users, Inbox, Check, X, Mail, Phone, ArrowLeft, Bird, Eye } from "lucide-react";


type MentorDetailsJson = {
  profession?: string; company?: string; years_experience?: string; bio?: string;
  interest_church?: string; interest_work?: string; interest_community?: string;
  strengths?: string[]; capacity_per_week?: string; time_per_session?: string; methods?: string[];
};

type MentorCard = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio: string | null;
  interests: string | null;
  avatar_url: string | null;
  sessions_per_month: number | null;
  max_mentees: number | null;
  age: number | null;
  education_level: string | null;
  details: MentorDetailsJson | null;
};

type RequestRow = {
  id: string;
  status: string;
  created_at: string;
  message: string | null;
  mentee_user_id: string;
  mentor_application_id: string;
  mentee?: { full_name: string | null; email: string | null; phone_number: string | null; avatar_url: string | null } | null;
};

const Mentorship = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMentee, setIsMentee] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [mentors, setMentors] = useState<MentorCard[]>([]);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [tab, setTab] = useState<string>("browse");
  const [selectedMentor, setSelectedMentor] = useState<MentorCard | null>(null);
  const { isAdmin, isManager } = useUserRole();
  void isAdmin; void isManager;

  const loadMentors = useCallback(async () => {
    const { data, error } = await supabase
      .from("mentorship_applications")
      .select("id, user_id, first_name, last_name, email, phone, bio, interests, avatar_url, sessions_per_month, max_mentees, age, education_level, details, role, starting_role, selected_both, status")
      .in("status", ["approved", "pending"])
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load mentors", description: error.message, variant: "destructive" });
      return;
    }
    const list = (data ?? []).filter(
      (a: { role: string; starting_role: string | null; selected_both: boolean | null; first_name: string }) =>
        (a.first_name?.trim()?.length ?? 0) > 0 &&
        (a.role === "mentor" || (a.selected_both && a.starting_role === "mentor")),
    ) as MentorCard[];
    setMentors(list);
  }, [toast]);

  const loadRequests = useCallback(async (uid: string) => {
    setRequestsLoading(true);
    const { data, error } = await supabase
      .from("mentorship_connections")
      .select("id, status, created_at, message, mentee_user_id, mentor_application_id")
      .eq("mentor_user_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      setRequestsLoading(false);
      toast({ title: "Couldn't load requests", description: error.message, variant: "destructive" });
      return;
    }
    const rows = (data ?? []) as RequestRow[];
    const menteeIds = Array.from(new Set(rows.map((r) => r.mentee_user_id)));
    let profiles: Record<string, RequestRow["mentee"]> = {};
    if (menteeIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone_number, avatar_url")
        .in("user_id", menteeIds);
      profiles = Object.fromEntries(
        (profs ?? []).map((p: { user_id: string; full_name: string | null; email: string | null; phone_number: string | null; avatar_url: string | null }) => [
          p.user_id,
          { full_name: p.full_name, email: p.email, phone_number: p.phone_number, avatar_url: p.avatar_url },
        ]),
      );
    }
    setRequests(rows.map((r) => ({ ...r, mentee: profiles[r.mentee_user_id] ?? null })));
    setRequestsLoading(false);
  }, [toast]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_wbmc_member")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsMember(!!profile?.is_wbmc_member);

      const { data: apps } = await supabase
        .from("mentorship_applications")
        .select("role, starting_role, selected_both")
        .eq("user_id", user.id);
      const mentee = (apps ?? []).some(
        (a: { role: string; starting_role: string | null; selected_both: boolean | null }) =>
          a.role === "mentee" || (a.selected_both && a.starting_role === "mentee"),
      );
      const mentor = (apps ?? []).some(
        (a: { role: string; starting_role: string | null; selected_both: boolean | null }) =>
          a.role === "mentor" || (a.selected_both && a.starting_role === "mentor"),
      );
      setIsMentee(mentee);
      setIsMentor(mentor);

      const initialTab = mentee ? "browse" : mentor ? "requests" : "browse";
      setTab(initialTab);

      // Load mentors + connection requests for everyone in the program
      const { data: conns } = await supabase
        .from("mentorship_connections")
        .select("mentor_application_id")
        .eq("mentee_user_id", user.id);
      setConnectedIds(new Set((conns ?? []).map((c: { mentor_application_id: string }) => c.mentor_application_id)));
      await loadMentors();
      if (mentor) {
        await loadRequests(user.id);
      }
      setLoading(false);
    })();
  }, [navigate, loadMentors, loadRequests]);

  const handleConnect = async (mentor: MentorCard) => {
    if (!userId) return;
    setConnectingId(mentor.id);
    const { error } = await supabase.from("mentorship_connections").insert({
      mentee_user_id: userId,
      mentor_application_id: mentor.id,
      mentor_user_id: mentor.user_id,
      status: "pending",
    } as never);
    setConnectingId(null);
    if (error) {
      toast({ title: "Couldn't send request", description: error.message, variant: "destructive" });
      return;
    }
    setConnectedIds((prev) => new Set(prev).add(mentor.id));
    toast({ title: "Request sent", description: `We've let ${mentor.first_name} know.` });
  };

  const respondRequest = async (req: RequestRow, status: "accepted" | "declined") => {
    setActingId(req.id);
    const { error } = await supabase
      .from("mentorship_connections")
      .update({ status } as never)
      .eq("id", req.id);
    setActingId(null);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status } : r)));
    toast({ title: status === "accepted" ? "Request accepted" : "Request declined" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMentee && !isMentor) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Eagles Mentorship" onNavigateHome={() => navigate("/")} />
        <main className="max-w-md mx-auto p-6 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Bird className="h-8 w-8 text-primary" />
          </div>
          {!isMember ? (
            <>
              <h2 className="text-xl font-bold">Church members only</h2>
              <p className="text-sm text-muted-foreground">
                The Eagles Mentorship Programme is open to WBMC church members.
                Confirm your membership in Settings to continue.
              </p>
              <Button className="w-full" onClick={() => navigate("/settings?tab=church")}>
                Become a church member
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back home
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">Join the Eagles Program</h2>
              <p className="text-sm text-muted-foreground">
                Register as a mentor or mentee to access matches and requests.
              </p>
              <Button className="w-full" onClick={() => navigate("/settings?tab=mentorship")}>
                Complete mentorship profile
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setRegisterOpen(true)}>
                Quick register
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back home
              </Button>
            </>
          )}
        </main>
        <EaglesMentorshipModal open={registerOpen} onOpenChange={setRegisterOpen} />
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Eagles Mentorship" onNavigateHome={() => navigate("/")} />
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bird className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Eagles Mentorship</h1>
            <p className="text-xs text-muted-foreground">
              {isMentee && isMentor ? "Mentor & Mentee" : isMentor ? "Mentor" : "Mentee"}
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="browse">
              <Users className="h-4 w-4 mr-1.5" /> Mentors
            </TabsTrigger>
            <TabsTrigger value="requests" disabled={!isMentor}>
              <Inbox className="h-4 w-4 mr-1.5" /> Requests
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">{pendingCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4 space-y-3">
            {mentors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No approved mentors available yet — check back soon.
              </p>
            )}
            {mentors.map((m) => {
              const connected = connectedIds.has(m.id);
              const isSelf = userId && m.user_id === userId;
              return (
                <Card key={m.id}>
                  <CardHeader className="flex-row items-start gap-3 space-y-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={m.avatar_url ?? undefined} />
                      <AvatarFallback>{m.first_name[0]}{m.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{m.first_name} {m.last_name}</CardTitle>
                      {m.interests && (
                        <CardDescription className="text-xs line-clamp-2 mt-0.5">{m.interests}</CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {m.bio && <p className="text-sm text-foreground/80 line-clamp-3">{m.bio}</p>}
                    {(m.sessions_per_month || m.max_mentees) && (
                      <div className="flex gap-2 flex-wrap">
                        {m.sessions_per_month && (
                          <Badge variant="secondary">{m.sessions_per_month} sessions/mo</Badge>
                        )}
                        {m.max_mentees && (
                          <Badge variant="secondary">Up to {m.max_mentees} mentees</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedMentor(m)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View details
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!!isSelf || connected || connectingId === m.id}
                        onClick={() => handleConnect(m)}
                      >
                        {connectingId === m.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        {isSelf ? "That's you" : connected ? <><Check className="h-4 w-4 mr-1" /> Requested</> : "Request mentor"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-3">
            {!isMentor && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Register as a mentor to receive requests.
              </p>
            )}
            {isMentor && requestsLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            {isMentor && !requestsLoading && requests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No requests yet. Mentees will appear here when they connect.
              </p>
            )}
            {isMentor && requests.map((r) => (
              <Card key={r.id}>
                <CardHeader className="flex-row items-start gap-3 space-y-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={r.mentee?.avatar_url ?? undefined} />
                    <AvatarFallback>{(r.mentee?.full_name ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{r.mentee?.full_name ?? "Mentee"}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"}
                    className="capitalize"
                  >
                    {r.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.message && <p className="text-sm text-foreground/80">{r.message}</p>}
                  {r.status === "accepted" && (
                    <div className="space-y-1 text-xs">
                      {r.mentee?.email && (
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Mail className="h-3.5 w-3.5" /> {r.mentee.email}
                        </div>
                      )}
                      {r.mentee?.phone_number && (
                        <div className="flex items-center gap-2 text-foreground/80">
                          <Phone className="h-3.5 w-3.5" /> {r.mentee.phone_number}
                        </div>
                      )}
                    </div>
                  )}
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={actingId === r.id}
                        onClick={() => respondRequest(r, "accepted")}
                      >
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={actingId === r.id}
                        onClick={() => respondRequest(r, "declined")}
                      >
                        <X className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedMentor} onOpenChange={(o) => !o && setSelectedMentor(null)}>
        <DialogContent className="max-w-md">
          {selectedMentor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={selectedMentor.avatar_url ?? undefined} />
                    <AvatarFallback>{selectedMentor.first_name[0]}{selectedMentor.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <DialogTitle>{selectedMentor.first_name} {selectedMentor.last_name}</DialogTitle>
                    {selectedMentor.interests && (
                      <DialogDescription className="text-xs">{selectedMentor.interests}</DialogDescription>
                    )}
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
                {(() => {
                  const d = selectedMentor.details ?? {};
                  const bio = d.bio || selectedMentor.bio;
                  const Section = ({ label, value }: { label: string; value?: string | null }) =>
                    value ? (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                        <p className="text-foreground/80 whitespace-pre-wrap">{value}</p>
                      </div>
                    ) : null;
                  return (
                    <>
                      {bio && <Section label="About" value={bio} />}

                      {(d.profession || d.company || d.years_experience || selectedMentor.education_level || selectedMentor.age) && (
                        <div className="grid grid-cols-2 gap-3">
                          {d.profession && <Section label="Profession" value={d.profession} />}
                          {d.company && <Section label="Company" value={d.company} />}
                          {d.years_experience && <Section label="Years of experience" value={d.years_experience} />}
                          {selectedMentor.education_level && <Section label="Education" value={selectedMentor.education_level} />}
                          {selectedMentor.age != null && <Section label="Age" value={String(selectedMentor.age)} />}
                        </div>
                      )}

                      <Section label="Interest — Church" value={d.interest_church} />
                      <Section label="Interest — Work" value={d.interest_work} />
                      <Section label="Interest — Community" value={d.interest_community} />

                      {d.strengths && d.strengths.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Strengths</p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.strengths.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                          </div>
                        </div>
                      )}

                      {d.methods && d.methods.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Preferred methods</p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.methods.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
                          </div>
                        </div>
                      )}

                      {(d.capacity_per_week || d.time_per_session || selectedMentor.sessions_per_month || selectedMentor.max_mentees) && (
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Availability</p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.capacity_per_week && <Badge variant="secondary">{d.capacity_per_week} / week</Badge>}
                            {d.time_per_session && <Badge variant="secondary">{d.time_per_session} per session</Badge>}
                            {selectedMentor.sessions_per_month && <Badge variant="secondary">{selectedMentor.sessions_per_month} sessions/mo</Badge>}
                            {selectedMentor.max_mentees && <Badge variant="secondary">Up to {selectedMentor.max_mentees} mentees</Badge>}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <DialogFooter>
                {(() => {
                  const connected = connectedIds.has(selectedMentor.id);
                  const isSelf = userId && selectedMentor.user_id === userId;
                  return (
                    <Button
                      className="w-full"
                      disabled={!!isSelf || connected || connectingId === selectedMentor.id}
                      onClick={() => handleConnect(selectedMentor)}
                    >
                      {connectingId === selectedMentor.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      {isSelf ? "That's you" : connected ? <><Check className="h-4 w-4 mr-1" /> Request sent</> : "Request as my mentor"}
                    </Button>
                  );
                })()}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mentorship;
