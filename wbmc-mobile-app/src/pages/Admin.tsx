import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { VideoEntryList } from "@/components/VideoEntryList";
import { GalleryEntryForm } from "@/components/GalleryEntryForm";
import { GalleryEntryList } from "@/components/GalleryEntryList";
import { MobilePreview } from "@/components/MobilePreview";
import { BuildingFundAdmin } from "@/components/BuildingFundAdmin";
import { AnnouncementsAdmin } from "@/components/AnnouncementsAdmin";
import { UserManagementTab } from "@/components/admin/UserManagementTab";
import { ContentApprovalTab } from "@/components/admin/ContentApprovalTab";
import { MentorshipApplicationsTab } from "@/components/admin/MentorshipApplicationsTab";
import { GallerySlide } from "@/types/gallery";
import { useToast } from "@/hooks/use-toast";
import { useVideos } from "@/hooks/useVideos";
import { useGallerySlides, useAddGallerySlide, useDeleteGallerySlide } from "@/hooks/useGallerySlides";
import { useUserRole } from "@/hooks/useUserRole";
import { Radio, ImageIcon, Church, Megaphone, Loader2, Eye, Music, Upload, Users, ClipboardCheck, LifeBuoy, HeartHandshake } from "lucide-react";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type AdminTab = "video" | "gallery" | "fund" | "announcements" | "hymns" | "preview" | "users" | "approve" | "mentorship" | "helpdesk";

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("video");
  const [importing, setImporting] = useState(false);
  const { user, isAdmin, canAccessAdmin, loading: roleLoading } = useUserRole();

  // Protect admin route
  useEffect(() => {
    if (!roleLoading && (!user || !canAccessAdmin)) {
      navigate("/");
    }
  }, [roleLoading, user, canAccessAdmin, navigate]);

  const adminTabs = [
    { id: "video" as AdminTab, label: "Video", icon: Radio },
    { id: "gallery" as AdminTab, label: "Gallery", icon: ImageIcon },
    { id: "fund" as AdminTab, label: "Fund", icon: Church },
    { id: "announcements" as AdminTab, label: "News", icon: Megaphone },
    { id: "hymns" as AdminTab, label: "Hymns", icon: Music },
    { id: "preview" as AdminTab, label: "Preview", icon: Eye },
    ...(isAdmin ? [
      { id: "approve" as AdminTab, label: "Approve", icon: ClipboardCheck },
      { id: "users" as AdminTab, label: "Users", icon: Users },
      { id: "mentorship" as AdminTab, label: "Mentors", icon: HeartHandshake },
      { id: "helpdesk" as AdminTab, label: "Helpdesk", icon: LifeBuoy },
    ] : []),

  ];

  const { data: entries = [], isLoading: videosLoading } = useVideos();
  const { data: gallerySlides = [], isLoading: galleryLoading } = useGallerySlides();
  const addGallerySlideMutation = useAddGallerySlide();
  const deleteGallerySlideMutation = useDeleteGallerySlide();

  const handleAddGallerySlide = ({ notify, ...slide }: Omit<GallerySlide, "id" | "createdAt"> & { notify?: boolean }) => {
    const status = isAdmin ? "approved" : "pending";
    addGallerySlideMutation.mutate({ ...slide, status, submitted_by: user?.id }, {
      onSuccess: (row: any) => {
        toast({ title: isAdmin ? "Gallery slide added" : "Submitted for approval", description: isAdmin ? `"${slide.title}" has been added.` : `"${slide.title}" is pending admin approval.` });
        if (isAdmin && notify && row?.id) {
          supabase.functions.invoke("notify-gallery-upload", { body: { slideId: row.id } }).then(({ data, error }) => {
            if (error) toast({ title: "Notifications failed", description: error.message, variant: "destructive" });
            else toast({ title: "Users notified", description: `${data?.smsCount ?? 0} SMS sent, ${data?.emailCount ?? 0} email contacts updated.` });
          });
        }
      },
      onError: () => { toast({ title: "Error", description: "Failed to add gallery slide.", variant: "destructive" }); },
    });
  };

  const handleDeleteGallerySlide = (id: string) => {
    const slide = gallerySlides.find((s) => s.id === id);
    deleteGallerySlideMutation.mutate(id, {
      onSuccess: () => { toast({ title: "Slide removed", description: slide ? `"${slide.title}" removed.` : "Slide removed.", variant: "destructive" }); },
    });
  };

  const handleImportHymns = async () => {
    setImporting(true);
    try {
      const response = await fetch("/Difela_tsa_Sione_Fully_Separated.xlsx");
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => { resolve((reader.result as string).split(",")[1]); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke("import-hymns", { body: { fileBase64: base64, clearExisting: true } });
      if (error) throw error;
      toast({ title: "Hymns imported!", description: `Successfully imported ${data.inserted} hymns.` });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message || "Failed to import hymns", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isLoading = videosLoading || galleryLoading;

  const renderTabContent = () => {
    if (isLoading && activeTab !== "users") {
      return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }
    switch (activeTab) {
      case "video":
        return (
          <div className="p-4 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">YouTube Channel Feed</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{entries.length} {entries.length === 1 ? "video" : "videos"}</span>
              </div>
              <VideoEntryList entries={entries} onDeleteEntry={() => {}} />
            </div>
          </div>
        );
      case "gallery":
        return (
          <div className="p-4 space-y-6">
            <GalleryEntryForm onAddEntry={handleAddGallerySlide} />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Gallery Slides</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{gallerySlides.length} {gallerySlides.length === 1 ? "slide" : "slides"}</span>
              </div>
              <GalleryEntryList entries={gallerySlides} onDeleteEntry={handleDeleteGallerySlide} />
            </div>
          </div>
        );
      case "fund":
        return <div className="p-4"><BuildingFundAdmin /></div>;
      case "hymns":
        return (
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-foreground">Hymns Management</h2>
            <p className="text-sm text-muted-foreground">Import all Difela tsa Sione hymns from the spreadsheet.</p>
            <Button onClick={handleImportHymns} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {importing ? "Importing..." : "Import Hymns from Spreadsheet"}
            </Button>
          </div>
        );
      case "announcements":
        return <div className="p-4"><AnnouncementsAdmin /></div>;
      case "preview":
        return <div className="p-4 flex justify-center"><MobilePreview entries={entries} gallerySlides={gallerySlides} /></div>;
      case "approve":
        return isAdmin ? <ContentApprovalTab /> : null;
      case "users":
        return isAdmin ? <UserManagementTab /> : null;
      case "mentorship":
        return isAdmin ? <MentorshipApplicationsTab /> : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader />
      <ScrollArea className="flex-1 pb-20">{renderTabContent()}</ScrollArea>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-pb z-50">
        <div className="flex items-center justify-around h-16">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => { if (tab.id === "helpdesk") { navigate("/admin/helpdesk"); } else { setActiveTab(tab.id); } }} className={cn("flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Admin;
