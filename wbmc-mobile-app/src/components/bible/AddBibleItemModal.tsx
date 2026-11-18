import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BookmarkPlus, StickyNote, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAddBibleNote, useAddBibleBookmark } from "@/hooks/useBibleNotes";
import { useToast } from "@/hooks/use-toast";

interface AddBibleItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  bookName: string;
  chapterReference: string;
  chapterId: string;
}

type ItemType = "note" | "bookmark" | null;

export function AddBibleItemModal({ open, onOpenChange, userId, bookName, chapterReference, chapterId }: AddBibleItemModalProps) {
  const [itemType, setItemType] = useState<ItemType>(null);
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("");
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const addNote = useAddBibleNote();
  const addBookmark = useAddBibleBookmark();
  const { toast } = useToast();

  const reset = () => {
    setItemType(null);
    setContent("");
    setLabel("");
    setReminderDate(undefined);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleSaveNote = async () => {
    if (!content.trim()) return;
    await addNote.mutateAsync({
      user_id: userId,
      book_name: bookName,
      chapter_reference: chapterReference,
      chapter_id: chapterId,
      content: content.trim(),
      reminder_date: reminderDate ? format(reminderDate, "yyyy-MM-dd") : null,
    });
    toast({ title: "Note saved!" });
    handleClose(false);
  };

  const handleSaveBookmark = async () => {
    await addBookmark.mutateAsync({
      user_id: userId,
      book_name: bookName,
      chapter_reference: chapterReference,
      chapter_id: chapterId,
      label: label.trim() || null,
      reminder_date: reminderDate ? format(reminderDate, "yyyy-MM-dd") : null,
    });
    toast({ title: "Bookmark saved!" });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {!itemType ? "Add to " + chapterReference : itemType === "note" ? "Add Note" : "Add Bookmark"}
          </DialogTitle>
        </DialogHeader>

        {!itemType ? (
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              onClick={() => setItemType("note")}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
            >
              <StickyNote className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">Note</span>
            </button>
            <button
              onClick={() => setItemType("bookmark")}
              className="flex flex-col items-center gap-2 p-6 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
            >
              <BookmarkPlus className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">Bookmark</span>
            </button>
          </div>
        ) : itemType === "note" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your note for {chapterReference}</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your thoughts..." rows={4} />
            </div>
            <ReminderPicker date={reminderDate} onChange={setReminderDate} />
            <Button onClick={handleSaveNote} disabled={addNote.isPending || !content.trim()} className="w-full gap-2">
              {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
              Save Note
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Favourite verse, Study later..." />
            </div>
            <ReminderPicker date={reminderDate} onChange={setReminderDate} />
            <Button onClick={handleSaveBookmark} disabled={addBookmark.isPending} className="w-full gap-2">
              {addBookmark.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
              Save Bookmark
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReminderPicker({ date, onChange }: { date: Date | undefined; onChange: (d: Date | undefined) => void }) {
  return (
    <div className="space-y-2">
      <Label>Reminder to revisit (optional)</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onChange}
            disabled={(d) => d < new Date()}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
