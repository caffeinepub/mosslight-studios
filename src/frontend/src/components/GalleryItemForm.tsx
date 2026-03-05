import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, ShoppingBag, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useAddGalleryItem } from "../hooks/useGallery";
import { useGetProducts } from "../hooks/useProducts";

interface GalleryItemFormProps {
  onSuccess?: () => void;
}

export default function GalleryItemForm({ onSuccess }: GalleryItemFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [taggedProductIds, setTaggedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addGalleryItem = useAddGalleryItem();
  const { data: products = [] } = useGetProducts();

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const toggleProduct = (productId: string) => {
    setTaggedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageFile) {
      toast.error("Please provide a title and select an image");
      return;
    }

    try {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      await addGalleryItem.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        image: blob,
        taggedProductIds,
      });

      toast.success("Gallery item added!");
      setTitle("");
      setDescription("");
      setImageFile(null);
      setUploadProgress(0);
      setTaggedProductIds([]);
      setProductSearch("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add gallery item");
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="gallery-title">Title *</Label>
        <Input
          id="gallery-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Photo title"
          required
          data-ocid="gallery.input"
        />
      </div>
      <div>
        <Label htmlFor="gallery-description">Description</Label>
        <Textarea
          id="gallery-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this photo..."
          rows={3}
          data-ocid="gallery.textarea"
        />
      </div>
      <div>
        <Label htmlFor="gallery-image">Image *</Label>
        <Input
          id="gallery-image"
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required
          data-ocid="gallery.upload_button"
        />
        {imageFile && (
          <p className="text-xs text-muted-foreground mt-1">{imageFile.name}</p>
        )}
      </div>

      {/* Product Tagging */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
          Tag Products
          <span className="text-xs text-muted-foreground font-normal ml-1">
            (optional — link products shown in this photo/video)
          </span>
        </Label>

        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-2">
            No products available to tag yet.
          </p>
        ) : (
          <div className="rounded-md border border-border bg-card">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  data-ocid="gallery.search_input"
                />
              </div>
            </div>
            <ScrollArea className="h-48">
              <div className="p-2 space-y-1">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">
                    No products match your search.
                  </p>
                ) : (
                  filteredProducts.map((product, idx) => {
                    const imageUrl = product.images[0]?.getDirectURL();
                    const isChecked = taggedProductIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-left"
                        data-ocid={`gallery.checkbox.${idx + 1}`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleProduct(product.id)}
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-8 w-8 rounded object-cover shrink-0"
                          />
                        )}
                        <span className="text-sm truncate flex-1">
                          {product.name}
                        </span>
                        {product.hasVariants ? (
                          <span className="text-xs text-muted-foreground shrink-0">
                            Variants
                          </span>
                        ) : (
                          <span className="text-xs text-primary font-medium shrink-0">
                            ${Number(product.price).toFixed(2)}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            {taggedProductIds.length > 0 && (
              <div className="px-3 py-1.5 border-t border-border bg-primary/5">
                <p className="text-xs text-primary font-medium">
                  {taggedProductIds.length} product
                  {taggedProductIds.length !== 1 ? "s" : ""} tagged
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
      <Button
        type="submit"
        disabled={addGalleryItem.isPending}
        className="w-full"
        data-ocid="gallery.submit_button"
      >
        {addGalleryItem.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Adding...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Add Gallery Item
          </>
        )}
      </Button>
    </form>
  );
}
