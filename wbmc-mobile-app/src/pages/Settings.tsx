import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Camera, Loader2, User as UserIcon, Mail, Phone, Calendar,
  Church, HeartHandshake, Handshake, GraduationCap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  is_wbmc_member: boolean;
  membership_status: string;
  wants_mentorship: boolean;
  mentorship_role: string | null;
  sms_gallery_opt_in: boolean;
  email_gallery_opt_in: boolean;
}

interface MentorDetails {
  profession: string; company: string; years_experience: string; bio: string;
  interest_church: string; interest_work: string; interest_community: string;
  strengths: string[]; capacity_per_week: string; time_per_session: string; methods: string[];
}
interface MenteeDetails {
  current_status: string; institution: string; qualification: string; current_level: string;
  highest_qualification: string; field_of_study: string; business_description: string;
  interest_home: string; interest_work: string; interest_church: string;
  goals: string[]; additional_info: string;
}
const emptyMentor: MentorDetails = {
  profession: "", company: "", years_experience: "", bio: "",
  interest_church: "", interest_work: "", interest_community: "",
  strengths: [], capacity_per_week: "", time_per_session: "", methods: [],
};
const emptyMentee: MenteeDetails = {
  current_status: "", institution: "", qualification: "", current_level: "",
  highest_qualification: "", field_of_study: "", business_description: "",
  interest_home: "", interest_work: "", interest_church: "",
  goals: [], additional_info: "",
};
const STRENGTH_OPTIONS = ["Leadership", "Business", "Teaching", "Technology", "Finance", "Counselling", "Entrepreneurship"];
const METHOD_OPTIONS = ["In Person", "Online", "WhatsApp", "Phone Calls", "Either"];
const GOAL_OPTIONS = ["Career Guidance","Entrepreneurship","Spiritual Growth","Leadership","Financial Literacy","Education","Personal Development","Technology","Relationships","Other"];
const LEVEL_OPTIONS = ["High School","Certificate","Diploma","Degree","Honours","Masters","Other"];
const STATUS_OPTIONS = ["Studying","Employed","Unemployed","Business Owner","Other"];
const GENDER_OPTIONS = ["Male", "Female", "Other"];
const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed", "Other"];

interface MembershipDetails {
  cell_number: string;
  work_number: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  address: string;
  city: string;
  postal_code: string;
  previous_church: string;
  is_baptized: boolean | null;
  wants_baptism: boolean | null;
}
const emptyMembership: MembershipDetails = {
  cell_number: "", work_number: "", date_of_birth: "", gender: "", marital_status: "",
  address: "", city: "", postal_code: "", previous_church: "",
  is_baptized: null, wants_baptism: null,
};


