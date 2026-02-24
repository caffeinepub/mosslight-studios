import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, WifiOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
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

export default function ProductForm({ product, onSuccess, onCancel, onClose }: ProductFormProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isAdminAuthenticated, isInitializingAdmin } = useAdminAuth();

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? Number(product.price) / 100 : 0);
  const [inventory, setInventory] = useState(product ? Number(product.inventory) : 0);
  const [hasVariants, setHasVariants] = useState(product?.hasVariants || false);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages] = useState<ExternalBlob[]>(product?.images || []);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();

  const isEditing = !!product;
  const isLoading = addProduct.isPending || updateProduct.isPending;

  // Resolve cancel handler — support both prop names
  const handleCancel = onCancel || onClose;

  // Determine connection status
  const isActorReady = !!actor && !actorFetching && !isInitializingAdmin;
  const isIdentityReady = !!identity;
  const isAdminReady = isAdminAuthenticated;

  const getConnectionStatus = () => {
    if (actorFetching || isInitializingAdmin) return 'initializing';
    if (!actor) return 'no_actor';
    if (!isIdentityReady) return 'no_identity';
    if (!isAdminReady) return 'no_admin';
    return 'ready';
  };

  const connectionStatus = getConnectionStatus();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
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

    const productData: CreateProductData = {
      name: name.trim(),
      description: description.trim(),
      price: BigInt(Math.round(price * 100)),
      inventory: BigInt(inventory),
      hasVariants,
      variants: hasVariants ? variants : undefined,
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
            setDescription('');
            setPrice(0);
            setInventory(0);
            setHasVariants(false);
            setVariants([]);
            setImageFiles([]);
            onSuccess?.();
          },
          onError: handleError,
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Form Fields */}
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter product name"
          required
          disabled={isLoading}
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
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (USD) *</Label>
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
          <Label htmlFor="inventory">Inventory *</Label>
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

      <div className="space-y-2">
        <Label htmlFor="images">Product Images</Label>
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
          <Label htmlFor="hasVariants">This product has variants (size/color)</Label>
        </div>
      </div>

      {hasVariants && (
        <div className="space-y-2">
          <Label>Variants</Label>
          <VariantManager
            variants={variants}
            onChange={setVariants}
            productId={product?.id ?? ''}
          />
        </div>
      )}

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

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading || !isActorReady || !isIdentityReady || !isAdminReady}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Adding...'}
            </>
          ) : isEditing ? (
            'Update Product'
          ) : (
            'Add Product'
          )}
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
