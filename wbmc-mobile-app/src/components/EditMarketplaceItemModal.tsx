import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateMarketplaceItem } from "@/hooks/useMarketplace";
import { useToast } from "@/hooks/use-toast";
import { MarketplaceItem } from "@/types/marketplace";
import { Loader2 } from "lucide-react";
import { MarketplaceImageUpload } from "@/components/MarketplaceImageUpload";

const productSubcategories = [
  "Electronics", "Clothing", "Food & Drinks", "Books", "Home & Garden", "Other",
];

interface EditMarketplaceItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MarketplaceItem;
}

export function EditMarketplaceItemModal({ open, onOpenChange, item }: EditMarketplaceItemModalProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || "");
  const [price, setPrice] = useState(String(item.price));
  const [category, setCategory] = useState<"services" | "products">(item.category);
  const [subcategory, setSubcategory] = useState(item.subcategory || "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl || "");
  const [contactInfo, setContactInfo] = useState(item.contactInfo || "");
  const [loading, setLoading] = useState(false);
  const updateItem = useUpdateMarketplaceItem();
  const { toast } = useToast();

  useEffect(() => {
    setTitle(item.title);
    setDescription(item.description || "");
    setPrice(String(item.price));
    setCategory(item.category);
    setSubcategory(item.subcategory || "");
    setImageUrl(item.imageUrl || "");
    setContactInfo(item.contactInfo || "");
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast({ title: "Invalid price", description: "Please enter a valid price.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await updateItem.mutateAsync({
        id: item.id,
        title: title.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        category,
        subcategory: category === "products" ? (subcategory || null) : null,
        imageUrl: imageUrl.trim() || null,
        contactInfo: contactInfo.trim() || null,
      });
      toast({ title: "Updated!", description: "Your listing has been updated." });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update item.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
          <DialogDescription>Update your listing details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="editTitle">Title</Label>
            <Input id="editTitle" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editCategory">Category</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v as "services" | "products"); setSubcategory(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="products">Product</SelectItem>
                <SelectItem value="services">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {category === "products" && (
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                <SelectContent>
                  {productSubcategories.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="editPrice">Price (R)</Label>
            <Input id="editPrice" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editDesc">Description</Label>
            <Textarea id="editDesc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </div>
          <MarketplaceImageUpload
            userId={item.userId || "unknown"}
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
          />
          <div className="space-y-2">
            <Label htmlFor="editContact">Contact Info</Label>
            <Input id="editContact" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} maxLength={100} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
