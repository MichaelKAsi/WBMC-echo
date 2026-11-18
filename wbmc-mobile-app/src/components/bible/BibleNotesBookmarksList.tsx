import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBibleNotes, useBibleBookmarks, useDeleteBibleNote, useDeleteBibleBookmark, useUpdateBibleNote, useUpdateBibleBookmark, BibleNote, BibleBookmark } from "@/hooks/useBibleNotes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StickyNote, BookmarkPlus, Trash2, Pencil, CalendarIcon, ChevronLeft, Check, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  onNavigateToChapter: (chapterId: string) => void;
  onClose: () => void;
}

type Tab = "notes" | "bookmarks";

export function BibleNotesBookmarksList({ userId, onNavigateToChapter, onClose }: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("notes");
  const { data: notes = [] } = useBibleNotes(userId);
  const { data: bookmarks = [] } = useBibleBookmarks(userId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">My Notes & Bookmarks</span>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("notes")}
          className={cn("flex-1 py-2.5 text-sm font-medium text-center transition-colors", tab === "notes" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
        >
          Notes ({notes.length})
        </button>
        <button
          onClick={() => setTab("bookmarks")}
          className={cn("flex-1 py-2.5 text-sm font-medium text-center transition-colors", tab === "bookmarks" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
        >
          Bookmarks ({bookmarks.length})
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3 pb-20">
          {tab === "notes" ? (
            notes.length === 0 ? (
              <EmptyState icon={<StickyNote className="h-8 w-8 text-muted-foreground" />} text="No notes yet. Open a chapter and tap + to add one." />
            ) : (
              <>
                {notes.slice(0, 5).map((n) => <NoteCard key={n.id} note={n} onNavigate={onNavigateToChapter} />)}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate("/notes")}
                >
                  Show more ({notes.length}) →
                </Button>
              </>
            )
          ) : bookmarks.length === 0 ? (
            <EmptyState icon={<BookmarkPlus className="h-8 w-8 text-muted-foreground" />} text="No bookmarks yet. Open a chapter and tap + to add one." />
          ) : (
            bookmarks.map((b) => <BookmarkCard key={b.id} bookmark={b} onNavigate={onNavigateToChapter} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="text-sm text-muted-foreground mt-2">{text}</p>
    </div>
  );
}

function NoteCard({ note, onNavigate }: { note: BibleNote; onNavigate: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(note.reminder_date ? new Date(note.reminder_date) : undefined);
  const updateNote = useUpdateBibleNote();
  const deleteNote = useDeleteBibleNote();
  const { toast } = useToast();

  const handleSave = async () => {
    await updateNote.mutateAsync({ id: note.id, content, reminder_date: reminderDate ? format(reminderDate, "yyyy-MM-dd") : null });
    toast({ title: "Note updated" });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <button onClick={() => onNavigate(note.chapter_id)} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline">
          <BookOpen className="h-3.5 w-3.5" />
          {note.chapter_reference}
        </button>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(!editing)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteNote.mutate(note.id); toast({ title: "Note deleted" }); }}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="space-y-3">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Reminder</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-full justify-start text-left", !reminderDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                  {reminderDate ? format(reminderDate, "PPP") : "Set reminder"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={reminderDate} onSelect={setReminderDate} disabled={(d) => d < new Date()} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <Button size="sm" onClick={handleSave} disabled={updateNote.isPending} className="w-full gap-1">
            <Check className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{note.content}</p>
          {note.reminder_date && (
            <p className="text-[10px] text-primary flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Reminder: {format(new Date(note.reminder_date), "dd MMM yyyy")}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">{format(new Date(note.created_at), "dd MMM yyyy, HH:mm")}</p>
        </>
      )}
    </div>
  );
}

function BookmarkCard({ bookmark, onNavigate }: { bookmark: BibleBookmark; onNavigate: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(bookmark.label || "");
  const [reminderDate, setReminderDate] = useState<Date | undefined>(bookmark.reminder_date ? new Date(bookmark.reminder_date) : undefined);
  const updateBookmark = useUpdateBibleBookmark();
  const deleteBookmark = useDeleteBibleBookmark();
  const { toast } = useToast();

  const handleSave = async () => {
    await updateBookmark.mutateAsync({ id: bookmark.id, label: label.trim() || null, reminder_date: reminderDate ? format(reminderDate, "yyyy-MM-dd") : null });
    toast({ title: "Bookmark updated" });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <button onClick={() => onNavigate(bookmark.chapter_id)} className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline">
          <BookOpen className="h-3.5 w-3.5" />
          {bookmark.chapter_reference}
        </button>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(!editing)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteBookmark.mutate(bookmark.id); toast({ title: "Bookmark deleted" }); }}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="space-y-3">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Reminder</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-full justify-start text-left", !reminderDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                  {reminderDate ? format(reminderDate, "PPP") : "Set reminder"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={reminderDate} onSelect={setReminderDate} disabled={(d) => d < new Date()} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <Button size="sm" onClick={handleSave} disabled={updateBookmark.isPending} className="w-full gap-1">
            <Check className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      ) : (
        <>
          {bookmark.label && <p className="text-sm text-foreground font-medium">{bookmark.label}</p>}
          {bookmark.reminder_date && (
            <p className="text-[10px] text-primary flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Reminder: {format(new Date(bookmark.reminder_date), "dd MMM yyyy")}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">{format(new Date(bookmark.created_at), "dd MMM yyyy, HH:mm")}</p>
        </>
      )}
    </div>
  );
}
