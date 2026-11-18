import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, ArrowLeft, Users, Check, Mail, Phone, BookOpen } from "lucide-react";
import { z } from "zod";


interface EaglesMentorshipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RoleChoice = "mentor" | "mentee" | "both";
type StartingRole = "mentor" | "mentee";
type Step = "intro" | "role" | "church-check" | "church-join" | "starting" | "form" | "match" | "done" | "browse" | "program";

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
};

const VERSE = `"But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."`;

const EDUCATION_LEVELS = [
  "Primary School",
  "High School",
  "Matric / Grade 12",
  "Certificate / Diploma",
  "Undergraduate Degree",
  "Postgraduate Degree",
  "Other",
];

const formSchema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80),
  last_name: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(5, "Required").max(30),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  interests: z.string().trim().max(500).optional().or(z.literal("")),
});

export function EaglesMentorshipModal({ open, onOpenChange }: EaglesMentorshipModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("intro");
  const [userId, setUserId] = useState<string | null>(null);

  const [role, setRole] = useState<RoleChoice>("mentee");
  const [startingRole, setStartingRole] = useState<StartingRole>("mentee");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [maxMentees, setMaxMentees] = useState<string>("");
  const [sessions, setSessions] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [educationLevel, setEducationLevel] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<{ user_id: string; full_name: string | null; email: string | null } | null>(null);
  const [mentors, setMentors] = useState<MentorCard[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedMentorIds, setConnectedMentorIds] = useState<Set<string>>(new Set());
  const [hasMenteeApplication, setHasMenteeApplication] = useState(false);
  const [hasMentorApplication, setHasMentorApplication] = useState(false);
  const [isChurchMember, setIsChurchMember] = useState<boolean>(false);
  const [wantsToJoinChurch, setWantsToJoinChurch] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUserId(u?.id ?? null);
      if (u) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name, email, phone_number, is_wbmc_member")
          .eq("user_id", u.id)
          .maybeSingle();
        setIsChurchMember(!!profile?.is_wbmc_member);
        if (profile) {
          setFirstName(profile.first_name ?? profile.full_name?.split(" ")[0] ?? "");
          setLastName(profile.last_name ?? profile.full_name?.split(" ").slice(1).join(" ") ?? "");
          setEmail(profile.email ?? u.email ?? "");
          setPhone(profile.phone_number ?? "");
        } else {
          setEmail(u.email ?? "");
        }

        // Check if user already has a mentee application + any existing connection requests
        const { data: apps } = await supabase
          .from("mentorship_applications")
          .select("id, role, starting_role, selected_both")
          .eq("user_id", u.id);
        const isMenteeAlready = (apps ?? []).some(
          (a: { role: string; starting_role: string | null; selected_both: boolean | null }) =>
            a.role === "mentee" || (a.selected_both && a.starting_role === "mentee")
        );
        setHasMenteeApplication(isMenteeAlready);
        if (isMenteeAlready) {
          setStep("browse");
          loadMentors();
        } else {
          const isMentorAlready = (apps ?? []).some(
            (a: { role: string; starting_role: string | null; selected_both: boolean | null }) =>
              a.role === "mentor" || (a.selected_both && a.starting_role === "mentor")
          );
          setHasMentorApplication(isMentorAlready);
          if (isMentorAlready) {
            setStep("program");
          }
        }

        const { data: conns } = await supabase
          .from("mentorship_connections")
          .select("mentor_application_id")
          .eq("mentee_user_id", u.id);
        setConnectedMentorIds(new Set((conns ?? []).map((c: { mentor_application_id: string }) => c.mentor_application_id)));
      }
    });
  }, [open]);

  const loadMentors = async () => {
    setLoadingMentors(true);
    const { data, error } = await supabase
      .from("mentorship_applications")
      .select("id, user_id, first_name, last_name, email, phone, bio, interests, avatar_url, sessions_per_month, max_mentees, role, starting_role, selected_both, status")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    setLoadingMentors(false);
    if (error) {
      toast({ title: "Couldn't load mentors", description: error.message, variant: "destructive" });
      return;
    }
    const list = (data ?? []).filter((a: { role: string; starting_role: string | null; selected_both: boolean | null }) =>
      a.role === "mentor" || (a.selected_both && a.starting_role === "mentor")
    ) as MentorCard[];
    setMentors(list);
  };

  const openBrowse = async () => {
    setStep("browse");
    await loadMentors();
  };

  const handleConnect = async (mentor: MentorCard) => {
    if (!userId) {
      toast({ title: "Please sign in", description: "Sign in to connect with a mentor.", variant: "destructive" });
      return;
    }
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
    setConnectedMentorIds((prev) => new Set(prev).add(mentor.id));
    toast({ title: "Request sent", description: `We've let ${mentor.first_name} know you'd like to connect.` });
  };

  const resetAndClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("intro");
      setMatchedProfile(null);
      setAvatarFile(null);
      setAvatarPreview("");
    }, 300);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `mentorship/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast({ title: "Avatar upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  // The "active" role drives which form fields apply this round.
  const activeRole: StartingRole = role === "both" ? startingRole : (role as StartingRole);
  const isMentorActive = activeRole === "mentor";
  const isMenteeActive = activeRole === "mentee";

  const handleRoleNext = () => {
    if (role === "both") {
      setStep("starting");
      return;
    }
    setStartingRole(role as StartingRole);
    // Logged-in users: just confirm church membership, then we submit using profile data.
    if (userId) {
      setStep("church-check");
      return;
    }
    // Logged-out: keep existing full-form flow (mentor still gated by church check).
    if (role === "mentor") {
      if (isChurchMember || wantsToJoinChurch) {
        setStep("form");
      } else {
        setStep("church-check");
      }
    } else {
      setStep("form");
    }
  };

  const submitQuickApplication = async (opts: { isMember: boolean; joiningChurch: boolean }) => {
    if (!userId) return;
    setSubmitting(true);
    const isMemberFinal = opts.isMember || opts.joiningChurch;
    const payload: Record<string, unknown> = {
      user_id: userId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: activeRole,
      selected_both: false,
      starting_role: activeRole,
    };
    const { error } = await supabase.from("mentorship_applications").insert(payload as never);
    if (error) {
      setSubmitting(false);
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }

    await supabase
      .from("profiles")
      .update({
        wants_mentorship: true,
        mentorship_role: activeRole,
        ...(isMemberFinal ? { is_wbmc_member: true } : {}),
        ...(opts.joiningChurch ? { membership_status: "pending" } : {}),
      })
      .eq("user_id", userId);

    if (opts.joiningChurch) {
      await supabase.from("membership_applications").insert({
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        cell_number: phone.trim(),
        status: "pending",
        source: "eagles_mentorship",
        matched_user_id: userId,
      } as never);
    }

    // Grant Mentor/Mentee role, and Church Member if applicable.
    await supabase.rpc("add_self_mentorship_role", { _role: activeRole });
    if (isMemberFinal) {
      await supabase.rpc("add_self_mentorship_role", { _role: "church_member" });
    }

    setIsChurchMember(isMemberFinal);
    setSubmitting(false);
    setStep("done");
  };

  const handleChurchAnswer = async (isMember: boolean) => {
    if (!userId) {
      // Logged-out path: continue to existing full form / join step.
      if (isMember) {
        setIsChurchMember(true);
        setStartingRole(activeRole);
        setStep("form");
      } else {
        setStep("church-join");
      }
      return;
    }
    // Logged-in: mentor without membership must agree to join first.
    if (activeRole === "mentor" && !isMember) {
      setStep("church-join");
      return;
    }
    await submitQuickApplication({ isMember, joiningChurch: false });
  };

  const submitApplication = async (linkUserId: string | null) => {
    setSubmitting(true);
    const avatarUrl = await uploadAvatar();
    const payload: Record<string, unknown> = {
      user_id: linkUserId,
      matched_user_id: matchedProfile?.user_id ?? null,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bio: bio.trim() || null,
      interests: interests.trim() || null,
      role,
      selected_both: role === "both",
      starting_role: activeRole,
      avatar_url: avatarUrl,
      max_mentees: isMentorActive && maxMentees ? parseInt(maxMentees, 10) : null,
      sessions_per_month: sessions ? parseInt(sessions, 10) : null,
      age: isMenteeActive && age ? parseInt(age, 10) : null,
      education_level: isMenteeActive ? (educationLevel || null) : null,
    };
    const { error } = await supabase.from("mentorship_applications").insert(payload as never);
    if (error) {
      setSubmitting(false);
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }

    if (linkUserId) {
      await supabase
        .from("profiles")
        .update({
          wants_mentorship: true,
          mentorship_role: role,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phone.trim(),
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          ...(isMentorActive && wantsToJoinChurch ? { is_wbmc_member: true, membership_status: "pending" } : {}),
        })
        .eq("user_id", linkUserId);

      if (isMentorActive && wantsToJoinChurch) {
        await supabase.from("membership_applications").insert({
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: email.trim(),
          cell_number: phone.trim(),
          status: "pending",
          source: "eagles_mentorship",
          matched_user_id: linkUserId,
        } as never);
      }
    }

    setSubmitting(false);
    setStep("done");
  };

  const handleSubmitForm = async () => {
    const parsed = formSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      bio,
      interests,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({ title: "Please check your details", description: first.message, variant: "destructive" });
      return;
    }

    if (isMenteeActive) {
      const ageNum = age ? parseInt(age, 10) : NaN;
      if (!ageNum || ageNum < 5 || ageNum > 120) {
        toast({ title: "Please enter a valid age", variant: "destructive" });
        return;
      }
      if (!educationLevel) {
        toast({ title: "Please select your education level", variant: "destructive" });
        return;
      }
    }

    if (userId) {
      await submitApplication(userId);
      return;
    }

    setSubmitting(true);
    const { data: match } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .ilike("email", email.trim())
      .maybeSingle();
    setSubmitting(false);

    if (match) {
      setMatchedProfile(match);
      setStep("match");
      return;
    }

    await submitApplication(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : resetAndClose())}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto border-primary border-2">
        {step === "intro" && (
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="-mx-6 -mt-6 px-6 pt-8 pb-6 bg-background text-primary rounded-t-lg w-full">
              <h2 className="text-6xl font-bold tracking-tight uppercase">Eagles</h2>
              <p className="text-primary/80 text-sm font-medium mt-1">Word Based Missional Church Mentorship Program</p>
            </div>
            <blockquote className="text-sm italic text-foreground/80 border-l-4 border-primary pl-4 py-1 text-left">
              {VERSE}
              <footer className="not-italic text-xs text-muted-foreground mt-2">— Isaiah 40:31</footer>
            </blockquote>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
              onClick={() => setStep("role")}
            >
              Join Program
            </Button>
            {hasMenteeApplication && (
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10"
                size="lg"
                onClick={openBrowse}
              >
                <Users className="h-4 w-4 mr-2" /> Browse Mentors
              </Button>
            )}
            {hasMentorApplication && (
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10"
                size="lg"
                onClick={() => setStep("program")}
              >
                <BookOpen className="h-4 w-4 mr-2" /> How the program works
              </Button>
            )}
          </div>
        )}

        {step === "role" && (
          <div className="space-y-5 text-center">
            <DialogHeader>
              <DialogTitle className="text-primary text-2xl">How would you like to take part?</DialogTitle>
              <DialogDescription>
                Choose whether you'd like to mentor others or be mentored.
              </DialogDescription>
            </DialogHeader>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as RoleChoice)}
              className="grid grid-cols-2 gap-2"
            >
              {([
                { value: "mentor", label: "Mentor", desc: "Share your wisdom and guide others." },
                { value: "mentee", label: "Mentee", desc: "Be guided and grow with a mentor." },
              ] as const).map((r) => (
                <Label
                  key={r.value}
                  htmlFor={`rc-${r.value}`}
                  className={`flex flex-col items-center text-center gap-1 border rounded-lg p-4 cursor-pointer ${
                    role === r.value ? "border-primary bg-primary/10" : "border-input"
                  }`}
                >
                  <RadioGroupItem id={`rc-${r.value}`} value={r.value} className="sr-only" />
                  <span className="font-medium text-foreground">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.desc}</span>
                </Label>
              ))}
            </RadioGroup>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("intro")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleRoleNext} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "church-check" && (
          <div className="space-y-5 text-center">
            <DialogHeader>
              <DialogTitle className="text-primary text-2xl">Are you a WBMC member?</DialogTitle>
              <DialogDescription>
                {activeRole === "mentor"
                  ? "Only vetted Word Based Missional Church members can serve as Mentors."
                  : "Let us know so we can connect you within our church community."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-input py-6"
                disabled={submitting}
                onClick={() => handleChurchAnswer(true)}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Yes, I'm a member
              </Button>
              <Button
                variant="outline"
                className="border-input py-6"
                disabled={submitting}
                onClick={() => handleChurchAnswer(false)}
              >
                No, not yet
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setStep("role")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        )}

        {step === "church-join" && (
          <div className="space-y-5 text-center">
            <DialogHeader>
              <DialogTitle className="text-destructive text-xl">
                Only Vetted Church Members can be Mentors
              </DialogTitle>
              <DialogDescription>
                Would you like to become a WBMC member? We'll register you as a Church Member alongside your Mentor application.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={submitting}
                onClick={async () => {
                  setWantsToJoinChurch(true);
                  setStartingRole("mentor");
                  if (userId) {
                    await submitQuickApplication({ isMember: true, joiningChurch: true });
                  } else {
                    setStep("form");
                  }
                }}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Yes, register me as a Church Member
              </Button>
              <Button variant="outline" onClick={() => setStep("role")} disabled={submitting}>
                No, take me back
              </Button>
            </div>
          </div>
        )}


        {step === "starting" && (
          <div className="space-y-5 text-center">
            <DialogHeader>
              <DialogTitle className="text-primary text-2xl">Which would you like to start with?</DialogTitle>
              <DialogDescription>
                You chose both — pick the role you'd like to begin with. We'll save that you're open to both.
              </DialogDescription>
            </DialogHeader>
            <RadioGroup
              value={startingRole}
              onValueChange={(v) => setStartingRole(v as StartingRole)}
              className="grid grid-cols-2 gap-2"
            >
              {([
                { value: "mentor", label: "Start as Mentor" },
                { value: "mentee", label: "Start as Mentee" },
              ] as const).map((r) => (
                <Label
                  key={r.value}
                  htmlFor={`sr-${r.value}`}
                  className={`flex items-center justify-center gap-2 border rounded-lg py-4 cursor-pointer font-medium ${
                    startingRole === r.value ? "border-primary bg-primary/10 text-primary" : "border-input"
                  }`}
                >
                  <RadioGroupItem id={`sr-${r.value}`} value={r.value} className="sr-only" />
                  {r.label}
                </Label>
              ))}
            </RadioGroup>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("role")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep("form")} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "form" && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-primary">
                {isMentorActive ? "Mentor Registration" : "Mentee Registration"}
              </DialogTitle>
              <DialogDescription>
                {role === "both"
                  ? `You're starting as a ${startingRole}. Tell us about yourself.`
                  : "Tell us about yourself so we can connect you with the right people."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(firstName[0] ?? "") + (lastName[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="m-avatar" className="cursor-pointer inline-flex items-center gap-2 text-sm border border-input rounded-md px-3 py-2 hover:bg-accent w-full justify-center">
                    <Upload className="h-4 w-4" /> Upload your profile picture
                    <input id="m-avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 text-center">A photo helps mentors and mentees recognize each other.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-fn">Name</Label>
                  <Input id="m-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-ln">Surname</Label>
                  <Input id="m-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={80} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-email">Email</Label>
                  <Input id="m-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-phone">Phone</Label>
                  <Input id="m-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
                </div>
              </div>

              {isMenteeActive && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="m-age">Age</Label>
                    <Input
                      id="m-age"
                      type="number"
                      min={5}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 24"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Education level</Label>
                    <Select value={educationLevel} onValueChange={setEducationLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="m-bio">Bio</Label>
                <Textarea id="m-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} placeholder="A little about you..." />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-int">Interests / hobbies</Label>
                <Input id="m-int" value={interests} onChange={(e) => setInterests(e.target.value)} maxLength={500} placeholder="e.g. music, leadership, prayer" />
              </div>

              {isMentorActive && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>How many mentees can you commit to?</Label>
                    <Select value={maxMentees} onValueChange={setMaxMentees}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a number" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n === 0 ? "None" : n === 1 ? "1 mentee" : `${n} mentees`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>How many 30-minute sessions per month?</Label>
                    <Select value={sessions} onValueChange={setSessions}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a number" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }, (_, i) => i).map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n === 0 ? "None" : n === 1 ? "1 session" : `${n} sessions`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {isMenteeActive && (
                <div className="space-y-1.5">
                  <Label>How many 30-minute sessions per month can you commit to?</Label>
                  <Select value={sessions} onValueChange={setSessions}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a number" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 13 }, (_, i) => i).map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n === 0 ? "None" : n === 1 ? "1 session" : `${n} sessions`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(role === "both" ? "starting" : "role")}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleSubmitForm} disabled={submitting} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Registration
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "match" && matchedProfile && (
          <div className="space-y-4 text-center">
            <DialogHeader>
              <DialogTitle className="text-primary">We found a matching account</DialogTitle>
              <DialogDescription>
                An Echo account already exists with this email. Is this you?
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border p-4 bg-primary/5">
              <p className="font-medium">{matchedProfile.full_name ?? "Existing user"}</p>
              <p className="text-sm text-muted-foreground">{matchedProfile.email}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              If yes, sign in first so we can link your mentorship profile to your Echo account. Otherwise we'll submit
              your registration without linking.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetAndClose();
                  toast({ title: "Please sign in", description: "Sign in and re-open Eagles to link your profile." });
                }}
              >
                Yes, that's me — I'll sign in
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={submitting}
                onClick={() => submitApplication(null)}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Not me — submit anyway
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center py-4">
            <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-primary">You're in!</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {isMenteeActive
                ? "Thank you for joining. Browse our mentors below and send a request to connect."
                : "Thank you for joining the Eagles Mentorship Program. Our team will be in touch soon."}
            </p>
            {isMenteeActive ? (
              <div className="flex flex-col gap-2">
                <Button onClick={openBrowse} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Users className="h-4 w-4 mr-2" /> Browse Mentors
                </Button>
                <Button variant="outline" onClick={resetAndClose} className="w-full">Maybe later</Button>
              </div>
            ) : isMentorActive ? (
              <div className="flex flex-col gap-2">
                <Button onClick={() => setStep("program")} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <BookOpen className="h-4 w-4 mr-2" /> How the program works
                </Button>
                <Button variant="outline" onClick={resetAndClose} className="w-full">Done</Button>
              </div>
            ) : (
              <Button onClick={resetAndClose} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Done</Button>
            )}
          </div>
        )}

        {step === "browse" && (
          <div className="space-y-4">
            <DialogHeader className="text-center">
              <DialogTitle className="text-primary text-2xl">Meet our Mentors</DialogTitle>
              <DialogDescription>
                Send a request to a mentor you'd like to connect with. They'll be notified and can accept.
              </DialogDescription>
            </DialogHeader>

            {loadingMentors ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : mentors.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No approved mentors are available yet. Please check back soon.
              </div>
            ) : (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {mentors.map((m) => {
                  const isConnected = connectedMentorIds.has(m.id);
                  const initials = (m.first_name?.[0] ?? "") + (m.last_name?.[0] ?? "");
                  return (
                    <div key={m.id} className="border rounded-lg p-4 flex gap-3 items-start hover:border-primary/50 transition-colors">
                      <Avatar className="h-14 w-14 border-2 border-primary/30 shrink-0">
                        <AvatarImage src={m.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials || "M"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{m.first_name} {m.last_name}</p>
                        {m.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.bio}</p>}
                        {m.interests && (
                          <p className="text-xs text-primary/80 mt-1 truncate">
                            <span className="font-medium">Interests:</span> {m.interests}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                          {m.sessions_per_month != null && <span>{m.sessions_per_month} sessions / month</span>}
                          {m.max_mentees != null && <span>Up to {m.max_mentees} mentees</span>}
                        </div>
                        {isConnected && (
                          <div className="flex flex-col gap-1 mt-2 text-xs text-foreground/80">
                            {m.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</span>}
                            {m.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {m.phone}</span>}
                          </div>
                        )}
                        <div className="mt-3">
                          {isConnected ? (
                            <Button size="sm" variant="outline" disabled className="border-primary text-primary">
                              <Check className="h-3 w-3 mr-1" /> Request sent
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              disabled={connectingId === m.id}
                              onClick={() => handleConnect(m)}
                            >
                              {connectingId === m.id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button variant="outline" onClick={resetAndClose} className="w-full">Close</Button>
          </div>
        )}

        {step === "program" && (
          <div className="space-y-4 text-center py-4">
            <DialogHeader className="text-center">
              <DialogTitle className="text-primary text-2xl">How the program works</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Share your experience, walk alongside a mentee, and grow together in faith.
            </p>
            <Button onClick={resetAndClose} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
