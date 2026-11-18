import { useState } from "react";
import { Search, Music, ChevronRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useHymns, Hymn } from "@/hooks/useHymns";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DifelaTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const { data: hymns = [], isLoading } = useHymns(searchQuery);

  if (selectedHymn) {
    return (
      <div className="pb-20">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <button
            onClick={() => setSelectedHymn(null)}
            className="flex items-center gap-2 text-primary font-medium text-sm mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Hymns
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
              #{selectedHymn.hymn_number}
            </span>
            <h2 className="font-bold text-foreground text-lg leading-tight">
              Sefela sa {selectedHymn.hymn_number}
            </h2>
          </div>
        </div>
        <div className="px-4 py-4">
          <pre className="whitespace-pre-wrap font-sans text-foreground text-[15px] leading-relaxed">
            {selectedHymn.lyrics.replace(new RegExp(`^${selectedHymn.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n?`, 'i'), '').trim()}
          </pre>
          <p className="mt-6 text-sm text-muted-foreground italic text-right">
            — {selectedHymn.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Search */}
      <div className="sticky top-0 z-10 bg-background px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, number or words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Hymn List */}
      <div className="px-4 py-2 space-y-1">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Loading hymns...
          </div>
        ) : hymns.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "No hymns found" : "No hymns added yet"}
            </p>
          </div>
        ) : (
          hymns.map((hymn) => (
            <button
              key={hymn.id}
              onClick={() => setSelectedHymn(hymn)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {hymn.hymn_number}
                </span>
              </div>
              <span className="flex-1 font-medium text-sm text-foreground truncate">
                {hymn.title}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
