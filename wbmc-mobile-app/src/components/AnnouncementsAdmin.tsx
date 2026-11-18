import { useState } from "react";
import { useAnnouncementsAdmin, useAddAnnouncement, useDeleteAnnouncement, useUpdateAnnouncement, Announcement } from "@/hooks/useAnnouncements";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Megaphone, Bell, Star, ArrowUpDown, ImagePlus, X, Pencil, CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/RichTextEditor";
import { cn } from "@/lib/utils";

const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export function AnnouncementsAdmin() {
  const { data: items = [], isLoading } = useAnnouncementsAdmin();
  const addMutation = useAddAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const { user, isAdmin } = useUserRole();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("announcement");
  const [sortOrder, setSortOrder] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setType("announcement");
    setSortOrder("0");
    setIsFeatured(false);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setScheduledDate(undefined);
    setScheduledTime("09:00");
  };

  const startEdit = (item: Announcement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setType(item.type);
    setSortOrder(String(item.sort_order));
    setIsFeatured(item.is_featured);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(item.image_url);
    if (item.scheduled_at) {
      const d = new Date(item.scheduled_at);
      setScheduledDate(d);
      setScheduledTime(format(d, "HH:mm"));
    } else {
      setScheduledDate(undefined);
      setScheduledTime("09:00");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error } = await supabase.storage.from("announcement-images").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("announcement-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!title.trim() || stripHtml(content).trim().length === 0) {
      toast({ title: "Missing fields", description: "Please fill in title and content.", variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      let image_url: string | null = existingImageUrl;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      let scheduled_at: string | null = null;
      if (scheduledDate) {
        const [hours, mins] = scheduledTime.split(":").map(Number);
        const dt = new Date(scheduledDate);
        dt.setHours(hours, mins, 0, 0);
        scheduled_at = dt.toISOString();
      }

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title: title.trim(),
          content: content.trim(),
          type,
          sort_order: parseInt(sortOrder) || 0,
          is_featured: isFeatured,
          image_url,
          scheduled_at,
        });
        toast({ title: "Updated!", description: "Item has been updated." });
      } else {
        const status = isAdmin ? "approved" : "pending";
        await addMutation.mutateAsync({
          title: title.trim(),
          content: content.trim(),
          type,
          sort_order: parseInt(sortOrder) || 0,
          is_featured: isFeatured,
          image_url,
          status,
          submitted_by: user?.id,
          scheduled_at,
        });
        toast({
          title: isAdmin ? (scheduled_at ? "Scheduled!" : "Added!") : "Submitted for approval",
          description: isAdmin
            ? scheduled_at
              ? `Will be published ${format(new Date(scheduled_at), "PPP 'at' p")}`
              : `${type === "reminder" ? "Reminder" : "Announcement"} has been posted.`
            : "Your submission is pending admin approval.",
        });
      }
      resetForm();
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Deleted", description: "Item removed.", variant: "destructive" });
      if (editingId === id) resetForm();
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, is_featured: !currentValue });
      toast({ title: !currentValue ? "Featured" : "Unfeatured", description: `Item ${!currentValue ? "will now appear" : "removed from"} in the home feed.` });
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const isScheduled = (item: Announcement) =>
    item.scheduled_at && new Date(item.scheduled_at) > new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit form */}
      <div className="space-y-4 bg-card border border-border rounded-xl p-4">
        {editingId && (
          <div className="flex items-center justify-between">
            <Badge variant="secondary"><Pencil className="h-3 w-3 mr-1" />Editing Item</Badge>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="ann-type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ann-title">Title</Label>
          <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor content={content} onChange={setContent} placeholder="Write the announcement details..." />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Image (optional)</Label>
          {imagePreview || existingImageUrl ? (
            <div className="relative w-full rounded-lg overflow-hidden border border-border">
              <img src={imagePreview || existingImageUrl || ""} alt="Preview" className="w-full h-40 object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
              <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Tap to add image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ann-sort">Sort Order</Label>
            <Input id="ann-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Feature on Home</Label>
            <div className="flex items-center gap-2 h-10">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              <span className="text-sm text-muted-foreground">{isFeatured ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <Label>Schedule (optional)</Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className={cn("p-3 pointer-events-auto")}
                />
                <div className="px-3 pb-3">
                  <label className="text-xs text-muted-foreground">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full mt-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
              </PopoverContent>
            </Popover>
            {scheduledDate && (
              <Button variant="ghost" size="sm" onClick={() => { setScheduledDate(undefined); setScheduledTime("09:00"); }}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </div>
          {scheduledDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Will publish: {format(scheduledDate, "PPP")} at {scheduledTime}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending || uploading} className="w-full gap-2">
          {(addMutation.isPending || updateMutation.isPending || uploading)
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? "Update" : scheduledDate ? "Schedule" : `Add ${type === "reminder" ? "Reminder" : "Announcement"}`}
        </Button>
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Posted Items</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No announcements or reminders yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
                )}
                <div className="flex items-start gap-3 p-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {item.type === "reminder" ? <Bell className="h-4 w-4 text-primary" /> : <Megaphone className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
                      {item.is_featured && <Star className="h-3 w-3 text-primary fill-primary shrink-0" />}
                      {isScheduled(item) && (
                        <Badge variant="secondary" className="text-[10px] py-0 h-4">
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          {format(new Date(item.scheduled_at!), "dd MMM, HH:mm")}
                        </Badge>
                      )}
                    </div>
                    <div
                      className="text-xs text-muted-foreground line-clamp-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground">{format(new Date(item.created_at), "dd MMM yyyy, HH:mm")}</p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <ArrowUpDown className="h-2.5 w-2.5" /> {item.sort_order}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleFeatured(item.id, item.is_featured)}
                      title={item.is_featured ? "Remove from home" : "Feature on home"}
                    >
                      <Star className={`h-4 w-4 ${item.is_featured ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)} title="Edit">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
