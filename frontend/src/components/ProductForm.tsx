import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, WifiOff, ShieldAlert, CheckCircle2, Plus, X } from 'lucide-react';
import { useAddProduct, useUpdateProduct } from '../hooks/useProducts';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { ExternalBlob } from '../backend';
import type { Product, CreateProductData, ProductVariant } from '../backend';
import VariantManager from './VariantManager';

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
  /** Legacy alias for onCancel — kept for backward compatibility */
  onClose?: () => void;
}

/** Reusable multi-value tag input for categories, colors, sizes */
function TagInput({
  label,
  values,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');

  const addValue = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue('');
  };

  const removeValue = (val: string) => {
    onChange(values.filter((v) => v !== val));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addValue();
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addValue}
          disabled={disabled || !inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {values.map((val) => (
            <Badge key={val} variant="secondary" className="gap-1 pr-1">
              {val}
              <button
                type="button"
                onClick={() => removeValue(val)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductForm({ product, onSuccess, onCancel, onClose }: ProductFormProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isAdminAuthenticated, isInitializingAdmin } = useAdminAuth();

  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [skuError, setSkuError] = useState('');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? Number(product.price) / 100 : 0);
  const [inventory, setInventory] = useState(product ? Number(product.inventory) : 0);
  const [hasVariants, setHasVariants] = useState(product?.hasVariants || false);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages] = useState<ExternalBlob[]>(product?.images || []);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Attribute fields
  const [categories, setCategories] = useState<string[]>(product?.categories || []);
  const [colors, setColors] = useState<string[]>(product?.colors || []);
  const [sizes, setSizes] = useState<string[]>(product?.sizes || []);

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();

  const isEditing = !!product;
  const isLoading = addProduct.isPending || updateProduct.isPending;

  // Resolve cancel handler — support both prop names
  const handleCancel = onCancel || onClose;

  // Determine connection status
  const getConnectionStatus = () => {
    if (actorFetching || isInitializingAdmin) return 'initializing';
    if (!actor) return 'no_actor';
    if (!identity) return 'no_identity';
    if (!isAdminAuthenticated) return 'no_admin';
    return 'ready';
  };

  const connectionStatus = getConnectionStatus();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSku(e.target.value);
    if (e.target.value.trim()) {
      setSkuError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actor) {
      toast.error('Cannot reach backend. Please check your connection and try again.', {
        description: 'The backend actor is not available. Try refreshing the page.',
        duration: 6000,
      });
      return;
    }

    if (!identity) {
      toast.error('Authentication required', {
        description: 'Please log in with Internet Identity before adding products.',
        duration: 5000,
      });
      return;
    }

    if (!isAdminAuthenticated) {
      toast.error('Admin authentication required', {
        description: 'Please log in as admin before adding products.',
        duration: 5000,
      });
      return;
    }

    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!sku.trim()) {
      setSkuError('SKU is required');
      toast.error('SKU is required');
      return;
    }

    // Build images array
    let images: ExternalBlob[] = [...existingImages];
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress(pct);
        });
        images.push(blob);
      }
    }

    // Variants are optional — send them only if hasVariants is true AND variants exist
    const productData: CreateProductData = {
      name: name.trim(),
      description: description.trim(),
      price: BigInt(Math.round(price * 100)),
      inventory: BigInt(inventory),
      hasVariants,
      variants: hasVariants && variants.length > 0 ? variants : undefined,
      sku: sku.trim(),
      categories,
      colors,
      sizes,
    };

    const handleError = (err: unknown) => {
      const message = (err as any)?.message || String(err);

      if (message.includes('BACKEND_UNAVAILABLE') || message.includes('Backend actor is not available')) {
        toast.error('Cannot reach backend', {
          description: 'The backend is not reachable. Please check your connection and try again.',
          duration: 6000,
        });
      } else if (
        message.includes('PERMISSION_DENIED') ||
        message.includes('Permission Denied') ||
        message.includes('not registered as an admin') ||
        message.includes('Unauthorized') ||
        message.includes('Only admins')
      ) {
        toast.error('Permission Denied', {
          description:
            'Your Internet Identity principal is not registered as an admin in the backend. Please log out and log back in as admin.',
          duration: 8000,
        });
      } else if (message.includes('variant') || message.includes('Variant')) {
        toast.error('Variant error', {
          description: message,
          duration: 6000,
        });
      } else {
        toast.error('Failed to save product', {
          description: message,
          duration: 5000,
        });
      }
    };

    if (isEditing && product) {
      updateProduct.mutate(
        { productId: product.id, product: productData, images },
        {
          onSuccess: () => {
            toast.success('Product updated successfully');
            setUploadProgress(0);
            onSuccess?.();
          },
          onError: handleError,
        }
      );
    } else {
      addProduct.mutate(
        { product: productData, images },
        {
          onSuccess: () => {
            toast.success('Product added successfully');
            setUploadProgress(0);
            setName('');
            setSku('');
            setSkuError('');
            setDescription('');
            setPrice(0);
            setInventory(0);
            setHasVariants(false);
            setVariants([]);
            setImageFiles([]);
            setCategories([]);
            setColors([]);
            setSizes([]);
            onSuccess?.();
          },
          onError: handleError,
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-bold">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditing ? 'Update the product details below.' : 'Fill in the details to add a new product to your catalog.'}
        </p>
      </div>

      {/* Connection Status Alerts */}
      {connectionStatus === 'initializing' && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          <AlertTitle className="text-amber-600">Initializing Backend Connection</AlertTitle>
          <AlertDescription className="text-amber-600/80">
            Please wait while the backend connection is being established...
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'no_actor' && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Backend Not Available</AlertTitle>
          <AlertDescription>
            Cannot connect to the backend. Please refresh the page and try again. If the problem
            persists, the canister may still be deploying.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'no_identity' && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Internet Identity Required</AlertTitle>
          <AlertDescription>
            Please log in with Internet Identity (the Login button in the header) before adding
            products.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'no_admin' && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Admin Authentication Required</AlertTitle>
          <AlertDescription>
            You must be logged in as admin to add or edit products. Please use the Admin Login
            button.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'ready' && (
        <Alert className="border-emerald-500/50 bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle className="text-emerald-600">Ready</AlertTitle>
          <AlertDescription className="text-emerald-600/80">
            Backend connected and admin authenticated. You can submit the form.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Basic Info ── */}
      <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/10">
        <p className="text-sm font-semibold text-foreground">Basic Information</p>

        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter product name"
            required
            disabled={isLoading}
          />
        </div>

        {/* SKU — placed directly under name for visibility */}
        <div className="space-y-2">
          <Label htmlFor="sku">
            SKU (Stock Keeping Unit) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sku"
            value={sku}
            onChange={handleSkuChange}
            placeholder="e.g. MSL-001, RING-GOLD-SM"
            disabled={isLoading}
            className={skuError ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {skuError ? (
            <p className="text-xs text-destructive">{skuError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              A unique identifier for this product (alphanumeric, hyphens allowed).
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter product description"
            rows={4}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* ── Pricing & Inventory ── */}
      <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/10">
        <p className="text-sm font-semibold text-foreground">Pricing &amp; Inventory</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">
              Price (USD) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              disabled={isLoading || hasVariants}
            />
            {hasVariants && (
              <p className="text-xs text-muted-foreground">Price is set per variant</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory">
              Inventory <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inventory"
              type="number"
              min="0"
              value={inventory}
              onChange={(e) => setInventory(parseInt(e.target.value) || 0)}
              placeholder="0"
              disabled={isLoading || hasVariants}
            />
            {hasVariants && (
              <p className="text-xs text-muted-foreground">Inventory is set per variant</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Images ── */}
      <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/10">
        <p className="text-sm font-semibold text-foreground">Product Images</p>
        <div className="space-y-2">
          <Label htmlFor="images">Upload Images</Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={isLoading}
          />
          {existingImages.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {existingImages.length} existing image(s). Upload new files to replace them.
            </p>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Product Attributes ── */}
      <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/10">
        <p className="text-sm font-semibold text-foreground">
          Product Attributes{' '}
          <span className="text-muted-foreground font-normal">(for customer filtering)</span>
        </p>

        <TagInput
          label="Categories"
          values={categories}
          onChange={setCategories}
          placeholder="e.g. Jewellery, Candles..."
          disabled={isLoading}
        />

        <TagInput
          label="Colors"
          values={colors}
          onChange={setColors}
          placeholder="e.g. Gold, Silver, Black..."
          disabled={isLoading}
        />

        <TagInput
          label="Sizes"
          values={sizes}
          onChange={setSizes}
          placeholder="e.g. Small, Medium, Large, XL..."
          disabled={isLoading}
        />
      </div>

      {/* ── Variants ── */}
      <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/10">
        <p className="text-sm font-semibold text-foreground">Variants</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id="hasVariants"
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              disabled={isLoading}
              className="rounded border-border"
            />
            <Label htmlFor="hasVariants">This product has variants (size / color)</Label>
          </div>
          {hasVariants && (
            <p className="text-xs text-muted-foreground pl-6">
              Variants are optional — you can save the product without adding any variants.
            </p>
          )}
        </div>

        {hasVariants && (
          <div className="space-y-2">
            <Label>
              Variants{' '}
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <VariantManager
              variants={variants}
              onChange={setVariants}
              productId={product?.id ?? ''}
            />
          </div>
        )}
      </div>

      {/* Error display from mutation */}
      {(addProduct.isError || updateProduct.isError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {(() => {
              const err = addProduct.error || updateProduct.error;
              const msg = (err as any)?.message || String(err);
              if (
                msg.includes('BACKEND_UNAVAILABLE') ||
                msg.includes('Backend actor is not available')
              ) {
                return 'Cannot reach backend. Please check your connection and try again.';
              }
              if (
                msg.includes('PERMISSION_DENIED') ||
                msg.includes('Permission Denied') ||
                msg.includes('not registered as an admin')
              ) {
                return 'Permission Denied: Your Internet Identity principal is not registered as an admin. Please log out and log back in as admin.';
              }
              return msg;
            })()}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Product' : 'Add Product'}
        </Button>
        {handleCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
