import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Pin, PinOff, Trash2, Plus, X, BookOpen, Palette, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useBibleNotes, useUpdateBibleNote, useDeleteBibleNote, BibleNote } from "@/hooks/useBibleNotes";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = [
  { name: "default", bg: "bg-card", swatch: "#ffffff", border: "border-border" },
  { name: "yellow", bg: "bg-[#fff8c5]", swatch: "#fff8c5", border: "border-[#f0e58b]" },
  { name: "red", bg: "bg-[#fde2e2]", swatch: "#fde2e2", border: "border-[#f5b6b6]" },
  { name: "orange", bg: "bg-[#ffe4c7]", swatch: "#ffe4c7", border: "border-[#f5c79a]" },
  { name: "green", bg: "bg-[#d6f5d6]", swatch: "#d6f5d6", border: "border-[#a8e0a8]" },
  { name: "blue", bg: "bg-[#d6e7ff]", swatch: "#d6e7ff", border: "border-[#a8c5f0]" },
  { name: "purple", bg: "bg-[#e8d8ff]", swatch: "#e8d8ff", border: "border-[#c5a8f0]" },
  { name: "pink", bg: "bg-[#ffd6e8]", swatch: "#ffd6e8", border: "border-[#f0a8c5]" },
];

const colorClass = (name: string) => COLORS.find((c) => c.name === name) ?? COLORS[0];

interface Note extends BibleNote {
  title?: string | null;
  color?: string;
  pinned?: boolean;
}

export default function Notes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) navigate("/");
    });
  }, [navigate]);

  const { data: notes = [] } = useBibleNotes(userId ?? undefined);
  const allNotes = notes as Note[];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allNotes;
    return allNotes.filter(
      (n) =>
        (n.title ?? "").toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.chapter_reference.toLowerCase().includes(q),
    );
  }, [allNotes, search]);

  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);

  const togglePin = async (n: Note) => {
    await supabase.from("bible_notes").update({ pinned: !n.pinned }).eq("id", n.id);
    qc.invalidateQueries({ queryKey: ["bible-notes"] });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground flex-1">Notes</h1>
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-muted border-0"
            />
          </div>
        </div>
        <div className="px-4 pb-3 sm:hidden max-w-5xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-muted border-0"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-28">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">No notes yet. Tap + to add one.</p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <Section title="Pinned" notes={pinned} onOpen={setEditingNote} onPin={togglePin} />
            )}
            {others.length > 0 && (
              <Section
                title={pinned.length > 0 ? "Others" : undefined}
                notes={others}
                onOpen={setEditingNote}
                onPin={togglePin}
              />
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setCreating(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="New note"
      >
        <Plus className="h-6 w-6" />
      </button>

      {editingNote && userId && (
        <NoteEditor
          note={editingNote}
          userId={userId}
          onClose={() => setEditingNote(null)}
        />
      )}
      {creating && userId && (
        <NoteEditor
          note={null}
          userId={userId}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}

function Section({
  title,
  notes,
  onOpen,
  onPin,
}: {
  title?: string;
  notes: Note[];
  onOpen: (n: Note) => void;
  onPin: (n: Note) => void;
}) {
  return (
    <section className="mb-6">
      {title && (
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {title}
        </h2>
      )}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} onOpen={onOpen} onPin={onPin} />
        ))}
      </div>
    </section>
  );
}

function NoteCard({
  note,
  onOpen,
  onPin,
}: {
  note: Note;
  onOpen: (n: Note) => void;
  onPin: (n: Note) => void;
}) {
  const c = colorClass(note.color ?? "default");
  return (
    <button
      onClick={() => onOpen(note)}
      className={cn(
        "w-full text-left rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow",
        c.bg,
        c.border,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        {note.title ? (
          <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{note.title}</h3>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {note.chapter_reference}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin(note);
          }}
          className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1"
          aria-label={note.pinned ? "Unpin" : "Pin"}
        >
          {note.pinned ? <Pin className="h-4 w-4 fill-foreground" /> : <Pin className="h-4 w-4" />}
        </button>
      </div>
      {note.title && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <BookOpen className="h-3 w-3" />
          {note.chapter_reference}
        </p>
      )}
      <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-[10]">{note.content}</p>
      {note.reminder_date && (
        <p className="text-[10px] text-primary flex items-center gap-1 mt-2">
          <CalendarIcon className="h-3 w-3" /> {format(new Date(note.reminder_date), "dd MMM yyyy")}
        </p>
      )}
    </button>
  );
}

function NoteEditor({
  note,
  userId,
  onClose,
}: {
  note: Note | null;
  userId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateNote = useUpdateBibleNote();
  const deleteNote = useDeleteBibleNote();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [color, setColor] = useState(note?.color ?? "default");
  const [reminder, setReminder] = useState<Date | undefined>(
    note?.reminder_date ? new Date(note.reminder_date) : undefined,
  );
  const c = colorClass(color);

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed && !title.trim()) {
      onClose();
      return;
    }
    if (note) {
      const { error } = await supabase
        .from("bible_notes")
        .update({
          title: title.trim() || null,
          content: trimmed,
          color,
          reminder_date: reminder ? format(reminder, "yyyy-MM-dd") : null,
        })
        .eq("id", note.id);
      if (error) {
        toast({ title: "Couldn't save note", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("bible_notes").insert({
        user_id: userId,
        title: title.trim() || null,
        content: trimmed,
        color,
        chapter_id: "free-note",
        chapter_reference: "Quick note",
        book_name: "Notes",
        reminder_date: reminder ? format(reminder, "yyyy-MM-dd") : null,
      });
      if (error) {
        toast({ title: "Couldn't create note", variant: "destructive" });
        return;
      }
    }
    qc.invalidateQueries({ queryKey: ["bible-notes"] });
    onClose();
  };

  const handleDelete = async () => {
    if (!note) return;
    await deleteNote.mutateAsync(note.id);
    toast({ title: "Note deleted" });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && handleSave()}>
      <DialogContent className={cn("max-w-lg p-0 overflow-hidden border", c.bg, c.border)}>
        <div className="p-4 space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="border-0 bg-transparent text-lg font-semibold px-0 focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Take a note..."
            rows={10}
            className="border-0 bg-transparent resize-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 text-sm"
            autoFocus
          />
          {note?.chapter_reference && note.chapter_id !== "free-note" && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {note.chapter_reference}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 px-2 py-2 border-t border-border/50 bg-background/40">
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Color">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                  {COLORS.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setColor(opt.name)}
                      style={{ backgroundColor: opt.swatch }}
                      className={cn(
                        "h-7 w-7 rounded-full border-2",
                        color === opt.name ? "border-primary" : "border-border",
                      )}
                      aria-label={opt.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Reminder">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reminder}
                  onSelect={setReminder}
                  disabled={(d) => d < new Date()}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {note && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive"
                onClick={handleDelete}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleSave} size="sm">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
