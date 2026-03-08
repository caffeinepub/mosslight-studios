import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backendTypes";
import AdminGuard from "../components/AdminGuard";
import ProductForm from "../components/ProductForm";
import { useDeleteProduct, useGetProducts } from "../hooks/useProducts";

export default function AdminProductsPage() {
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const deleteProduct = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(
    undefined,
  );
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMassDeleteDialog, setShowMassDeleteDialog] = useState(false);
  const [isMassDeleting, setIsMassDeleting] = useState(false);

  const allSelected =
    products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMassDelete = async () => {
    setIsMassDeleting(true);
    let successCount = 0;
    let failCount = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        await deleteProduct.mutateAsync(id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    setIsMassDeleting(false);
    setShowMassDeleteDialog(false);
    setSelectedIds(new Set());
    if (successCount > 0) {
      toast.success(
        `${successCount} product${successCount > 1 ? "s" : ""} deleted successfully`,
      );
    }
    if (failCount > 0) {
      toast.error(
        `Failed to delete ${failCount} product${failCount > 1 ? "s" : ""}`,
      );
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted successfully");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  if (showForm) {
    return (
      <AdminGuard>
        <div className="container py-12">
          <ProductForm
            product={editingProduct}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="font-serif text-4xl font-bold">Manage Products</h1>
              <p className="text-muted-foreground">
                Add, edit, and manage your product catalog
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2"
              data-ocid="products.add_product.button"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>

          {productsLoading ? (
            <div
              className="flex justify-center py-12"
              data-ocid="products.loading_state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <Card data-ocid="products.empty_state">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No products yet. Click "Add Product" to create your first
                  product.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Selection toolbar */}
              <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    data-ocid="products.select_all.checkbox"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    {allSelected
                      ? "Deselect All"
                      : `Select All (${products.length})`}
                  </label>
                </div>
                {someSelected && (
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.size} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowMassDeleteDialog(true)}
                      data-ocid="products.mass_delete.button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected ({selectedIds.size})
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, idx) => {
                  const imageUrl = product.images[0]?.getDirectURL();
                  const isSelected = selectedIds.has(product.id);
                  return (
                    <Card
                      key={product.id}
                      className={`relative transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
                      data-ocid={`products.product.item.${idx + 1}`}
                    >
                      {/* Checkbox overlay on image */}
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-white/90 backdrop-blur-sm rounded p-0.5 shadow-sm">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(product.id)}
                            data-ocid={`products.product.checkbox.${idx + 1}`}
                          />
                        </div>
                      </div>

                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleSelect(product.id)}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted rounded-md" />
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <CardTitle className="font-serif">
                          {product.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-lg font-semibold text-primary">
                            ${(Number(product.price) / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Stock: {Number(product.inventory)}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(product)}
                          data-ocid={`products.product.edit_button.${idx + 1}`}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(product.id)}
                          disabled={deleteProduct.isPending}
                          data-ocid={`products.product.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mass delete confirmation dialog */}
      <AlertDialog
        open={showMassDeleteDialog}
        onOpenChange={setShowMassDeleteDialog}
      >
        <AlertDialogContent data-ocid="products.mass_delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} product{selectedIds.size > 1 ? "s" : ""}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>
                {selectedIds.size} product{selectedIds.size > 1 ? "s" : ""}
              </strong>{" "}
              from your catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isMassDeleting}
              data-ocid="products.mass_delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMassDelete}
              disabled={isMassDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="products.mass_delete.confirm_button"
            >
              {isMassDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminGuard>
  );
}