export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = requestedTab === "mentorship" || requestedTab === "church" || requestedTab === "personal" ? requestedTab : "personal";
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingMembership, setSavingMembership] = useState(false);
  const [savingMentorship, setSavingMentorship] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [dirtyPersonal, setDirtyPersonal] = useState(false);
  const [dirtyChurch, setDirtyChurch] = useState(false);
  const [dirtyMentorship, setDirtyMentorship] = useState(false);
  const [profile, setProfileState] = useState<ProfileData>({
    first_name: "", last_name: "", full_name: "", email: "",
    phone_number: "", birth_date: "", avatar_url: null,
    is_wbmc_member: false, membership_status: "none",
    wants_mentorship: false, mentorship_role: null,
    sms_gallery_opt_in: false, email_gallery_opt_in: false,
  });

  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [mentorshipRole, setMentorshipRoleState] = useState<"mentor" | "mentee" | null>(null);
  const [mentorData, setMentorDataState] = useState<MentorDetails>(emptyMentor);
  const [menteeData, setMenteeDataState] = useState<MenteeDetails>(emptyMentee);

  const [membershipAppId, setMembershipAppId] = useState<string | null>(null);
  const [membership, setMembershipState] = useState<MembershipDetails>(emptyMembership);

  // Wrappers that auto-mark sections dirty
  const PERSONAL_FIELDS: (keyof ProfileData)[] = ["first_name","last_name","full_name","phone_number","birth_date","sms_gallery_opt_in","email_gallery_opt_in"];
  const CHURCH_FIELDS: (keyof ProfileData)[] = ["is_wbmc_member","membership_status"];
  const setProfile: typeof setProfileState = (updater) => {
    setProfileState((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater;
      if (PERSONAL_FIELDS.some((k) => prev[k] !== next[k])) setDirtyPersonal(true);
      if (CHURCH_FIELDS.some((k) => prev[k] !== next[k])) setDirtyChurch(true);
      return next;
    });
  };
  const setMembership: typeof setMembershipState = (updater) => {
    setMembershipState(updater as any);
    setDirtyChurch(true);
  };
  const setMentorshipRole: typeof setMentorshipRoleState = (v) => {
    setMentorshipRoleState(v);
    setDirtyMentorship(true);
  };
  const setMentorData: typeof setMentorDataState = (v) => {
    setMentorDataState(v as any);
    setDirtyMentorship(true);
  };
  const setMenteeData: typeof setMenteeDataState = (v) => {
    setMenteeDataState(v as any);
    setDirtyMentorship(true);
  };



  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("first_name, last_name, full_name, email, phone_number, birth_date, avatar_url, is_wbmc_member, membership_status, wants_mentorship, mentorship_role, sms_gallery_opt_in, email_gallery_opt_in")
        .eq("user_id", user.id)
        .maybeSingle();
      if (p) {
        setProfileState({
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          full_name: p.full_name ?? "",
          email: p.email ?? user.email ?? "",
          phone_number: p.phone_number ?? "",
          birth_date: p.birth_date ?? "",
          avatar_url: p.avatar_url ?? null,
          is_wbmc_member: !!p.is_wbmc_member,
          membership_status: p.membership_status ?? "none",
          wants_mentorship: !!p.wants_mentorship,
          mentorship_role: p.mentorship_role ?? null,
          sms_gallery_opt_in: !!(p as any).sms_gallery_opt_in,
          email_gallery_opt_in: !!(p as any).email_gallery_opt_in,
        });
      }

      const { data: app } = await supabase
        .from("mentorship_applications")
        .select("id, role, details")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (app) {
        setApplicationId(app.id);
        const role = (app.role as "mentor" | "mentee") ?? null;
        setMentorshipRoleState(role);
        const details = (app.details ?? {}) as any;
        if (role === "mentor") setMentorDataState({ ...emptyMentor, ...details });
        else if (role === "mentee") setMenteeDataState({ ...emptyMentee, ...details });
      }

      // Membership application — match by user_id or email
      const userEmail = (p?.email ?? user.email ?? "").toLowerCase();
      const { data: mApp } = await supabase
        .from("membership_applications")
        .select("id, cell_number, work_number, date_of_birth, gender, marital_status, address, city, postal_code, previous_church, is_baptized, wants_baptism")
        .or(`matched_user_id.eq.${user.id}${userEmail ? `,email.eq.${userEmail}` : ""}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mApp) {
        setMembershipAppId(mApp.id);
        setMembershipState({
          cell_number: mApp.cell_number ?? "",
          work_number: mApp.work_number ?? "",
          date_of_birth: mApp.date_of_birth ?? "",
          gender: mApp.gender ?? "",
          marital_status: mApp.marital_status ?? "",
          address: mApp.address ?? "",
          city: mApp.city ?? "",
          postal_code: mApp.postal_code ?? "",
          previous_church: mApp.previous_church ?? "",
          is_baptized: mApp.is_baptized,
          wants_baptism: mApp.wants_baptism,
        });
      }
      setLoading(false);

    };
    load();
  }, [navigate]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Choose an image under 5MB.", variant: "destructive" }); return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image.", variant: "destructive" }); return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("user_id", userId);
      setProfileState((p) => ({ ...p, avatar_url: pub.publicUrl }));
      toast({ title: "Profile picture updated" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const syncMentorshipApplication = async (extra?: Record<string, any>) => {
    if (!userId || !applicationId) return;
    const { error } = await supabase.from("mentorship_applications").update({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      email: profile.email ?? "",
      phone: profile.phone_number ?? "",
      ...(extra ?? {}),
    } as any).eq("id", applicationId);
    if (error) console.error("Failed to sync mentorship application:", error);
  };

  const savePersonal = async () => {
    if (!userId) return;
    setSavingPersonal(true);
    try {
      const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.full_name;
      const { error } = await supabase.from("profiles").update({
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        full_name: fullName || null,
        phone_number: profile.phone_number || null,
        birth_date: profile.birth_date || null,
        sms_gallery_opt_in: profile.sms_gallery_opt_in,
        email_gallery_opt_in: profile.email_gallery_opt_in,
      }).eq("user_id", userId);
      if (error) throw error;
      await syncMentorshipApplication();
      setDirtyPersonal(false);
      toast({ title: "Personal details saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSavingPersonal(false); }
  };


  const saveMembership = async () => {
    if (!userId) return;
    setSavingMembership(true);
    try {
      const becoming = !profile.is_wbmc_member && profile.membership_status === "pending";
      const updates: any = {
        is_wbmc_member: profile.is_wbmc_member,
        membership_status: profile.membership_status,
      };
      if (becoming) updates.membership_applied_at = new Date().toISOString();
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", userId);
      if (error) throw error;
      if (profile.is_wbmc_member) {
        try { await supabase.rpc("add_self_mentorship_role", { _role: "church_member" as any }); } catch {}
      }

      // Upsert membership_applications detail row
      const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || (profile.full_name ?? "");
      const payload: any = {
        full_name: fullName,
        email: profile.email ?? null,
        cell_number: membership.cell_number || null,
        work_number: membership.work_number || null,
        date_of_birth: membership.date_of_birth || null,
        gender: membership.gender || null,
        marital_status: membership.marital_status || null,
        address: membership.address || null,
        city: membership.city || null,
        postal_code: membership.postal_code || null,
        previous_church: membership.previous_church || null,
        is_baptized: membership.is_baptized,
        wants_baptism: membership.wants_baptism,
        matched_user_id: userId,
        status: profile.is_wbmc_member ? "approved" : (profile.membership_status === "pending" ? "pending" : "draft"),
        source: "settings",
      };
      if (membershipAppId) {
        await supabase.from("membership_applications").update(payload).eq("id", membershipAppId);
      } else {
        const { data: ins } = await supabase
          .from("membership_applications")
          .insert(payload)
          .select("id")
          .maybeSingle();
        if (ins?.id) setMembershipAppId(ins.id);
      }

      await syncMentorshipApplication();
      setDirtyChurch(false);

      toast({ title: "Church membership updated" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSavingMembership(false); }
  };


  const saveMentorship = async () => {
    if (!userId) return;
    if (!mentorshipRole) {
      toast({ title: "Pick a role", description: "Choose Mentor or Mentee.", variant: "destructive" }); return;
    }
    setSavingMentorship(true);
    try {
      const details = mentorshipRole === "mentor" ? mentorData : menteeData;
      const bio = mentorshipRole === "mentor" ? mentorData.bio : menteeData.additional_info;
      const interests = mentorshipRole === "mentor"
        ? [mentorData.interest_church, mentorData.interest_work, mentorData.interest_community].filter(Boolean).join(" | ")
        : [menteeData.interest_home, menteeData.interest_work, menteeData.interest_church].filter(Boolean).join(" | ");

      const detailsJson = details as unknown as Record<string, unknown>;
      if (applicationId) {
        await supabase.from("mentorship_applications").update({
          role: mentorshipRole, bio, interests, details: detailsJson as any,
        }).eq("id", applicationId);
      } else {
        const { data } = await supabase.from("mentorship_applications").insert({
          user_id: userId,

          first_name: profile.first_name ?? "",
          last_name: profile.last_name ?? "",
          email: profile.email ?? "",
          phone: profile.phone_number ?? "",
          role: mentorshipRole, bio, interests, details: detailsJson as any, status: "pending",
        }).select("id").maybeSingle();
        if (data?.id) setApplicationId(data.id);
      }


      await supabase.from("profiles").update({
        wants_mentorship: true,
        mentorship_role: mentorshipRole,
      }).eq("user_id", userId);

      try { await supabase.rpc("add_self_mentorship_role", { _role: mentorshipRole as any }); } catch {}

      setProfileState((p) => ({ ...p, wants_mentorship: true, mentorship_role: mentorshipRole }));
      setDirtyMentorship(false);
      toast({ title: "Mentorship details saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSavingMentorship(false); }
  };

  const toggleList = (list: string[], v: string) => list.includes(v) ? list.filter(x => x !== v) : [...list, v];

  const initials =
    `${(profile.first_name?.[0] ?? "")}${(profile.last_name?.[0] ?? "")}`.toUpperCase() ||
    profile.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <section className="flex flex-col items-center gap-3 py-2">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt="Profile" />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button type="button" onClick={handleAvatarClick} disabled={uploading}
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-50"
                  aria-label="Change profile picture">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.is_wbmc_member && <Badge variant="secondary"><Church className="h-3 w-3 mr-1" /> Church Member</Badge>}
                {profile.mentorship_role && <Badge variant="secondary"><HeartHandshake className="h-3 w-3 mr-1" /> {profile.mentorship_role}</Badge>}
              </div>
            </section>

            <Tabs
              value={activeTab}
              onValueChange={(next) => {
                const isDirty =
                  (activeTab === "personal" && dirtyPersonal) ||
                  (activeTab === "church" && dirtyChurch) ||
                  (activeTab === "mentorship" && dirtyMentorship);
                if (isDirty) {
                  toast({
                    title: "Unsaved changes",
                    description: "Please save your changes before switching tabs.",
                    variant: "destructive",
                  });
                  return;
                }
                if (next === "mentorship" && !profile.is_wbmc_member) {
                  toast({
                    title: "Membership required",
                    description: "Confirm WBMC membership in the Church tab to access mentorship.",
                  });
                  return;
                }
                setActiveTab(next);
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="church">Church</TabsTrigger>
                <TabsTrigger value="mentorship" disabled={!profile.is_wbmc_member}>Mentorship</TabsTrigger>
              </TabsList>

              {/* PERSONAL */}
              <TabsContent value="personal" className="space-y-4 mt-4 rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-primary" /> Personal Details
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-xs">First name</Label>
                    <Input id="first_name" value={profile.first_name ?? ""} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-xs">Last name</Label>
                    <Input id="last_name" value={profile.last_name ?? ""} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</Label>
                  <Input id="email" value={profile.email ?? ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs flex items-center gap-1.5"><Phone className="h-3 w-3" /> Phone number</Label>
                  <Input id="phone" type="tel" value={profile.phone_number ?? ""} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birth_date" className="text-xs flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Birth date</Label>
                  <Input id="birth_date" type="date" value={profile.birth_date ?? ""} onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })} />
                </div>
                <div className="space-y-2 rounded-xl border border-border p-3">
                  <p className="text-xs font-medium text-foreground">New gallery photo alerts</p>
                  <label className="flex items-center justify-between text-sm text-foreground">
                    SMS notifications
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={profile.sms_gallery_opt_in} onChange={(e) => setProfile({ ...profile, sms_gallery_opt_in: e.target.checked })} />
                  </label>
                  <label className="flex items-center justify-between text-sm text-foreground">
                    Email notifications
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={profile.email_gallery_opt_in} onChange={(e) => setProfile({ ...profile, email_gallery_opt_in: e.target.checked })} />
                  </label>
                </div>
                <Button onClick={savePersonal} disabled={savingPersonal} className="w-full">
                  {savingPersonal && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Personal Details
                </Button>
              </TabsContent>

              {/* CHURCH */}
              <TabsContent value="church" className="space-y-4 mt-4 rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Church className="h-4 w-4 text-primary" /> Church Membership
                </h2>
                <div className="space-y-2">
                  <Label className="text-xs">Are you a WBMC Church Member?</Label>
                  <RadioGroup
                    value={profile.is_wbmc_member ? "yes" : "no"}
                    onValueChange={(v) => setProfile({ ...profile, is_wbmc_member: v === "yes" })}
                    className="grid grid-cols-2 gap-2"
                  >
                    <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm cursor-pointer hover:border-primary">
                      <RadioGroupItem value="yes" /> Yes, I'm a member
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm cursor-pointer hover:border-primary">
                      <RadioGroupItem value="no" /> Not yet
                    </label>
                  </RadioGroup>
                </div>

                {!profile.is_wbmc_member && (
                  <div className="space-y-2 animate-in fade-in">
                    <Label className="text-xs">Would you like to become a member?</Label>
                    <RadioGroup
                      value={profile.membership_status === "pending" ? "yes" : "no"}
                      onValueChange={(v) => setProfile({ ...profile, membership_status: v === "yes" ? "pending" : "none" })}
                      className="grid grid-cols-2 gap-2"
                    >
                      <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm cursor-pointer hover:border-primary">
                        <RadioGroupItem value="yes" /> Yes, apply
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm cursor-pointer hover:border-primary">
                        <RadioGroupItem value="no" /> Not now
                      </label>
                    </RadioGroup>
                  </div>
                )}

                {profile.membership_status !== "none" && (
                  <div className="text-xs text-muted-foreground">
                    Current application status: <span className="font-medium text-foreground">{profile.membership_status}</span>
                  </div>
                )}

                {(profile.is_wbmc_member || profile.membership_status === "pending") && (
                <div className="pt-2 space-y-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Membership Details</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cell number</Label>
                      <Input value={membership.cell_number} onChange={(e) => setMembership({ ...membership, cell_number: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Work number</Label>
                      <Input value={membership.work_number} onChange={(e) => setMembership({ ...membership, work_number: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Date of birth</Label>
                      <Input type="date" value={membership.date_of_birth} onChange={(e) => setMembership({ ...membership, date_of_birth: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Gender</Label>
                      <Select value={membership.gender} onValueChange={(v) => setMembership({ ...membership, gender: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Marital status</Label>
                    <Select value={membership.marital_status} onValueChange={(v) => setMembership({ ...membership, marital_status: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {MARITAL_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Address</Label>
                    <Textarea rows={2} value={membership.address} onChange={(e) => setMembership({ ...membership, address: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">City</Label>
                      <Input value={membership.city} onChange={(e) => setMembership({ ...membership, city: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Postal code</Label>
                      <Input value={membership.postal_code} onChange={(e) => setMembership({ ...membership, postal_code: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Previous church</Label>
                    <Input value={membership.previous_church} onChange={(e) => setMembership({ ...membership, previous_church: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Have you been baptised?</Label>
                    <RadioGroup
                      value={membership.is_baptized === null ? "" : membership.is_baptized ? "yes" : "no"}
                      onValueChange={(v) => setMembership({ ...membership, is_baptized: v === "yes" })}
                      className="grid grid-cols-2 gap-2"
                    >
                      <label className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                        <RadioGroupItem value="yes" /> Yes
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                        <RadioGroupItem value="no" /> No
                      </label>
                    </RadioGroup>
                  </div>

                  {membership.is_baptized === false && (
                    <div className="space-y-2 animate-in fade-in">
                      <Label className="text-xs">Would you like to be baptised?</Label>
                      <RadioGroup
                        value={membership.wants_baptism === null ? "" : membership.wants_baptism ? "yes" : "no"}
                        onValueChange={(v) => setMembership({ ...membership, wants_baptism: v === "yes" })}
                        className="grid grid-cols-2 gap-2"
                      >
                        <label className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                          <RadioGroupItem value="yes" /> Yes
                        </label>
                        <label className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                          <RadioGroupItem value="no" /> No
                        </label>
                      </RadioGroup>
                    </div>
                  )}
                </div>
                )}



                <Button onClick={saveMembership} disabled={savingMembership} className="w-full">
                  {savingMembership && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Church Membership
                </Button>
              </TabsContent>

              {/* MENTORSHIP */}
              <TabsContent value="mentorship" className="space-y-4 mt-4 rounded-2xl border border-border bg-card p-5">
                {!profile.is_wbmc_member && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                    Mentors and mentees must be WBMC church members. Update your status in the <strong>Church</strong> tab to participate.
                  </div>
                )}
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-primary" /> Mentorship Programme
                  </h2>

                  <div className="space-y-2">
                    <Label className="text-xs">How would you like to participate?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setMentorshipRole("mentor")}
                        className={`rounded-xl border-2 p-3 text-left transition-all hover:border-primary ${mentorshipRole === "mentor" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <Handshake className="h-5 w-5 text-primary mb-1.5" />
                        <div className="font-semibold text-sm">Mentor</div>
                        <div className="text-xs text-muted-foreground">Guide and support others</div>
                      </button>
                      <button type="button" onClick={() => setMentorshipRole("mentee")}
                        className={`rounded-xl border-2 p-3 text-left transition-all hover:border-primary ${mentorshipRole === "mentee" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <GraduationCap className="h-5 w-5 text-primary mb-1.5" />
                        <div className="font-semibold text-sm">Mentee</div>
                        <div className="text-xs text-muted-foreground">Learn and grow with a mentor</div>
                      </button>
                    </div>
                  </div>

                  {mentorshipRole === "mentor" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Profession / Occupation</Label>
                        <Input value={mentorData.profession} onChange={(e) => setMentorData({ ...mentorData, profession: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Company</Label>
                          <Input value={mentorData.company} onChange={(e) => setMentorData({ ...mentorData, company: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Years of Experience</Label>
                          <Input value={mentorData.years_experience} onChange={(e) => setMentorData({ ...mentorData, years_experience: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Short Biography</Label>
                        <Textarea rows={3} value={mentorData.bio} onChange={(e) => setMentorData({ ...mentorData, bio: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Church interests</Label>
                        <Textarea rows={2} value={mentorData.interest_church} onChange={(e) => setMentorData({ ...mentorData, interest_church: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Workplace interests</Label>
                        <Textarea rows={2} value={mentorData.interest_work} onChange={(e) => setMentorData({ ...mentorData, interest_work: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Community interests</Label>
                        <Textarea rows={2} value={mentorData.interest_community} onChange={(e) => setMentorData({ ...mentorData, interest_community: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Personal strengths</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {STRENGTH_OPTIONS.map((s) => (
                            <label key={s} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                              <Checkbox checked={mentorData.strengths.includes(s)} onCheckedChange={() => setMentorData({ ...mentorData, strengths: toggleList(mentorData.strengths, s) })} />
                              {s}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Mentees per week</Label>
                        <Select value={mentorData.capacity_per_week} onValueChange={(v) => setMentorData({ ...mentorData, capacity_per_week: v })}>
                          <SelectTrigger><SelectValue placeholder="Select capacity" /></SelectTrigger>
                          <SelectContent>
                            {["1","2","3","4","5+","Flexible"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Time per session</Label>
                        <Select value={mentorData.time_per_session} onValueChange={(v) => setMentorData({ ...mentorData, time_per_session: v })}>
                          <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                          <SelectContent>
                            {["20 minutes","30 minutes","45 minutes","1 hour"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Preferred mentoring methods</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {METHOD_OPTIONS.map((m) => (
                            <label key={m} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                              <Checkbox checked={mentorData.methods.includes(m)} onCheckedChange={() => setMentorData({ ...mentorData, methods: toggleList(mentorData.methods, m) })} />
                              {m}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {mentorshipRole === "mentee" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="space-y-2">
                        <Label className="text-xs">Current status</Label>
                        <RadioGroup value={menteeData.current_status} onValueChange={(v) => setMenteeData({ ...menteeData, current_status: v })} className="grid grid-cols-2 gap-2">
                          {STATUS_OPTIONS.map((s) => (
                            <label key={s} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                              <RadioGroupItem value={s} /> {s}
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      {menteeData.current_status === "Studying" && (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Institution</Label>
                            <Input value={menteeData.institution} onChange={(e) => setMenteeData({ ...menteeData, institution: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Qualification</Label>
                            <Input value={menteeData.qualification} onChange={(e) => setMenteeData({ ...menteeData, qualification: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Current level</Label>
                            <Select value={menteeData.current_level} onValueChange={(v) => setMenteeData({ ...menteeData, current_level: v })}>
                              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                              <SelectContent>
                                {LEVEL_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {menteeData.current_status === "Unemployed" && (
                        <div className="space-y-3 animate-in fade-in">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Highest qualification</Label>
                            <Input value={menteeData.highest_qualification} onChange={(e) => setMenteeData({ ...menteeData, highest_qualification: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Field of study</Label>
                            <Input value={menteeData.field_of_study} onChange={(e) => setMenteeData({ ...menteeData, field_of_study: e.target.value })} />
                          </div>
                        </div>
                      )}

                      {menteeData.current_status === "Business Owner" && (
                        <div className="space-y-1.5 animate-in fade-in">
                          <Label className="text-xs">Tell us about your business</Label>
                          <Textarea rows={3} value={menteeData.business_description} onChange={(e) => setMenteeData({ ...menteeData, business_description: e.target.value })} />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs">Home interests</Label>
                        <Textarea rows={2} value={menteeData.interest_home} onChange={(e) => setMenteeData({ ...menteeData, interest_home: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">School / Work interests</Label>
                        <Textarea rows={2} value={menteeData.interest_work} onChange={(e) => setMenteeData({ ...menteeData, interest_work: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Church interests</Label>
                        <Textarea rows={2} value={menteeData.interest_church} onChange={(e) => setMenteeData({ ...menteeData, interest_church: e.target.value })} />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Mentorship goals</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {GOAL_OPTIONS.map((g) => (
                            <label key={g} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                              <Checkbox checked={menteeData.goals.includes(g)} onCheckedChange={() => setMenteeData({ ...menteeData, goals: toggleList(menteeData.goals, g) })} />
                              {g}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Additional information</Label>
                        <Textarea rows={3} value={menteeData.additional_info} onChange={(e) => setMenteeData({ ...menteeData, additional_info: e.target.value })} />
                      </div>
                    </div>
                  )}

                  <Button onClick={saveMentorship} disabled={savingMentorship} className="w-full">
                    {savingMentorship && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Mentorship Details
                  </Button>
                </TabsContent>
            </Tabs>

            <Button variant="outline" className="w-full"
              onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
              Sign out
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
