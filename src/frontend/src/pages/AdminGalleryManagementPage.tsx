import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { GalleryItem, Product } from "../backendTypes";
import AdminGuard from "../components/AdminGuard";
import GalleryItemForm from "../components/GalleryItemForm";
import {
  useDeleteGalleryItem,
  useGetGalleryItems,
  useUpdateGalleryItemTags,
} from "../hooks/useGallery";
import { useGetProducts } from "../hooks/useProducts";

// ─── Edit Tags Dialog ────────────────────────────────────────────────────────

interface EditTagsDialogProps {
  item: GalleryItem;
  products: Product[];
  open: boolean;
  onClose: () => void;
}

function EditTagsDialog({
  item,
  products,
  open,
  onClose,
}: EditTagsDialogProps) {
  const [selected, setSelected] = useState<string[]>(
    item.taggedProductIds ?? [],
  );
  const [search, setSearch] = useState("");
  const updateTags = useUpdateGalleryItemTags();

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    try {
      await updateTags.mutateAsync({
        galleryItemId: item.id,
        taggedProductIds: selected,
      });
      toast.success("Product tags updated");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update tags");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="gallery.dialog">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Tag Products — {item.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select products that appear in this gallery item so visitors can
            shop directly from the post.
          </p>

          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4 text-center">
              No products available to tag.
            </p>
          ) : (
            <div className="rounded-md border border-border">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                    data-ocid="gallery.search_input"
                  />
                </div>
              </div>
              <ScrollArea className="h-52">
                <div className="p-2 space-y-1">
                  {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No products match.
                    </p>
                  ) : (
                    filtered.map((product, idx) => {
                      const imageUrl = product.images[0]?.getDirectURL();
                      const isChecked = selected.includes(product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggle(product.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-left"
                          data-ocid={`gallery.checkbox.${idx + 1}`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggle(product.id)}
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
                          {!product.hasVariants && (
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
              {selected.length > 0 && (
                <div className="px-3 py-1.5 border-t border-border bg-primary/5">
                  <p className="text-xs text-primary font-medium">
                    {selected.length} product{selected.length !== 1 ? "s" : ""}{" "}
                    tagged
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="gallery.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateTags.isPending}
            data-ocid="gallery.save_button"
          >
            {updateTags.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              "Save Tags"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminGalleryManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [editTagsItem, setEditTagsItem] = useState<GalleryItem | null>(null);
  const { data: items = [], isLoading } = useGetGalleryItems();
  const { data: products = [] } = useGetProducts();
  const deleteItem = useDeleteGalleryItem();

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Gallery item deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete item");
    }
  };

  return (
    <AdminGuard>
      <div className="container py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold">Gallery Content</h1>
              <p className="text-muted-foreground mt-1">
                Add and manage gallery photos, behind-the-scenes content, and
                product tags
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
              data-ocid="gallery.open_modal_button"
            >
              {showForm ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Form
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Photo
                </>
              )}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-serif text-xl font-semibold mb-4">
                  New Gallery Item
                </h2>
                <GalleryItemForm onSuccess={() => setShowForm(false)} />
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(["a", "b", "c", "d", "e", "f"] as const).map((id) => (
                <Card
                  key={`skeleton-gallery-admin-${id}`}
                  className="overflow-hidden"
                  data-ocid="gallery.loading_state"
                >
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div
              className="text-center py-20 text-muted-foreground"
              data-ocid="gallery.empty_state"
            >
              No gallery items yet. Add your first photo above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, itemIdx) => {
                const taggedCount = item.taggedProductIds?.length ?? 0;
                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden"
                    data-ocid={`gallery.item.${itemIdx + 1}`}
                  >
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={item.image.getDirectURL()}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold leading-tight">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Tagged products badge */}
                      {taggedCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="h-3 w-3 text-primary" />
                          <Badge
                            variant="secondary"
                            className="text-xs h-5 px-1.5"
                          >
                            {taggedCount} product{taggedCount !== 1 ? "s" : ""}{" "}
                            tagged
                          </Badge>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => setEditTagsItem(item)}
                          data-ocid={`gallery.edit_button.${itemIdx + 1}`}
                        >
                          <Tag className="h-3 w-3" />
                          {taggedCount > 0 ? "Edit Tags" : "Tag Products"}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1.5"
                              disabled={deleteItem.isPending}
                              data-ocid={`gallery.delete_button.${itemIdx + 1}`}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Gallery Item
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.title}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="gallery.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                                data-ocid="gallery.confirm_button"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Tags Dialog */}
      {editTagsItem && (
        <EditTagsDialog
          item={editTagsItem}
          products={products}
          open={!!editTagsItem}
          onClose={() => setEditTagsItem(null)}
        />
      )}
    </AdminGuard>
  );
}
