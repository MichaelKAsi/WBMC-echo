import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { GoogleAuthButton, AuthDivider } from "@/components/GoogleAuthButton";
import {
  Loader2,
  Upload,
  Store,
  CheckCircle2,
  Info,
  ArrowLeft,
  ArrowRight,
  Church,
  UserRound,
  CalendarIcon,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Baby,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SignUpStep = "basic" | "membership" | "mentorship" | "submitting";

type MentorshipRole = "mentor" | "mentee";

interface MentorDetails {
  profession: string;
  company: string;
  years_experience: string;
  bio: string;
  interest_church: string;
  interest_work: string;
  interest_community: string;
  strengths: string[];
  capacity_per_week: string;
  time_per_session: string;
  methods: string[];
}

interface MenteeDetails {
  current_status: string; // Studying / Employed / Unemployed / Business Owner / Other
  institution: string;
  qualification: string;
  current_level: string;
  highest_qualification: string;
  field_of_study: string;
  business_description: string;
  interest_home: string;
  interest_work: string;
  interest_church: string;
  goals: string[];
  additional_info: string;
}

const emptyMentor: MentorDetails = {
  profession: "",
  company: "",
  years_experience: "",
  bio: "",
  interest_church: "",
  interest_work: "",
  interest_community: "",
  strengths: [],
  capacity_per_week: "",
  time_per_session: "",
  methods: [],
};

const emptyMentee: MenteeDetails = {
  current_status: "",
  institution: "",
  qualification: "",
  current_level: "",
  highest_qualification: "",
  field_of_study: "",
  business_description: "",
  interest_home: "",
  interest_work: "",
  interest_church: "",
  goals: [],
  additional_info: "",
};

const STRENGTH_OPTIONS = ["Leadership", "Business", "Teaching", "Technology", "Finance", "Counselling", "Entrepreneurship"];
const METHOD_OPTIONS = ["In Person", "Online", "WhatsApp", "Phone Calls", "Either"];
const GOAL_OPTIONS = [
  "Career Guidance",
  "Entrepreneurship",
  "Spiritual Growth",
  "Leadership",
  "Financial Literacy",
  "Education",
  "Personal Development",
  "Technology",
  "Relationships",
  "Other",
];
const LEVEL_OPTIONS = ["High School", "Certificate", "Diploma", "Degree", "Honours", "Masters", "Other"];
const STATUS_OPTIONS = ["Studying", "Employed", "Unemployed", "Business Owner", "Other"];

const currentYear = new Date().getFullYear();

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<SignUpStep>("basic");
  const [isKidsAccount, setIsKidsAccount] = useState(false);

  // Parent details (kids only)
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up basic fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // dd/mm/yyyy
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Membership decisions
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [wantsToBecomeMember, setWantsToBecomeMember] = useState<boolean | null>(null);
  const [wantsMentorship, setWantsMentorship] = useState<boolean | null>(null);

  // Merchant (member only)
  const [wantsMerchant, setWantsMerchant] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Mentorship details
  const [mentorshipRole, setMentorshipRole] = useState<MentorshipRole | null>(null);
  const [mentorData, setMentorData] = useState<MentorDetails>(emptyMentor);
  const [menteeData, setMenteeData] = useState<MenteeDetails>(emptyMentee);

  // Consent
  const [consentAccurate, setConsentAccurate] = useState(false);
  const [consentRespect, setConsentRespect] = useState(false);
  const [consentMember, setConsentMember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { toast } = useToast();

  const resetAll = () => {
    setIsSignUp(false);
    setStep("basic");
    setIsKidsAccount(false);
    setParentName(""); setParentEmail(""); setParentPhone("");
    setEmail(""); setPassword("");
    setFirstName(""); setLastName(""); setBirthDate(""); setPhone(""); setAddress("");
    setConfirmPassword("");
    setIsMember(null); setWantsToBecomeMember(null); setWantsMentorship(null);
    setWantsMerchant(false); setProofFile(null);
    setMentorshipRole(null);
    setMentorData(emptyMentor); setMenteeData(emptyMentee);
    setConsentAccurate(false); setConsentRespect(false); setConsentMember(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "You are now signed in." });
      onOpenChange(false);
      resetAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const validateBasic = (): string | null => {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    const m = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return "Enter birth date as dd/mm/yyyy";
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const d = new Date(year, month - 1, day);
    if (
      d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day ||
      year < 1900 || year > currentYear || d > new Date()
    ) return "Enter a valid birth date";
    if (!email.trim()) return "Email is required";
    if (!phone.trim()) return "Phone number is required";
    if (!isKidsAccount && !address.trim()) return "Address is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const goToMembershipStep = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateBasic();
    if (err) {
      toast({ title: "Please check the form", description: err, variant: "destructive" });
      return;
    }
    if (isKidsAccount) {
      if (!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()) {
        toast({ title: "Parent details required", description: "Please provide the parent or guardian's full name, email, and phone number.", variant: "destructive" });
        return;
      }
      void finalizeSignUp();
      return;
    }
    setStep("membership");
  };

  const proceedFromMembership = () => {
    if (isMember === null) {
      toast({ title: "Please answer", description: "Let us know if you're currently a WBMC Church Member.", variant: "destructive" });
      return;
    }
    if (isMember === false && wantsToBecomeMember === null) {
      toast({ title: "Please answer", description: "Would you like to become a WBMC Church Member?", variant: "destructive" });
      return;
    }
    const mentorshipEligible = isMember === true || wantsToBecomeMember === true;
    if (mentorshipEligible && wantsMentorship === null) {
      toast({ title: "Please answer", description: "Let us know if you'd like to join the Youth Mentorship Programme.", variant: "destructive" });
      return;
    }
    if (wantsMentorship) {
      setStep("mentorship");
    } else {
      void finalizeSignUp();
    }
  };

  const validateMentorship = (): string | null => {
    if (!mentorshipRole) return "Please choose Mentor or Mentee";
    if (mentorshipRole === "mentor") {
      if (!mentorData.profession.trim()) return "Profession is required";
      if (!mentorData.bio.trim()) return "Please share a short biography";
      if (mentorData.strengths.length === 0) return "Pick at least one strength";
      if (!mentorData.capacity_per_week) return "Select your mentorship capacity";
      if (!mentorData.time_per_session) return "Select how much time you can give per session";
      if (mentorData.methods.length === 0) return "Choose at least one mentoring method";
    } else {
      if (!menteeData.current_status) return "Please tell us your current status";
      if (menteeData.current_status === "Studying" && (!menteeData.institution.trim() || !menteeData.qualification.trim() || !menteeData.current_level)) {
        return "Please complete your study details";
      }
      if (menteeData.current_status === "Unemployed" && (!menteeData.highest_qualification.trim() || !menteeData.field_of_study.trim())) {
        return "Please share your qualification and field of study";
      }
      if (menteeData.current_status === "Business Owner" && !menteeData.business_description.trim()) {
        return "Please tell us about your business";
      }
      if (menteeData.goals.length === 0) return "Choose at least one mentorship goal";
    }
    if (!consentAccurate || !consentRespect) return "Please tick the consent boxes to continue";
    if (wantsToBecomeMember && !consentMember) return "Please confirm you'll also be registered as a WBMC Church Member";
    return null;
  };

  const finalizeSignUp = async () => {
    // If the user is going through the mentorship step, validate first
    if (wantsMentorship) {
      const err = validateMentorship();
      if (err) {
        toast({ title: "A few things to complete", description: err, variant: "destructive" });
        return;
      }
    } else if (!isKidsAccount) {
      if (!consentAccurate || !consentRespect) {
        toast({ title: "Consent required", description: "Please tick the consent boxes before submitting.", variant: "destructive" });
        return;
      }
      if (wantsToBecomeMember && !consentMember) {
        toast({ title: "Consent required", description: "Please confirm you'll also be registered as a WBMC Church Member.", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      const becomesMember = isMember === true || wantsToBecomeMember === true || wantsMentorship === true;
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName,
            birth_date: (() => {
              const m = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
              return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
            })(),
            phone_number: phone,
            is_wbmc_member: becomesMember,
            wants_mentorship: wantsMentorship === true,
            mentorship_role: wantsMentorship ? mentorshipRole : "",
            is_kids_account: isKidsAccount,
            parent_full_name: isKidsAccount ? parentName : "",
            parent_email: isKidsAccount ? parentEmail : "",
            parent_phone: isKidsAccount ? parentPhone : "",
          },
          emailRedirectTo: "https://wbmc.netlify.app/",
        },
      });
      if (error) throw error;

      const userId = signUpData.user?.id;

      if (userId) {
        const updates: Record<string, any> = {};
        if (!isKidsAccount && address.trim()) updates.address = address;

        // If user is becoming a member (not already), capture a pending membership application
        if (!isMember && wantsToBecomeMember) {
          updates.membership_status = "pending";
          updates.membership_applied_at = new Date().toISOString();
          updates.membership_application_data = {
            address,
            source: "registration",
            via: wantsMentorship ? "mentorship_signup" : "self_signup",
          };
        }

        if (isMember && wantsMerchant) {
          updates.wants_merchant = true;
          updates.merchant_status = "pending";
        }

        if (wantsMentorship && mentorshipRole) {
          updates.wants_mentorship = true;
          updates.mentorship_role = mentorshipRole;
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from("profiles").update(updates).eq("user_id", userId);
        }

        // Sign-in immediately so RLS-protected inserts/RPC succeed
        if (!signUpData.session) {
          await supabase.auth.signInWithPassword({ email, password });
        }

        // Self-assign church_member role if applicable
        if (becomesMember) {
          try { await supabase.rpc("add_self_mentorship_role", { _role: "church_member" as any }); } catch {}
        }

        // Mentorship application record + role
        if (wantsMentorship && mentorshipRole) {
          try { await supabase.rpc("add_self_mentorship_role", { _role: mentorshipRole as any }); } catch {}
          const details =
            mentorshipRole === "mentor"
              ? { ...mentorData }
              : { ...menteeData };
          await supabase.from("mentorship_applications").insert({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            role: mentorshipRole,
            bio: mentorshipRole === "mentor" ? mentorData.bio : menteeData.additional_info,
            interests:
              mentorshipRole === "mentor"
                ? [mentorData.interest_church, mentorData.interest_work, mentorData.interest_community].filter(Boolean).join(" | ")
                : [menteeData.interest_home, menteeData.interest_work, menteeData.interest_church].filter(Boolean).join(" | "),
            details,
            status: "pending",
          });
        }

        // Upload proof of payment if merchant + file
        if (isMember && wantsMerchant && proofFile) {
          const ext = proofFile.name.split(".").pop();
          const path = `${userId}/payment-proof.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("payment-proofs")
            .upload(path, proofFile, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
            await supabase.from("profiles").update({ merchant_payment_proof_url: urlData.publicUrl }).eq("user_id", userId);
          }
        }
      }

      // Sync contact to HubSpot CRM (fire-and-forget)
      supabase.functions
        .invoke("hubspot-create-contact", {
          body: {
            email, firstName, lastName, phone,
            properties: {
              lifecyclestage: "lead",
              hs_lead_status: isMember || wantsToBecomeMember ? "OPEN_DEAL" : "NEW",
            },
          },
        })
        .catch((err) => console.warn("HubSpot sync failed:", err));

      toast({
        title: `Welcome, ${firstName}!`,
        description: wantsMentorship
          ? "Your Echo account is ready. Your mentorship application has been submitted."
          : "Your Echo account is ready.",
      });
      onOpenChange(false);
      resetAll();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ---------- RENDER ----------

  const renderSignIn = () => (
    <form onSubmit={handleSignIn} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label htmlFor="authEmail">Email</Label>
        <Input id="authEmail" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="authPassword">Password</Label>
        <Input id="authPassword" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Sign In
      </Button>
      <AuthDivider />
      <GoogleAuthButton />
      <div className="text-center">
        <button type="button" onClick={() => setForgotOpen(true)} className="text-sm text-primary hover:underline">
          Forgot password?
        </button>
      </div>
    </form>
  );

  const renderBasic = () => (
    <form onSubmit={goToMembershipStep} className="space-y-4 mt-2">
      <GoogleAuthButton label="Sign up with Google" />
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or with email</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Surname</Label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthDate">Birth Date</Label>
        <div className="flex gap-2">
          <Input
            id="birthDate"
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/yyyy"
            maxLength={10}
            value={birthDate}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
              let formatted = digits;
              if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
              else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
              setBirthDate(formatted);
            }}
            required
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Pick birth date">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                captionLayout="dropdown-buttons"
                fromYear={1900}
                toYear={currentYear}
                selected={(() => {
                  const m = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                  if (!m) return undefined;
                  const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
                  return isNaN(d.getTime()) ? undefined : d;
                })()}
                onSelect={(d) => {
                  if (!d) return;
                  setBirthDate(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
                }}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="authEmail">Email Address</Label>
        <Input id="authEmail" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" placeholder="e.g. 0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      {!isKidsAccount && (
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, suburb, city" required />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="authPassword">Password</Label>
          <Input id="authPassword" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <Baby className="h-4 w-4 text-primary" />
          <span className="text-sm">This account is for a child</span>
        </div>
        <Switch checked={isKidsAccount} onCheckedChange={setIsKidsAccount} />
      </div>

      {isKidsAccount && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-1">
          <p className="font-semibold text-sm">Parent / Guardian Details</p>
          <div className="space-y-2">
            <Label htmlFor="parentName">Parent / Guardian Full Name</Label>
            <Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentEmail">Parent Email</Label>
            <Input id="parentEmail" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentPhone">Parent Phone</Label>
            <Input id="parentPhone" type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} required />
          </div>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {isKidsAccount ? "Create Kids Account" : (<>Continue <ArrowRight className="h-4 w-4 ml-1" /></>)}
      </Button>
    </form>
  );

  const YesNo = ({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) => (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "rounded-xl border-2 p-3 text-sm font-medium transition-all hover:border-primary",
          value === true ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-xl border-2 p-3 text-sm font-medium transition-all hover:border-primary",
          value === false ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        No
      </button>
    </div>
  );

  const renderMembership = () => (
    <div className="space-y-5 mt-2">
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Church className="h-4 w-4 text-primary" /> Are you currently a WBMC Church Member?</Label>
        <YesNo value={isMember} onChange={(v) => { setIsMember(v); if (v) setWantsToBecomeMember(null); }} />
      </div>

      {isMember === false && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
          <Label>Would you like to become a WBMC Church Member?</Label>
          <YesNo value={wantsToBecomeMember} onChange={setWantsToBecomeMember} />
        </div>
      )}

      {(isMember === true || wantsToBecomeMember === true) && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
          <Label className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-primary" /> Would you like to join the WBMC Youth Mentorship Programme?</Label>
          <YesNo value={wantsMentorship} onChange={setWantsMentorship} />
        </div>
      )}

      {isMember === true && (
        <div className="rounded-xl border border-border p-4 bg-muted/30 space-y-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <Label htmlFor="merchantSwitch" className="font-medium cursor-pointer">Sell on Marketplace</Label>
            </div>
            <Switch id="merchantSwitch" checked={wantsMerchant} onCheckedChange={setWantsMerchant} />
          </div>
          {wantsMerchant && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed">
                A once-off <span className="font-semibold text-foreground">R200</span> registration fee is required to sell on the marketplace —
                a fundraising initiative supporting the Church Land Pursuit.
                <div className="mt-2 text-foreground">
                  <p className="font-medium">Land Account</p>
                  <p>EFT: FNB Cheque — 62794643504 — Branch 250655</p>
                  <p>Reference: <span className="font-medium">Media [Your Name]</span></p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Upload proof of payment</Label>
                <div className="relative">
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                    {proofFile ? (
                      <><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /><span className="truncate text-foreground">{proofFile.name}</span></>
                    ) : (
                      <><Upload className="h-4 w-4 shrink-0" /><span>Tap to upload (image or PDF)</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consent + submit when mentorship = No */}
      {wantsMentorship === false && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
          <ConsentBlock
            consentAccurate={consentAccurate} setConsentAccurate={setConsentAccurate}
            consentRespect={consentRespect} setConsentRespect={setConsentRespect}
            consentMember={consentMember} setConsentMember={setConsentMember}
            showMemberConsent={!!wantsToBecomeMember}
          />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setStep("basic")} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button type="button" onClick={proceedFromMembership} disabled={loading} className="flex-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {wantsMentorship ? (<>Continue <ArrowRight className="h-4 w-4 ml-1" /></>) : "Create Account"}
        </Button>
      </div>
    </div>
  );

  const toggleList = (list: string[], val: string): string[] =>
    list.includes(val) ? list.filter((v) => v !== val) : [...list, val];

  const renderMentorship = () => (
    <div className="space-y-5 mt-2">
      <div className="space-y-2">
        <Label>How would you like to participate?</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMentorshipRole("mentor")}
            className={cn("rounded-xl border-2 p-3 text-left transition-all hover:border-primary", mentorshipRole === "mentor" ? "border-primary bg-primary/5" : "border-border")}
          >
            <Handshake className="h-5 w-5 text-primary mb-1.5" />
            <div className="font-semibold text-sm">Mentor</div>
            <div className="text-xs text-muted-foreground mt-0.5">Guide and support others</div>
          </button>
          <button
            type="button"
            onClick={() => setMentorshipRole("mentee")}
            className={cn("rounded-xl border-2 p-3 text-left transition-all hover:border-primary", mentorshipRole === "mentee" ? "border-primary bg-primary/5" : "border-border")}
          >
            <GraduationCap className="h-5 w-5 text-primary mb-1.5" />
            <div className="font-semibold text-sm">Mentee</div>
            <div className="text-xs text-muted-foreground mt-0.5">Learn and grow with a mentor</div>
          </button>
        </div>
      </div>

      {mentorshipRole === "mentor" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Professional Information</p>
          <div className="space-y-2">
            <Label>Profession / Occupation</Label>
            <Input value={mentorData.profession} onChange={(e) => setMentorData({ ...mentorData, profession: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Company (optional)</Label>
              <Input value={mentorData.company} onChange={(e) => setMentorData({ ...mentorData, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Years of Experience (optional)</Label>
              <Input value={mentorData.years_experience} onChange={(e) => setMentorData({ ...mentorData, years_experience: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Short Biography</Label>
            <Textarea rows={3} placeholder="Tell us a little about yourself." value={mentorData.bio} onChange={(e) => setMentorData({ ...mentorData, bio: e.target.value })} />
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Areas of Interest</p>
          <div className="space-y-2">
            <Label>Church</Label>
            <Textarea rows={2} placeholder="What ministries or church activities are you passionate about?" value={mentorData.interest_church} onChange={(e) => setMentorData({ ...mentorData, interest_church: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Workplace</Label>
            <Textarea rows={2} placeholder="What professional or career interests do you have?" value={mentorData.interest_work} onChange={(e) => setMentorData({ ...mentorData, interest_work: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Community</Label>
            <Textarea rows={2} placeholder="How do you enjoy serving or impacting your community?" value={mentorData.interest_community} onChange={(e) => setMentorData({ ...mentorData, interest_community: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Personal Strengths — what are you known for?</Label>
            <div className="grid grid-cols-2 gap-2">
              {STRENGTH_OPTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                  <Checkbox checked={mentorData.strengths.includes(s)} onCheckedChange={() => setMentorData({ ...mentorData, strengths: toggleList(mentorData.strengths, s) })} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>How many mentees can you mentor each week?</Label>
            <Select value={mentorData.capacity_per_week} onValueChange={(v) => setMentorData({ ...mentorData, capacity_per_week: v })}>
              <SelectTrigger><SelectValue placeholder="Select capacity" /></SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4", "5+", "Flexible"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>How much time are you willing to give per session?</Label>
            <Select value={mentorData.time_per_session} onValueChange={(v) => setMentorData({ ...mentorData, time_per_session: v })}>
              <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="20 minutes">20 minutes</SelectItem>
                <SelectItem value="30 minutes">30 minutes</SelectItem>
                <SelectItem value="45 minutes">45 minutes</SelectItem>
                <SelectItem value="1 hour">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Preferred Mentoring Method</Label>
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
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="space-y-2">
            <Label>Current Status</Label>
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
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input value={menteeData.institution} onChange={(e) => setMenteeData({ ...menteeData, institution: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input value={menteeData.qualification} onChange={(e) => setMenteeData({ ...menteeData, qualification: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Current Level</Label>
                <Select value={menteeData.current_level} onValueChange={(v) => setMenteeData({ ...menteeData, current_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {menteeData.current_status === "Unemployed" && (
            <div className="space-y-3 animate-in fade-in">
              <div className="space-y-2">
                <Label>Highest Qualification</Label>
                <Input value={menteeData.highest_qualification} onChange={(e) => setMenteeData({ ...menteeData, highest_qualification: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input value={menteeData.field_of_study} onChange={(e) => setMenteeData({ ...menteeData, field_of_study: e.target.value })} />
              </div>
            </div>
          )}

          {menteeData.current_status === "Business Owner" && (
            <div className="space-y-2 animate-in fade-in">
              <Label>Tell us more about your business</Label>
              <Textarea rows={3} value={menteeData.business_description} onChange={(e) => setMenteeData({ ...menteeData, business_description: e.target.value })} />
            </div>
          )}

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interests</p>
          <div className="space-y-2">
            <Label>Home</Label>
            <Textarea rows={2} placeholder="What interests or hobbies do you enjoy at home?" value={menteeData.interest_home} onChange={(e) => setMenteeData({ ...menteeData, interest_home: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>School / Work</Label>
            <Textarea rows={2} placeholder="What subjects, career fields or skills interest you?" value={menteeData.interest_work} onChange={(e) => setMenteeData({ ...menteeData, interest_work: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Church</Label>
            <Textarea rows={2} placeholder="What church ministries or activities interest you?" value={menteeData.interest_church} onChange={(e) => setMenteeData({ ...menteeData, interest_church: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Mentorship Goals</Label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((g) => (
                <label key={g} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:border-primary">
                  <Checkbox checked={menteeData.goals.includes(g)} onCheckedChange={() => setMenteeData({ ...menteeData, goals: toggleList(menteeData.goals, g) })} />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Information</Label>
            <Textarea rows={3} placeholder="What would you like your mentor to know about you?" value={menteeData.additional_info} onChange={(e) => setMenteeData({ ...menteeData, additional_info: e.target.value })} />
          </div>
        </div>
      )}

      {mentorshipRole && (
        <ConsentBlock
          consentAccurate={consentAccurate} setConsentAccurate={setConsentAccurate}
          consentRespect={consentRespect} setConsentRespect={setConsentRespect}
          consentMember={consentMember} setConsentMember={setConsentMember}
          showMemberConsent={!!wantsToBecomeMember}
        />
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setStep("membership")} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button type="button" onClick={finalizeSignUp} disabled={loading} className="flex-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create Account
        </Button>
      </div>
    </div>
  );

  const stepTitle = !isSignUp
    ? "Sign In"
    : step === "basic" ? (isKidsAccount ? "Create Kids Account" : "Create Account")
    : step === "membership" ? "Church & Mentorship"
    : "Mentorship Programme";

  const stepDesc = !isSignUp
    ? "Sign in to your Echo account."
    : step === "basic" ? "Step 1 — Your personal details"
    : step === "membership" ? "Step 2 — Tell us about your connection to WBMC"
    : "Step 3 — Tell us about you so we can match the right mentor or mentee";

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetAll(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitle}</DialogTitle>
          <DialogDescription>{stepDesc}</DialogDescription>
        </DialogHeader>

        {!isSignUp && renderSignIn()}
        {isSignUp && step === "basic" && renderBasic()}
        {isSignUp && step === "membership" && renderMembership()}
        {isSignUp && step === "mentorship" && renderMentorship()}

        <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />

        <div className="text-center text-sm text-muted-foreground pt-2">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setStep("basic"); setIsKidsAccount(false); }}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConsentBlock({
  consentAccurate, setConsentAccurate,
  consentRespect, setConsentRespect,
  consentMember, setConsentMember,
  showMemberConsent,
}: {
  consentAccurate: boolean; setConsentAccurate: (v: boolean) => void;
  consentRespect: boolean; setConsentRespect: (v: boolean) => void;
  consentMember: boolean; setConsentMember: (v: boolean) => void;
  showMemberConsent: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <Checkbox checked={consentAccurate} onCheckedChange={(v) => setConsentAccurate(!!v)} className="mt-0.5" />
        I confirm that the information provided is accurate.
      </label>
      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <Checkbox checked={consentRespect} onCheckedChange={(v) => setConsentRespect(!!v)} className="mt-0.5" />
        I agree to participate respectfully in the WBMC Youth Mentorship Programme.
      </label>
      {showMemberConsent && (
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox checked={consentMember} onCheckedChange={(v) => setConsentMember(!!v)} className="mt-0.5" />
          I understand that by continuing, I will also be registered as a WBMC Church Member.
        </label>
      )}
    </div>
  );
}
