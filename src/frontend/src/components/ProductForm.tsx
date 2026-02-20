import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { useAddProduct, useUpdateProduct } from '../hooks/useProducts';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import type { Product, ProductVariant } from '../backend';
import VariantManager from './VariantManager';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? (Number(product.price) / 100).toString() : '');
  const [inventory, setInventory] = useState(product ? Number(product.inventory).toString() : '');
  const [hasVariants, setHasVariants] = useState(product?.hasVariants || false);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();

  const isEditing = !!product;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (hasVariants && variants.length === 0) {
      toast.error('Please add at least one variant or disable variants');
      return;
    }

    if (!hasVariants && !inventory) {
      toast.error('Please enter inventory quantity');
      return;
    }

    const priceInCents = Math.round(parseFloat(price) * 100);
    const inventoryCount = hasVariants ? 0 : parseInt(inventory);

    if (priceInCents <= 0 || (!hasVariants && inventoryCount < 0)) {
      toast.error('Invalid price or inventory');
      return;
    }

    try {
      let images: ExternalBlob[] = [];

      if (imageFiles.length > 0) {
        setUploadProgress(0);
        const imagePromises = imageFiles.map(async (file, index) => {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
            setUploadProgress((prev) => Math.max(prev, (index + percentage / 100) / imageFiles.length * 100));
          });
          return blob;
        });
        images = await Promise.all(imagePromises);
      } else if (product?.images) {
        images = product.images;
      }

      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: BigInt(priceInCents),
        inventory: BigInt(inventoryCount),
        hasVariants,
        variants: hasVariants ? variants : undefined,
      };

      if (isEditing) {
        await updateProduct.mutateAsync({
          productId: product.id,
          productData,
          images,
        });
        toast.success('Product updated successfully');
      } else {
        await addProduct.mutateAsync({ productData, images });
        toast.success('Product added successfully');
      }

      onClose();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update product' : 'Failed to add product');
      console.error(error);
    }
  };

  const isPending = addProduct.isPending || updateProduct.isPending;

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" onClick={onClose} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasVariants"
                checked={hasVariants}
                onCheckedChange={(checked) => setHasVariants(checked === true)}
              />
              <Label htmlFor="hasVariants" className="cursor-pointer">
                Enable Variants (sizes and colors)
              </Label>
            </div>

            {hasVariants ? (
              <VariantManager
                variants={variants}
                onChange={setVariants}
                productId={product?.id || 'new'}
              />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory</Label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="images">Product Images</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="flex-1"
                />
                {imageFiles.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setImageFiles([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {imageFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {imageFiles.length} file(s) selected
                </p>
              )}
              {product?.images && imageFiles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Current: {product.images.length} image(s)
                </p>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <Label>Upload Progress</Label>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>

          <CardFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {isEditing ? 'Update Product' : 'Add Product'}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
