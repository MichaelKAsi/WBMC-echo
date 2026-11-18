import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav, TabType } from "@/components/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { FeedTab } from "@/components/tabs/FeedTab";
import { GalleryTab } from "@/components/tabs/GalleryTab";
import { BibleTab } from "@/components/tabs/BibleTab";
import { MarketplaceTab } from "@/components/tabs/MarketplaceTab";
import { DifelaTab } from "@/components/tabs/DifelaTab";
import { NewsTab } from "@/components/tabs/NewsTab";
import { PastorsCornerTab } from "@/components/tabs/PastorsCornerTab";
import { SermonLibraryTab } from "@/components/tabs/SermonLibraryTab";
import { MinistriesTab } from "@/components/tabs/MinistriesTab";
import { BuildingFundModal } from "@/components/BuildingFundModal";
import { useVideos } from "@/hooks/useVideos";
import { useGallerySlides } from "@/hooks/useGallerySlides";
import { Church, Sparkles } from "lucide-react";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { useTabBadges } from "@/hooks/useTabBadges";
import { useUserRole } from "@/hooks/useUserRole";
import { BibleForKidsTab } from "@/components/tabs/BibleForKidsTab";
import echoLogo from "@/assets/echo-logo-blue.png";
import { MentorshipPromptModal } from "@/components/MentorshipPromptModal";


const Home = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("bible");
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showPastorsCorner, setShowPastorsCorner] = useState(false);
  const [showSermonLibrary, setShowSermonLibrary] = useState(false);
  const [showMinistries, setShowMinistries] = useState(false);
  const [user, setUser] = useState<SupaUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const { isKids } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    if (!view) return;
    setShowMarketplace(view === "market");
    setShowPastorsCorner(view === "pastor");
    setShowSermonLibrary(view === "sermon");
    setShowMinistries(view === "ministries");
    navigate("/", { replace: true });
  }, [location.search, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => setUser(session?.user ?? null)
    );
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);


  const protectedTabs: TabType[] = ["feed", "news", "gallery"];
  const isLocked = !user && protectedTabs.includes(activeTab);

  const { data: entries = [] } = useVideos();
  const { data: gallerySlides = [] } = useGallerySlides();
  const badges = useTabBadges(activeTab);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const getTabTitle = () => {
    switch (activeTab) {
      case "feed": return "Feed";
      case "news": return "News";
      case "gallery": return "Gallery";
      case "bible": return "Bible";
      case "difela": return "Difela tsa Sione";
      default: return "Echo";
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "feed":
        return <FeedTab entries={entries} />;
      case "news":
        return <NewsTab />;
      case "gallery":
        return <GalleryTab slides={gallerySlides} />;
      case "bible":
        return <BibleTab />;
      case "difela":
        return <DifelaTab />;
      default:
        return <FeedTab entries={entries} />;
    }
  };

  // Kids accounts get a dedicated, restricted UI — only the Bible for Kids page.
  if (isKids) {
    return (
      <>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <div className="min-h-screen bg-background flex flex-col">
          <header className="sticky top-0 z-30 bg-gradient-to-r from-primary to-[hsl(43,90%,55%)] text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-md">
            <img src={echoLogo} alt="Echo" className="h-8 w-8 object-contain bg-background/90 rounded-full p-1" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <h1 className="text-base font-bold leading-tight">Bible for Kids</h1>
              </div>
              <p className="text-[11px] opacity-90 leading-tight">Echo • Word Based Missional Church</p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs font-medium bg-background/15 hover:bg-background/25 px-2.5 py-1 rounded-md transition-colors"
            >
              Sign out
            </button>
          </header>
          <main className="flex-1">
            <BibleForKidsTab />
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <div className="min-h-screen bg-background">
        <AppHeader
          title={showMinistries ? "Ministries" : showSermonLibrary ? "Sermon Library" : showMarketplace ? "Marketplace" : showPastorsCorner ? "Pastor's Corner" : getTabTitle()}
          onNavigateToMarket={() => { setShowMarketplace(true); setShowPastorsCorner(false); setShowSermonLibrary(false); setShowMinistries(false); }}
          onNavigateToPastorsCorner={() => { setShowPastorsCorner(true); setShowMarketplace(false); setShowSermonLibrary(false); setShowMinistries(false); }}
          onNavigateToSermonLibrary={() => { setShowSermonLibrary(true); setShowMarketplace(false); setShowPastorsCorner(false); setShowMinistries(false); }}
          onNavigateToMinistries={() => { setShowMinistries(true); setShowSermonLibrary(false); setShowMarketplace(false); setShowPastorsCorner(false); }}
          onNavigateHome={() => {
            setShowMarketplace(false);
            setShowPastorsCorner(false);
            setShowSermonLibrary(false);
            setShowMinistries(false);
            setActiveTab("bible");
          }}
        />

        {/* Land Fund Banner */}
        <button
          onClick={() => setFundModalOpen(true)}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-primary to-[hsl(43,90%,55%)] flex items-center justify-center gap-2 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Church className="h-4 w-4" />
          Church Land Fund — Tap to see progress
        </button>

        <WelcomeBanner />

        <main className="relative">
          <div className={isLocked ? "blur-md pointer-events-none select-none" : ""} aria-hidden={isLocked}>
            {showMinistries ? <MinistriesTab /> : showSermonLibrary ? <SermonLibraryTab /> : showMarketplace ? <MarketplaceTab /> : showPastorsCorner ? <PastorsCornerTab /> : renderTabContent()}
          </div>
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm z-10 pb-20">
              <div className="text-center px-6">
                <p className="text-foreground font-medium mb-2">Sign in to view {activeTab === "news" ? "News" : activeTab === "feed" ? "Feed" : "Gallery"}</p>
                <p className="text-sm text-muted-foreground">Please log in or create an account to continue.</p>
              </div>
            </div>
          )}
        </main>

        <BottomNav activeTab={activeTab} badges={badges} onTabChange={(tab) => {
          setShowMarketplace(false);
          setShowPastorsCorner(false);
          setShowSermonLibrary(false);
          setShowMinistries(false);
          setActiveTab(tab);
          if (!user && protectedTabs.includes(tab)) {
            setAuthOpen(true);
          }
        }} />
      </div>

      <BuildingFundModal open={fundModalOpen} onOpenChange={setFundModalOpen} />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <MentorshipPromptModal user={user} />
      
      
    </>
  );
};

export default Home;
