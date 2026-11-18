import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddMarketplaceItem } from "@/hooks/useMarketplace";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { MarketplaceImageUpload } from "@/components/MarketplaceImageUpload";

const productSubcategories = [
  "Electronics", "Clothing", "Food & Drinks", "Books", "Home & Garden", "Other",
];

interface AddMarketplaceItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function AddMarketplaceItemModal({ open, onOpenChange, userId }: AddMarketplaceItemModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<"services" | "products">("products");
  const [subcategory, setSubcategory] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const addItem = useAddMarketplaceItem();
  const { toast } = useToast();

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice("");
    setCategory("products"); setSubcategory("");
    setImageUrl(""); setContactInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast({ title: "Invalid price", description: "Please enter a valid price.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await addItem.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        category,
        subcategory: category === "products" ? (subcategory || null) : null,
        imageUrl: imageUrl.trim() || null,
        contactInfo: contactInfo.trim() || null,
        userId,
      });
      toast({ title: "Item submitted!", description: "Your listing is pending admin approval." });
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add item.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Listing</DialogTitle>
          <DialogDescription>Add a product or service to the marketplace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="itemTitle">Title</Label>
            <Input id="itemTitle" placeholder="What are you selling?" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemCategory">Category</Label>
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
            <Label htmlFor="itemPrice">Price (R)</Label>
            <Input id="itemPrice" type="number" step="0.01" min="0" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemDesc">Description</Label>
            <Textarea id="itemDesc" placeholder="Describe your item..." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </div>
          <MarketplaceImageUpload
            userId={userId}
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
          />
          <div className="space-y-2">
            <Label htmlFor="itemContact">Contact Info</Label>
            <Input id="itemContact" placeholder="Phone or email" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} maxLength={100} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Listing
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
