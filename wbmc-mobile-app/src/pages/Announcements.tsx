import { useNavigate } from "react-router-dom";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Megaphone, Bell, Loader2 } from "lucide-react";
import { format } from "date-fns";

const Announcements = () => {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useAnnouncements();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold text-foreground">Announcements & Reminders</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <Megaphone className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No announcements yet. Check back soon!</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-56px)]">
          <div className="px-4 py-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 shadow-card">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="w-full object-contain" />
                )}
                <div className="p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    {item.type === "reminder" ? <Bell className="h-5 w-5 text-primary" /> : <Megaphone className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {item.type} · {format(new Date(item.created_at), "dd MMM yyyy")}
                    </span>
                    <h4 className="text-foreground font-medium mt-0.5">{item.title}</h4>
                    <div
                      className="text-sm text-muted-foreground mt-1 leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default Announcements;
