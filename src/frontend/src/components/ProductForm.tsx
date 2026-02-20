import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Upload, X, AlertCircle } from 'lucide-react';
import { useAddProduct, useUpdateProduct } from '../hooks/useProducts';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
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

  const isEditing = !!product;

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
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Check for authorization/authentication errors first
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Only admins can')) {
      // Provide specific guidance based on authentication state
      if (!identity) {
        return 'Authentication Error: You must be logged in with Internet Identity AND have admin privileges. Please log in with Internet Identity first, then use the Admin Login with passcode.';
      } else if (!isAdminAuthenticated) {
        return 'Authorization Error: You are logged in with Internet Identity, but you need to authenticate as admin using the Admin Login button with the passcode (09131991).';
      } else {
        return 'Permission Denied: Your Internet Identity account does not have admin privileges. Please contact the system administrator to grant admin access to your principal ID.';
      }
    }
    
    // Extract specific field errors from backend trap messages
    if (errorMessage.includes('Price must be provided')) {
      return 'One or more variants are missing price values';
    }
    if (errorMessage.includes('Inventory must be provided')) {
      return 'One or more variants are missing inventory values';
    }
    if (errorMessage.includes('Color must be provided')) {
      return 'One or more variants are missing color values';
    }
    if (errorMessage.includes('Size must be provided')) {
      return 'One or more variants are missing size values';
    }
    if (errorMessage.includes('Id must be provided')) {
      return 'Variant ID generation failed - please try again';
    }
    if (errorMessage.includes('parentProductId must be provided')) {
      return 'Variant parent product ID is missing - please try again';
    }
    if (errorMessage.includes('required to provide data for each of the 4 available variants')) {
      return 'Backend requires exactly 4 variants: 2X2, 3X3, 4X4, and 6X6';
    }
    if (errorMessage.includes('must provide data for all 4 available variants')) {
      return 'Backend requires all 4 specific variants: 2X2, 3X3, 4X4, and 6X6';
    }
    if (errorMessage.includes('Product not found')) {
      return 'Product not found - it may have been deleted';
    }
    
    // Return the original error message if no specific pattern matched
    return errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous validation errors
    setValidationErrors([]);

    // Log authentication state at form submission
    console.log('=== FORM SUBMISSION AUTH CHECK ===');
    console.log('Admin authenticated (passcode):', isAdminAuthenticated);
    console.log('Internet Identity logged in:', !!identity);
    console.log('Principal ID:', identity?.getPrincipal().toString() || 'anonymous');
    console.log('==================================');

    // Check admin authentication before validation
    if (!isAdminAuthenticated) {
      const error = 'You must be logged in as admin to add or edit products. Please use the Admin Login button.';
      setValidationErrors([error]);
      toast.error(error);
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    const priceInCents = Math.round(parseFloat(price) * 100);
    const inventoryCount = hasVariants ? 0 : parseInt(inventory);

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

      console.log('=== SUBMITTING PRODUCT ===');
      console.log('Form state at submission:', {
        isEditing,
        productId: product?.id,
        hasVariants,
        variantCount: variants.length,
        imageCount: images.length,
      });
      console.log('==========================');

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
    } catch (error: any) {
      console.error('=== PRODUCT SUBMISSION FAILED ===');
      console.error('Error caught in form handler:', error);
      console.error('Admin auth state:', isAdminAuthenticated);
      console.error('II auth state:', !!identity);
      console.error('=================================');
      
      const errorMessage = parseBackendError(error);
      setValidationErrors([errorMessage]);
      toast.error(errorMessage);
      console.error('Product submission error:', error);
    }
  };

  const isPending = addProduct.isPending || updateProduct.isPending;

  // Check if variants are incomplete
  const hasIncompleteVariants = hasVariants && variants.some(v => 
    !v.size || !v.color || !v.price || v.inventory === undefined
  );

  // Disable submit if variants are incomplete
  const isSubmitDisabled = isPending || (hasVariants && (variants.length === 0 || hasIncompleteVariants));

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
            {/* Admin Authentication Warning */}
            {!isAdminAuthenticated && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">Admin Authentication Required</div>
                  <p>You must be logged in as admin to add or edit products. Please use the "Admin Login" button in the header.</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Please fix the following errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
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
              <Label htmlFor="price">Base Price ($) *</Label>
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
              <p className="text-xs text-muted-foreground">
                {hasVariants ? 'This is the base price. Individual variant prices will be used for checkout.' : 'This is the price customers will pay.'}
              </p>
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
                <Label htmlFor="inventory">Inventory *</Label>
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
              <Label htmlFor="images">Product Images {!isEditing && '*'}</Label>
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
                <>
                  <Upload className="mr-2 h-4 w-4" />
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
