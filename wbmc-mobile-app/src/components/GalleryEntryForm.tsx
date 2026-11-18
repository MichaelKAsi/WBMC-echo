import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, ImageIcon, Upload, Loader2, Monitor, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GalleryEntryFormProps {
  onAddEntry: (entry: { title: string; images: string[]; mobileImages: string[]; googleDriveLink: string; notify?: boolean }) => void;
}

function ImageUploadSection({
  label,
  icon: Icon,
  images,
  onUpload,
  onRemove,
  uploading,
}: {
  label: string;
  icon: React.ElementType;
  images: { url: string; name: string }[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  uploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label} (up to 4)
      </Label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative rounded-lg overflow-hidden border border-border aspect-video bg-muted">
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded truncate max-w-[90%]">
                {img.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {images.length < 4 && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : `Upload ${label}`}
          </Button>
        </>
      )}
    </div>
  );
}

export function GalleryEntryForm({ onAddEntry }: GalleryEntryFormProps) {
  const [title, setTitle] = useState("");
  const [desktopImages, setDesktopImages] = useState<{ url: string; name: string }[]>([]);
  const [mobileImages, setMobileImages] = useState<{ url: string; name: string }[]>([]);
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [notify, setNotify] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFiles = async (
    files: FileList,
    current: { url: string; name: string }[],
    setter: React.Dispatch<React.SetStateAction<{ url: string; name: string }[]>>,
    subfolder: string
  ) => {
    const remaining = 4 - current.length;
    if (remaining <= 0) {
      toast({ title: "Limit reached", description: "Maximum 4 images.", variant: "destructive" });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const newImages: { url: string; name: string }[] = [];
      for (const file of filesToUpload) {
        const ext = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `gallery/${subfolder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("gallery-images")
          .getPublicUrl(filePath);

        newImages.push({ url: urlData.publicUrl, name: file.name });
      }
      setter((prev) => [...prev, ...newImages]);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || desktopImages.length === 0) return;

    onAddEntry({
      title: title.trim(),
      images: desktopImages.map((img) => img.url),
      mobileImages: mobileImages.map((img) => img.url),
      googleDriveLink: googleDriveLink.trim(),
      notify,
    });

    setTitle("");
    setDesktopImages([]);
    setMobileImages([]);
    setGoogleDriveLink("");
  };

  const isValid = title.trim() && desktopImages.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Add Gallery Slide
        </h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gallery-title">Slide Title</Label>
        <Input
          id="gallery-title"
          placeholder="e.g., Sunday Service Photos"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <ImageUploadSection
        label="Desktop Images"
        icon={Monitor}
        images={desktopImages}
        onUpload={(e) => e.target.files && uploadFiles(e.target.files, desktopImages, setDesktopImages, "desktop")}
        onRemove={(i) => setDesktopImages((prev) => prev.filter((_, idx) => idx !== i))}
        uploading={uploading}
      />

      <ImageUploadSection
        label="Mobile Images"
        icon={Smartphone}
        images={mobileImages}
        onUpload={(e) => e.target.files && uploadFiles(e.target.files, mobileImages, setMobileImages, "mobile")}
        onRemove={(i) => setMobileImages((prev) => prev.filter((_, idx) => idx !== i))}
        uploading={uploading}
      />

      <div className="space-y-2">
        <Label htmlFor="drive-link">Google Drive Link</Label>
        <Input
          id="drive-link"
          placeholder="https://drive.google.com/..."
          value={googleDriveLink}
          onChange={(e) => setGoogleDriveLink(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Link to full album for "View all pictures"
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-primary" />
        Notify users (SMS / email) when published
      </label>

      <Button type="submit" className="w-full" disabled={!isValid}>
        <Plus className="h-4 w-4 mr-2" />
        Add Gallery Slide
      </Button>
    </form>
  );
}
