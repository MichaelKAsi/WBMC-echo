import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketplaceItem } from "@/types/marketplace";
import { Briefcase, Package, Tag, Phone, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface MarketplaceItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MarketplaceItem;
}

export function MarketplaceItemModal({ open, onOpenChange, item }: MarketplaceItemModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/?item=${item.id}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: `Check out "${item.title}" — R${item.price.toFixed(2)}`, url: shareUrl });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share link has been copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
        <div className="aspect-square bg-muted relative">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {item.category === "services" ? <Briefcase className="h-16 w-16 text-muted-foreground/50" /> : <Package className="h-16 w-16 text-muted-foreground/50" />}
            </div>
          )}
          <Badge variant="secondary" className="absolute top-3 left-3 capitalize">{item.category}</Badge>
        </div>

        <div className="p-5 space-y-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl">{item.title}</DialogTitle>
            <DialogDescription className="sr-only">Details for {item.title}</DialogDescription>
          </DialogHeader>

          <p className="font-bold text-2xl text-primary">R{item.price.toFixed(2)}</p>

          {item.subcategory && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              {item.subcategory}
            </div>
          )}

          {item.description && (
            <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
          )}

          {item.contactInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{item.contactInfo}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
