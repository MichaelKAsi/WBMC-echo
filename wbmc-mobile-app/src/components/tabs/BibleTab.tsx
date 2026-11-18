import { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, StickyNote, Search, MoreHorizontal, X, History, Flame, Trash2 } from "lucide-react";
import { useBibleBooks, useBibleChapters, useChapterContent } from "@/hooks/useBible";
import { useAuth } from "@/hooks/useVideoInteractions";
import { useVideos } from "@/hooks/useVideos";
import { useBibleHighlights, useAddHighlight, useDeleteHighlight } from "@/hooks/useBibleHighlights";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AddBibleItemModal } from "@/components/bible/AddBibleItemModal";
import { BibleNotesBookmarksList } from "@/components/bible/BibleNotesBookmarksList";
import { AuthModal } from "@/components/AuthModal";
import { extractYoutubeId } from "@/types/video";

const TRENDING = ["Psalms 91", "Lost Things", "John 16:13"];

const HIGHLIGHT_COLORS = [
  { name: "yellow", label: "Yellow", bg: "#fde68a" },
  { name: "blue", label: "Blue", bg: "#bfdbfe" },
  { name: "green", label: "Green", bg: "#bbf7d0" },
  { name: "red", label: "Red", bg: "#fecaca" },
  { name: "lime", label: "Lime", bg: "#d9f99d" },
  { name: "pink", label: "Pink", bg: "#f9a8d4" },
  { name: "neon", label: "Neon", bg: "#a3e635" },
];
const COLOR_MAP: Record<string, string> = Object.fromEntries(HIGHLIGHT_COLORS.map((c) => [c.name, c.bg]));

