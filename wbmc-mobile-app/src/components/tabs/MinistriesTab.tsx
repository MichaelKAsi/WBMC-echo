import { useState } from "react";
import { Search, Users, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinistries } from "@/hooks/useMinistries";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function MinistriesTab() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: ministries = [], isLoading, isFetching, refetch } = useMinistries();
  const qc = useQueryClient();
  const { toast } = useToast();

  const filtered = ministries.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = async () => {
    await qc.invalidateQueries({ queryKey: ["ministries"] });
    const result = await refetch();
    if (result.data && result.data.length > 0) {
      toast({ title: "Ministries refreshed", description: `${result.data.length} ministries loaded.` });
    }
  };

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ministries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isFetching}
          aria-label="Refresh ministries"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {isLoading ? "Loading..." : `${filtered.length} ministries`}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((ministry, i) => (
            <button
              key={i}
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="rounded-xl overflow-hidden border border-border bg-card shadow-sm text-left transition-all"
            >
              {ministry.imageUrl && (
                <img
                  src={ministry.imageUrl}
                  alt={ministry.name}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm text-foreground">{ministry.name}</h3>
                </div>
                <p className={`text-xs text-muted-foreground leading-relaxed ${expanded === i ? "" : "line-clamp-2"}`}>
                  {ministry.description}
                </p>
                <span className="text-[10px] text-primary font-medium">
                  {expanded === i ? "Show less" : "Read more"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No ministries found</p>
          <p className="text-sm">Try a different search term or refresh.</p>
        </div>
      )}
    </div>
  );
}
