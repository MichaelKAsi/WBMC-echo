import { useState, useEffect } from "react";
import { Store, Briefcase, Package, Tag, Phone, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketplaceItems, useDeleteMarketplaceItem } from "@/hooks/useMarketplace";
import { MarketplaceItem } from "@/types/marketplace";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddMarketplaceItemModal } from "@/components/AddMarketplaceItemModal";
import { EditMarketplaceItemModal } from "@/components/EditMarketplaceItemModal";
import { MarketplaceItemModal } from "@/components/MarketplaceItemModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

type CategoryFilter = "all" | "services" | "products";

const productSubcategories = [
  "Electronics", "Clothing", "Food & Drinks", "Books", "Home & Garden", "Other",
];

function CategoryPill({ label, icon: Icon, isActive, onClick }: { label: string; icon: React.ElementType; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MarketplaceCard({ item, isOwner, onEdit, onDelete, onClick }: { item: MarketplaceItem; isOwner: boolean; onEdit: () => void; onDelete: () => void; onClick: () => void }) {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow relative cursor-pointer" onClick={onClick}>
      {isOwner && (
        <div className="absolute top-2 right-2 z-10 flex gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:bg-accent transition-colors" aria-label="Edit listing">
            <Pencil className="h-3.5 w-3.5 text-foreground" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border hover:bg-destructive/10 transition-colors" aria-label="Delete listing">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </div>
      )}
      <div className="aspect-square bg-muted relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.category === "services" ? <Briefcase className="h-12 w-12 text-muted-foreground/50" /> : <Package className="h-12 w-12 text-muted-foreground/50" />}
          </div>
        )}
        <Badge variant="secondary" className="absolute top-2 left-2 capitalize">{item.category}</Badge>
      </div>
      <div className="p-3">
        <p className="font-bold text-lg text-primary">R{item.price.toFixed(2)}</p>
        <h4 className="font-medium text-foreground line-clamp-2 mt-1">{item.title}</h4>
        {item.subcategory && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Tag className="h-3 w-3" />{item.subcategory}</div>
        )}
        {item.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{item.description}</p>}
        {item.contactInfo && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{item.contactInfo}</div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ category }: { category: CategoryFilter }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] text-center px-6">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Store className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-1">No items yet</h3>
      <p className="text-sm text-muted-foreground">
        {category === "all" ? "The marketplace is empty. Check back later!" : `No ${category} available right now.`}
      </p>
    </div>
  );
}

export function MarketplaceTab() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MarketplaceItem | null>(null);
  const [viewItem, setViewItem] = useState<MarketplaceItem | null>(null);
  const { user, canAddMarketplaceItem } = useUserRole();
  const { data: items = [], isLoading } = useMarketplaceItems();
  const deleteItem = useDeleteMarketplaceItem();
  const { toast } = useToast();

  const handleDelete = async (item: MarketplaceItem) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast({ title: "Deleted", description: "Your listing has been removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete.", variant: "destructive" });
    }
  };

  // Handle deep-link to item via URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get("item");
    if (itemId && items.length > 0) {
      const found = items.find((i) => i.id === itemId);
      if (found) setViewItem(found);
    }
  }, [items]);

  const userItemCount = user ? items.filter((i) => i.userId === user.id).length : 0;
  const canAdd = canAddMarketplaceItem && userItemCount < 3;

  const filteredItems = items.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (activeSubcategory && item.subcategory !== activeSubcategory) return false;
    return true;
  });

  const handleCategoryChange = (category: CategoryFilter) => {
    setActiveCategory(category);
    if (category !== "products") setActiveSubcategory(null);
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="pb-20">
      <div className="sticky top-14 z-10 bg-background border-b border-border">
        <ScrollArea className="w-full">
          <div className="flex gap-2 p-3">
            <CategoryPill label="All" icon={Store} isActive={activeCategory === "all"} onClick={() => handleCategoryChange("all")} />
            <CategoryPill label="Services" icon={Briefcase} isActive={activeCategory === "services"} onClick={() => handleCategoryChange("services")} />
            <CategoryPill label="Products" icon={Package} isActive={activeCategory === "products"} onClick={() => handleCategoryChange("products")} />
          </div>
        </ScrollArea>
        {activeCategory === "products" && (
          <ScrollArea className="w-full border-t border-border/50">
            <div className="flex gap-2 p-2 px-3">
              <button onClick={() => setActiveSubcategory(null)} className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap", !activeSubcategory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>All Products</button>
              {productSubcategories.map((sub) => (
                <button key={sub} onClick={() => setActiveSubcategory(sub)} className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap", activeSubcategory === sub ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>{sub}</button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState category={activeCategory} />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {filteredItems.map((item) => (
            <MarketplaceCard key={item.id} item={item} isOwner={!!user && item.userId === user.id} onEdit={() => setEditItem(item)} onDelete={() => handleDelete(item)} onClick={() => setViewItem(item)} />
          ))}
        </div>
      )}

      {/* Floating Add Button - only for merchants/admins */}
      {canAddMarketplaceItem && (
        <Button
          size="icon"
          className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
          onClick={() => {
            if (!canAdd) {
              toast({ title: "Limit reached", description: "You can only add up to 3 listings.", variant: "destructive" });
              return;
            }
            setAddModalOpen(true);
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {user && canAddMarketplaceItem && (
        <AddMarketplaceItemModal open={addModalOpen} onOpenChange={setAddModalOpen} userId={user.id} />
      )}

      {editItem && (
        <EditMarketplaceItemModal open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }} item={editItem} />
      )}

      {viewItem && (
        <MarketplaceItemModal open={!!viewItem} onOpenChange={(open) => { if (!open) setViewItem(null); }} item={viewItem} />
      )}
    </div>
  );
}
