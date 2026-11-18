import { Link } from "react-router-dom";
import { Home, LogIn, Megaphone, Shield, BookOpen, KeyRound, ArrowLeft } from "lucide-react";

const links = [
  { path: "/", label: "Home", description: "Main feed, gallery, bible, hymns & more", icon: Home },
  { path: "/login", label: "Login", description: "Sign in or create an account", icon: LogIn },
  { path: "/announcements", label: "Announcements", description: "Church announcements & reminders", icon: Megaphone },
  { path: "/admin", label: "Admin Dashboard", description: "Manage content & users (admin only)", icon: Shield },
  { path: "/pastor-admin", label: "Pastor Admin", description: "Pastor's content management", icon: BookOpen },
  { path: "/reset-password", label: "Reset Password", description: "Reset your account password", icon: KeyRound },
];

const Sitemap = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-1">Sitemap</h1>
      <p className="text-sm text-muted-foreground mb-6">All pages available on Echo</p>
      <ul className="space-y-2">
        {links.map(({ path, label, description, icon: Icon }) => (
          <li key={path}>
            <Link
              to={path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:bg-accent transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-medium text-foreground">{label}</span>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default Sitemap;
