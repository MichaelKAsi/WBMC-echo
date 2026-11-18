import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Megaphone, Bell, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export function NewsTab() {
  const { data: items = [], isLoading } = useAnnouncements();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="p-4 space-y-3 pb-20">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Megaphone className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No news yet</h3>
            <p className="text-sm text-muted-foreground">Check back soon for announcements</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 shadow-card"
            >
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="w-full object-contain" />
              )}
              <div className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  {item.type === "reminder" ? (
                    <Bell className="h-5 w-5 text-primary" />
                  ) : (
                    <Megaphone className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {item.type === "reminder" ? "Reminder" : "Announcement"} · {format(new Date(item.created_at), "dd MMM yyyy")}
                  </span>
                  <h4 className="text-foreground font-medium mt-0.5">{item.title}</h4>
                  <div
                    className="text-sm text-muted-foreground mt-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
