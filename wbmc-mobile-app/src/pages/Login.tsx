import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import echoLogo from "@/assets/echo-logo-blue.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { canAccessAdmin, user, loading: roleLoading } = useUserRole();
  const [forgotOpen, setForgotOpen] = useState(false);
  const { toast } = useToast();

  // Redirect if already logged in and has access
  useEffect(() => {
    if (!roleLoading && user && canAccessAdmin) {
      navigate("/admin");
    }
  }, [roleLoading, user, canAccessAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Role check will happen via useEffect after auth state updates
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col">
      <header className="p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-sm shadow-elevated">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <img src={echoLogo} alt="WBMC Logo" className="h-24 w-24 object-contain" />
            </div>
            <CardTitle className="text-xl">Admin Login</CardTitle>
            <CardDescription>Sign in to access the media dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="admin@wbmc.co.za" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setForgotOpen(true)} className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            </form>
            <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
