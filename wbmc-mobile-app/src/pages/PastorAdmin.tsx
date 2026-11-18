import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminHeader } from "@/components/AdminHeader";
import { PastorAdminTab } from "@/components/admin/PastorAdminTab";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const PastorAdmin = () => {
  const navigate = useNavigate();
  const { user, canAccessPastorAdmin, loading } = useUserRole();

  useEffect(() => {
    if (!loading && (!user || !canAccessPastorAdmin)) {
      navigate("/");
    }
  }, [loading, user, canAccessPastorAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader />
      <ScrollArea className="flex-1">
        <PastorAdminTab />
      </ScrollArea>
    </div>
  );
};

export default PastorAdmin;
