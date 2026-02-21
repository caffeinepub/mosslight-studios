import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAddProduct, useUpdateProduct } from '../hooks/useProducts';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const { isAdminAuthenticated } = useAdminAuth();
  const { identity } = useInternetIdentity();
  const { actor } = useActor();

  const isEditing = !!product;
  const productId = product?.id || 'new-product';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('Product name is required');
    }

    if (!description.trim()) {
      errors.push('Product description is required');
    }

    if (!price || parseFloat(price) <= 0) {
      errors.push('Valid price is required');
    }

    if (hasVariants) {
      if (variants.length === 0) {
        errors.push('At least one variant is required when variants are enabled');
      } else {
        // Check each variant for completeness
        const incompleteVariants = variants.filter(v => 
          !v.size || !v.color || !v.price || v.inventory === undefined
        );
        
        if (incompleteVariants.length > 0) {
          errors.push(`${incompleteVariants.length} variant(s) are missing required fields (size, color, price, or inventory)`);
        }

        // Validate variant prices
        const invalidPriceVariants = variants.filter(v => Number(v.price) <= 0);
        if (invalidPriceVariants.length > 0) {
          errors.push(`${invalidPriceVariants.length} variant(s) have invalid prices (must be greater than 0)`);
        }

        // Validate variant inventory
        const invalidInventoryVariants = variants.filter(v => Number(v.inventory) < 0);
        if (invalidInventoryVariants.length > 0) {
          errors.push(`${invalidInventoryVariants.length} variant(s) have invalid inventory (must be 0 or greater)`);
        }
      }
    } else {
      if (!inventory || parseInt(inventory) < 0) {
        errors.push('Valid inventory quantity is required');
      }
    }

    if (!isEditing && imageFiles.length === 0) {
      errors.push('At least one product image is required');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const parseBackendError = (error: any): string => {
    console.log('=== PARSING BACKEND ERROR ===');
    console.log('Error object:', error);
    console.log('Error type:', typeof error);
    console.log('Error keys:', Object.keys(error || {}));
    
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    console.log('Extracted error message:', errorMessage);
    
    // Check for authorization/authentication errors first
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Only admins can')) {
      console.log('Authorization error detected');
      // Provide specific guidance based on authentication state
      if (!identity) {
        return 'Authentication Error: You must be logged in with Internet Identity first. Please log in, then use Admin Login with the passcode.';
      } else if (!isAdminAuthenticated) {
        return 'Authorization Error: You need to authenticate as admin using the Admin Login button with the passcode.';
      } else {
        return 'Permission Denied: Your Internet Identity principal is not registered as an admin in the backend. Please ensure you completed the admin setup process. Your principal: ' + identity.getPrincipal().toString();
      }
    }
    
    // Extract specific field errors from backend trap messages
    if (errorMessage.includes('Price must be provided')) {
      return 'Backend Error: One or more variants are missing price values';
    }
    if (errorMessage.includes('Inventory must be provided')) {
      return 'Backend Error: One or more variants are missing inventory values';
    }
    if (errorMessage.includes('Color must be provided')) {
      return 'Backend Error: One or more variants are missing color values';
    }
    if (errorMessage.includes('Size must be provided')) {
      return 'Backend Error: One or more variants are missing size values';
    }
    if (errorMessage.includes('Id must be provided')) {
      return 'Backend Error: Variant ID generation failed - please try again';
    }
    if (errorMessage.includes('parentProductId must be provided')) {
      return 'Backend Error: Variant parent product ID is missing - please try again';
    }
    if (errorMessage.includes('required to provide data for each of the 4 available variants')) {
      return 'Backend Error: Backend requires exactly 4 variants: 2X2, 3X3, 4X4, and 6X6';
    }
    if (errorMessage.includes('must provide data for all 4 available variants')) {
      return 'Backend Error: Backend requires all 4 specific variants: 2X2, 3X3, 4X4, and 6X6';
    }
    if (errorMessage.includes('Product not found')) {
      return 'Backend Error: Product not found - it may have been deleted';
    }
    
    // Return the original error message if no specific pattern matched
    console.log('No specific error pattern matched, returning original message');
    return 'Backend Error: ' + errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== PRODUCT FORM SUBMISSION STARTED ===');
    console.log('Frontend Authentication State:', {
      hasInternetIdentity: !!identity,
      identityPrincipal: identity?.getPrincipal().toString() || 'none',
      isAnonymous: identity?.getPrincipal().isAnonymous() || 'N/A',
      isAdminAuthenticated,
      hasActor: !!actor,
    });

    // Clear previous validation errors
    setValidationErrors([]);

    // Check Internet Identity authentication first
    if (!identity) {
      const error = 'You must be logged in with Internet Identity to add or edit products.';
      console.error('❌ Authentication check failed:', error);
      setValidationErrors([error]);
      toast.error(error);
      return;
    }

    console.log('✓ Internet Identity check passed');

    // Check admin authentication
    if (!isAdminAuthenticated) {
      const error = 'You must be authenticated as admin. Please use the Admin Login button with the passcode.';
      console.error('❌ Admin authentication check failed:', error);
      setValidationErrors([error]);
      toast.error(error);
      return;
    }

    console.log('✓ Admin authentication check passed');

    // Check actor availability
    if (!actor) {
      const error = 'Backend actor not available. Please refresh the page and try again.';
      console.error('❌ Actor availability check failed');
      setValidationErrors([error]);
      toast.error(error);
      return;
    }

    console.log('✓ Actor availability check passed');

    // Validate form
    if (!validateForm()) {
      console.error('❌ Form validation failed');
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    console.log('✓ Form validation passed');

    const priceInCents = Math.round(parseFloat(price) * 100);
    const inventoryCount = hasVariants ? 0 : parseInt(inventory);

    console.log('Prepared data:', {
      priceInCents,
      inventoryCount,
      hasVariants,
      variantCount: variants.length,
    });

    try {
      let images: ExternalBlob[] = [];

      if (imageFiles.length > 0) {
        console.log('Processing image files:', imageFiles.length);
        setUploadProgress(0);
        const imagePromises = imageFiles.map(async (file, index) => {
          console.log(`Processing image ${index + 1}:`, file.name, file.size, 'bytes');
          const bytes = new Uint8Array(await file.arrayBuffer());
          const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
            setUploadProgress((prev) => Math.max(prev, (index + percentage / 100) / imageFiles.length * 100));
          });
          return blob;
        });
        images = await Promise.all(imagePromises);
        console.log('✓ All images processed successfully');
      } else if (product?.images) {
        console.log('Using existing product images:', product.images.length);
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

      console.log('Final product data prepared:', {
        name: productData.name,
        hasVariants: productData.hasVariants,
        variantCount: productData.variants?.length || 0,
        imageCount: images.length,
      });

      if (isEditing) {
        console.log('→ Calling updateProduct mutation...');
        await updateProduct.mutateAsync({
          productId: product.id,
          productData,
          images,
        });
        toast.success('Product updated successfully');
      } else {
        console.log('→ Calling addProduct mutation...');
        await addProduct.mutateAsync({ productData, images });
        toast.success('Product added successfully');
      }

      console.log('=== ✓ FORM SUBMISSION SUCCESSFUL ===');
      onClose();
    } catch (error: any) {
      console.error('=== ❌ FORM SUBMISSION ERROR ===');
      console.error('Caught error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      const errorMessage = parseBackendError(error);
      console.error('Parsed error message:', errorMessage);
      
      setValidationErrors([errorMessage]);
      toast.error(errorMessage);
    }
  };

  const isPending = addProduct.isPending || updateProduct.isPending;

  // Check if variants are incomplete
  const hasIncompleteVariants = hasVariants && variants.some(v => 
    !v.size || !v.color || !v.price || v.inventory === undefined
  );

  // Disable submit if not authenticated or variants are incomplete
  const isSubmitDisabled = isPending || !identity || !isAdminAuthenticated || hasIncompleteVariants;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="font-serif text-3xl">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Authentication status display */}
          <div className="space-y-2">
            <Alert variant={identity && isAdminAuthenticated && actor ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {identity ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                    <span>Internet Identity: {identity ? `Logged in (${identity.getPrincipal().toString().slice(0, 10)}...)` : 'Not logged in'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminAuthenticated ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                    <span>Admin Authentication: {isAdminAuthenticated ? 'Authenticated' : 'Not authenticated'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {actor ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                    <span>Backend Actor: {actor ? 'Connected' : 'Not available'}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Authentication warnings */}
          {!identity && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must be logged in with Internet Identity to add or edit products.
              </AlertDescription>
            </Alert>
          )}

          {identity && !isAdminAuthenticated && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must authenticate as admin using the Admin Login button with the passcode.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Incomplete variants warning */}
          {hasIncompleteVariants && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some variants are missing required fields. Please complete all variant information before submitting.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              disabled={isPending}
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
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              disabled={isPending || hasVariants}
            />
            {hasVariants && (
              <p className="text-sm text-muted-foreground">
                Price will be determined by variant prices
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasVariants"
              checked={hasVariants}
              onCheckedChange={(checked) => setHasVariants(checked as boolean)}
              disabled={isPending}
            />
            <Label htmlFor="hasVariants" className="cursor-pointer">
              This product has variants (sizes/colors)
            </Label>
          </div>

          {hasVariants ? (
            <VariantManager
              variants={variants}
              onChange={setVariants}
              productId={productId}
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="inventory">Inventory</Label>
              <Input
                id="inventory"
                type="number"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
                placeholder="0"
                disabled={isPending}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="images">Product Images</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={isPending}
            />
            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      disabled={isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {isEditing && product?.images && imageFiles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Current images will be kept if no new images are uploaded
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

        <CardFooter className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitDisabled}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>{isEditing ? 'Update Product' : 'Add Product'}</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
