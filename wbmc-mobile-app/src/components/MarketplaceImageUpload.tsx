import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface MarketplaceImageUploadProps {
  userId: string;
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export function MarketplaceImageUpload({ userId, imageUrl, onImageChange }: MarketplaceImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("marketplace-images")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("marketplace-images")
        .getPublicUrl(path);

      onImageChange(publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>Product Image</Label>
      {imageUrl ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onImageChange("")}
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8" />
              <span className="text-xs">Tap to upload image</span>
            </>
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      <p className="text-xs text-muted-foreground">Or paste an image URL:</p>
      <Input
        type="url"
        placeholder="https://..."
        value={imageUrl}
        onChange={(e) => onImageChange(e.target.value)}
      />
    </div>
  );
}