export function BibleTab() {
  const [selectedBook, setSelectedBook] = useState<{ id: string; name: string } | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [booksOpen, setBooksOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bookSort, setBookSort] = useState<"traditional" | "alphabetical">("traditional");
  const [searchQuery, setSearchQuery] = useState("");
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const user = useAuth();
  const { data: books = [], isLoading: booksLoading } = useBibleBooks();
  const { data: chapters = [], isLoading: chaptersLoading } = useBibleChapters(selectedBook?.id ?? null);
  const { data: content, isLoading: contentLoading } = useChapterContent(selectedChapter);
  const { data: videos = [] } = useVideos();
  const { data: highlights = [] } = useBibleHighlights(user?.id ?? null, selectedChapter);
  const addHighlight = useAddHighlight();
  const deleteHighlight = useDeleteHighlight();

  const readingRef = useRef<HTMLDivElement | null>(null);
  const [popover, setPopover] = useState<{ x: number; y: number; text: string; start: number; end: number } | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // Compute plain-text offset of a node+offset inside container
  const getOffset = useCallback((container: Node, node: Node, offset: number): number => {
    let total = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let current: Node | null = walker.nextNode();
    while (current) {
      if (current === node) return total + offset;
      total += current.textContent?.length || 0;
      current = walker.nextNode();
    }
    return total;
  }, []);

  // Apply stored highlights to the rendered HTML
  useLayoutEffect(() => {
    const container = readingRef.current;
    if (!container || !content) return;
    // Clean any previous highlight wrappers
    container.querySelectorAll("mark[data-hl]").forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize();
    });
    if (!highlights.length) return;

    const sorted = [...highlights].sort((a, b) => b.start_offset - a.start_offset);
    sorted.forEach((h) => {
      try {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let pos = 0;
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startNodeOffset = 0;
        let endNodeOffset = 0;
        let n: Node | null = walker.nextNode();
        while (n) {
          const len = n.textContent?.length || 0;
          if (!startNode && pos + len > h.start_offset) {
            startNode = n as Text;
            startNodeOffset = h.start_offset - pos;
          }
          if (!endNode && pos + len >= h.end_offset) {
            endNode = n as Text;
            endNodeOffset = h.end_offset - pos;
            break;
          }
          pos += len;
          n = walker.nextNode();
        }
        if (!startNode || !endNode) return;
        const range = document.createRange();
        range.setStart(startNode, startNodeOffset);
        range.setEnd(endNode, endNodeOffset);
        if (range.startContainer === range.endContainer) {
          const mark = document.createElement("mark");
          mark.setAttribute("data-hl", h.id);
          mark.style.backgroundColor = COLOR_MAP[h.color] || h.color;
          mark.style.borderRadius = "3px";
          mark.style.padding = "0 2px";
          mark.style.cursor = "pointer";
          range.surroundContents(mark);
        }
      } catch {
        // Skip highlights that can't be safely wrapped (cross-element)
      }
    });
  }, [highlights, content]);

  // Selection handler
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      // Ignore mouseups inside the popover so clicking a color doesn't clear selection
      const target = e.target as HTMLElement | null;
      if (target && target.closest?.("[data-highlight-popover]")) return;
      const sel = window.getSelection();
      const container = readingRef.current;
      if (!sel || sel.isCollapsed || !container) {
        setPopover(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setPopover(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text) {
        setPopover(null);
        return;
      }
      if (!user) {
        setLoginPromptOpen(true);
        sel.removeAllRanges();
        return;
      }
      const start = getOffset(container, range.startContainer, range.startOffset);
      const end = getOffset(container, range.endContainer, range.endOffset);
      const rect = range.getBoundingClientRect();
      setPopover({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        text,
        start: Math.min(start, end),
        end: Math.max(start, end),
      });
    };
    document.addEventListener("mouseup", handler);
    document.addEventListener("touchend", handler);
    return () => {
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("touchend", handler);
    };
  }, [user, getOffset]);

  // Click on existing highlight to allow removal
  useEffect(() => {
    const container = readingRef.current;
    if (!container) return;
    const onClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const mark = target.closest?.("mark[data-hl]");
      if (mark) {
        e.stopPropagation();
        setActiveHighlightId(mark.getAttribute("data-hl"));
        const rect = mark.getBoundingClientRect();
        setPopover({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
          text: mark.textContent || "",
          start: 0,
          end: 0,
        });
      }
    };
    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [content]);

  const handleAddHighlight = (color: string) => {
    if (!user || !selectedChapter || !content || !popover || !selectedBook) return;
    addHighlight.mutate({
      user_id: user.id,
      chapter_id: selectedChapter,
      chapter_reference: content.reference,
      book_name: selectedBook.name,
      selected_text: popover.text,
      color,
      start_offset: popover.start,
      end_offset: popover.end,
    });
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  const handleRemoveHighlight = () => {
    if (!activeHighlightId || !user || !selectedChapter) return;
    deleteHighlight.mutate({ id: activeHighlightId, userId: user.id, chapterId: selectedChapter });
    setActiveHighlightId(null);
    setPopover(null);
  };


  // Restore last reading position for logged-in user
  const restoredRef = useRef(false);
  const [pendingRestoreChapter, setPendingRestoreChapter] = useState<string | null>(null);
  useEffect(() => {
    if (!user || restoredRef.current) return;
    try {
      const raw = localStorage.getItem(`bible:lastPosition:${user.id}`);
      if (raw) {
        const saved = JSON.parse(raw) as { bookId?: string; bookName?: string; chapterId?: string };
        if (saved.bookId && saved.bookName) {
          setSelectedBook({ id: saved.bookId, name: saved.bookName });
          if (saved.chapterId) {
            setSelectedChapter(saved.chapterId);
            setPendingRestoreChapter(saved.chapterId);
          }
        }
      }
    } catch {}
    restoredRef.current = true;
  }, [user]);

  // Default to Genesis 1 once books load (only if nothing restored)
  useEffect(() => {
    if (!selectedBook && books.length > 0) {
      const gen = books.find((b) => b.id.replace(/^[^.]*\./, "").startsWith("GEN")) || books[0];
      setSelectedBook({ id: gen.id, name: gen.name });
    }
  }, [books, selectedBook]);

  // When chapters load (or book changes), default to chapter 1
  useEffect(() => {
    if (chapters.length > 0) {
      // If we're waiting on a restored chapter that belongs to these chapters, keep it
      if (pendingRestoreChapter && chapters.some((c) => c.id === pendingRestoreChapter)) {
        setPendingRestoreChapter(null);
        return;
      }
      const ch1 = chapters.find((c) => c.number === "1") || chapters.find((c) => c.number !== "intro");
      if (ch1 && (!selectedChapter || !chapters.some((c) => c.id === selectedChapter))) {
        setSelectedChapter(ch1.id);
      }
    }
  }, [chapters, selectedChapter, pendingRestoreChapter]);

  // Persist last position whenever it changes
  useEffect(() => {
    if (!user || !selectedBook || !selectedChapter) return;
    try {
      localStorage.setItem(
        `bible:lastPosition:${user.id}`,
        JSON.stringify({ bookId: selectedBook.id, bookName: selectedBook.name, chapterId: selectedChapter })
      );
    } catch {}
  }, [user, selectedBook, selectedChapter]);

  const sortedBooks = useMemo(() => {
    if (bookSort === "alphabetical") {
      return [...books].sort((a, b) => a.name.localeCompare(b.name));
    }
    return books;
  }, [books, bookSort]);

  const currentChapterIndex = chapters.findIndex((c) => c.id === selectedChapter);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  const handleBookSelect = (bookId: string, bookName: string) => {
    setSelectedBook({ id: bookId, name: bookName });
    setSelectedChapter(null);
    setBooksOpen(false);
  };

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos.slice(0, 6);
    const q = searchQuery.toLowerCase();
    return videos.filter((v) => v.title.toLowerCase().includes(q)).slice(0, 10);
  }, [videos, searchQuery]);

  if (booksLoading || !selectedBook) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading Bible...</p>
      </div>
    );
  }

  if (notesOpen && user) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <BibleNotesBookmarksList
          userId={user.id}
          onNavigateToChapter={(chapterId) => {
            setSelectedChapter(chapterId);
            setNotesOpen(false);
          }}
          onClose={() => setNotesOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <button
          onClick={() => setBooksOpen(true)}
          className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          {content?.reference || selectedBook.name}
        </button>
        <span className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-muted-foreground">NIV</span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSearchOpen(true)}>
          <Search className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => (user ? setNotesOpen(true) : setLoginPromptOpen(true))}
        >
          <StickyNote className="h-5 w-5" />
        </Button>
        {selectedChapter && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => (user ? setAddModalOpen(true) : setLoginPromptOpen(true))}
          >
            <Plus className="h-5 w-5 text-primary" />
          </Button>
        )}
      </div>

      {/* Reading */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-5 pb-28">
          {contentLoading || chaptersLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : content ? (
            <div
              ref={readingRef}
              className="prose prose-base max-w-none text-foreground select-text
                [&_.v]:text-primary [&_.v]:text-xs [&_.v]:font-bold [&_.v]:align-super [&_.v]:mr-0.5
                [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:mt-6 [&_h1]:mb-3
                [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3
                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-3
                [&_h4]:text-base [&_h4]:font-bold [&_h4]:mt-4 [&_h4]:mb-2
                [&_.s]:font-bold [&_.s1]:font-bold [&_.s2]:font-bold [&_.d]:font-bold
                [&_p]:leading-[1.9] [&_p]:mb-4 [&_p]:text-base"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          ) : null}
        </div>
      </ScrollArea>

      {/* Floating carousel controls */}
      {chapters.length > 0 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-between px-3 pointer-events-none z-10">
          <button
            disabled={!prevChapter}
            onClick={() => prevChapter && setSelectedChapter(prevChapter.id)}
            className={cn(
              "pointer-events-auto h-11 w-11 rounded-full bg-card border border-border shadow-md flex items-center justify-center transition-opacity",
              !prevChapter && "opacity-30"
            )}
            aria-label="Previous chapter"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            disabled={!nextChapter}
            onClick={() => nextChapter && setSelectedChapter(nextChapter.id)}
            className={cn(
              "pointer-events-auto h-11 w-11 rounded-full bg-card border border-border shadow-md flex items-center justify-center transition-opacity",
              !nextChapter && "opacity-30"
            )}
            aria-label="Next chapter"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>
      )}

      {/* Books modal */}
      <Dialog open={booksOpen} onOpenChange={setBooksOpen}>
        <DialogContent className="p-0 max-w-md h-[85vh] flex flex-col gap-0 rounded-t-3xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setBooksOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            <h3 className="text-base font-semibold text-foreground">Books</h3>
            <div className="h-9 w-9" />
          </div>

          <ScrollArea className="flex-1">
            <div className="py-2">
              {sortedBooks.map((book) => {
                const isSelected = book.id === selectedBook.id;
                return (
                  <button
                    key={book.id}
                    onClick={() => handleBookSelect(book.id, book.name)}
                    className={cn(
                      "w-full text-left px-5 py-3.5 text-base text-foreground transition-colors",
                      isSelected ? "bg-primary/10 font-medium" : "hover:bg-accent"
                    )}
                  >
                    {book.name}
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Chapter selector for current book */}
          {selectedBook && chapters.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {selectedBook.name} chapters
              </p>
              <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto">
                {chapters
                  .filter((c) => c.number !== "intro")
                  .map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        setSelectedChapter(chapter.id);
                        setBooksOpen(false);
                      }}
                      className={cn(
                        "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                        chapter.id === selectedChapter
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-accent"
                      )}
                    >
                      {chapter.number}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Sort toggle */}
          <div className="px-4 pb-4 pt-2 border-t border-border">
            <div className="flex bg-muted rounded-full p-1">
              <button
                onClick={() => setBookSort("traditional")}
                className={cn(
                  "flex-1 py-2 rounded-full text-sm font-medium transition-colors",
                  bookSort === "traditional" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Traditional
              </button>
              <button
                onClick={() => setBookSort("alphabetical")}
                className={cn(
                  "flex-1 py-2 rounded-full text-sm font-medium transition-colors",
                  bookSort === "alphabetical" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Alphabetical
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 max-w-md h-[85vh] flex flex-col gap-0 rounded-t-3xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="pl-9 rounded-full bg-muted border-0"
              />
            </div>
            <button onClick={() => setSearchOpen(false)} className="text-sm text-muted-foreground px-1">
              Cancel
            </button>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4 space-y-6">
              {!searchQuery && (
                <div>
                  <h4 className="font-bold text-foreground mb-3">Trending Searches</h4>
                  <div className="space-y-1">
                    {TRENDING.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSearchQuery(t)}
                        className="w-full flex items-center gap-3 py-2.5 hover:bg-accent rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <span className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <Flame className="h-4 w-4 text-foreground" />
                        </span>
                        <span className="text-base text-foreground">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">{content?.reference || ""}</p>
                <h4 className="font-bold text-foreground mb-3">Latest Sermons</h4>
                {filteredVideos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No sermons found.</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
                    {filteredVideos.map((v) => {
                      const ytId = extractYoutubeId(v.youtubeUrl);
                      return (
                        <a
                          key={v.id}
                          href={v.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 w-56 space-y-1.5"
                        >
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                            <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{v.title}</p>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add note/bookmark modal */}
      {user && selectedChapter && content && (
        <AddBibleItemModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          userId={user.id}
          bookName={selectedBook.name}
          chapterReference={content.reference}
          chapterId={selectedChapter}
        />
      )}

      {/* Highlight color popover */}
      {popover && user && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setPopover(null);
              setActiveHighlightId(null);
              window.getSelection()?.removeAllRanges();
            }}
          />
          <div
            data-highlight-popover
            className="fixed z-50 -translate-x-1/2 -translate-y-full bg-card border border-border rounded-full shadow-lg px-2 py-1.5 flex items-center gap-1.5"
            style={{ left: popover.x, top: popover.y }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            {activeHighlightId ? (
              <button
                onClick={handleRemoveHighlight}
                className="h-7 px-2 rounded-full flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            ) : (
              HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleAddHighlight(c.name)}
                  aria-label={c.label}
                  className="h-6 w-6 rounded-full border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.bg }}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Login prompt for guests using notes/bookmarks/highlights */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <div className="text-center space-y-3 py-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <StickyNote className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Sign in required</h3>
            <p className="text-sm text-muted-foreground">
              Login to use our notes, bookmarks and highlighters.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  setLoginPromptOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full"
              >
                Sign in
              </Button>
              <Button variant="ghost" onClick={() => setLoginPromptOpen(false)} className="w-full">
                Not now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}

