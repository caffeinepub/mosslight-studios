import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { ProductVariant } from '../backend';

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  productId: string;
}

export default function VariantManager({ variants, onChange, productId }: VariantManagerProps) {
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editInventory, setEditInventory] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    size?: string;
    color?: string;
    price?: string;
    inventory?: string;
  }>({});

  const validateFields = () => {
    const errors: typeof fieldErrors = {};
    
    if (!size.trim()) {
      errors.size = 'Size is required';
    }
    
    if (!color.trim()) {
      errors.color = 'Color is required';
    }
    
    if (!price) {
      errors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        errors.price = 'Price must be a positive number';
      }
    }
    
    if (!inventory) {
      errors.inventory = 'Inventory is required';
    } else {
      const inventoryNum = parseInt(inventory);
      if (isNaN(inventoryNum) || inventoryNum < 0) {
        errors.inventory = 'Inventory must be 0 or greater';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddVariant = () => {
    if (!validateFields()) {
      toast.error('Please fix the errors in the variant fields');
      return;
    }

    const priceNum = parseFloat(price);
    const inventoryNum = parseInt(inventory);

    const newVariant: ProductVariant = {
      id: crypto.randomUUID(),
      size: size.trim(),
      color: color.trim(),
      price: BigInt(Math.round(priceNum * 100)),
      inventory: BigInt(inventoryNum),
      parentProductId: productId,
    };

    onChange([...variants, newVariant]);
    setSize('');
    setColor('');
    setPrice('');
    setInventory('');
    setFieldErrors({});
    toast.success('Variant added');
  };

  const handleRemoveVariant = (variantId: string) => {
    onChange(variants.filter(v => v.id !== variantId));
    toast.success('Variant removed');
  };

  const handleStartEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setEditPrice((Number(variant.price) / 100).toFixed(2));
    setEditInventory(Number(variant.inventory).toString());
  };

  const handleSaveEdit = (variantId: string) => {
    const priceNum = parseFloat(editPrice);
    const inventoryNum = parseInt(editInventory);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Price must be a positive number');
      return;
    }

    if (isNaN(inventoryNum) || inventoryNum < 0) {
      toast.error('Inventory must be 0 or greater');
      return;
    }

    onChange(
      variants.map(v =>
        v.id === variantId
          ? { 
              ...v, 
              price: BigInt(Math.round(priceNum * 100)),
              inventory: BigInt(inventoryNum) 
            }
          : v
      )
    );
    setEditingId(null);
    setEditPrice('');
    setEditInventory('');
    toast.success('Variant updated');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
    setEditInventory('');
  };

  // Check if all variants have complete data
  const hasIncompleteVariants = variants.some(v => 
    !v.size || !v.color || !v.price || v.inventory === undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Product Variants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Variant Form */}
        <div className="grid grid-cols-5 gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="variant-size">Size *</Label>
            <Input
              id="variant-size"
              value={size}
              onChange={(e) => {
                setSize(e.target.value);
                if (fieldErrors.size) {
                  setFieldErrors({ ...fieldErrors, size: undefined });
                }
              }}
              placeholder="e.g., Small, M, XL"
              className={fieldErrors.size ? 'border-destructive' : ''}
            />
            {fieldErrors.size && (
              <p className="text-xs text-destructive">{fieldErrors.size}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="variant-color">Color *</Label>
            <Input
              id="variant-color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (fieldErrors.color) {
                  setFieldErrors({ ...fieldErrors, color: undefined });
                }
              }}
              placeholder="e.g., Red, Blue"
              className={fieldErrors.color ? 'border-destructive' : ''}
            />
            {fieldErrors.color && (
              <p className="text-xs text-destructive">{fieldErrors.color}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="variant-price">Price ($) *</Label>
            <Input
              id="variant-price"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (fieldErrors.price) {
                  setFieldErrors({ ...fieldErrors, price: undefined });
                }
              }}
              placeholder="0.00"
              className={fieldErrors.price ? 'border-destructive' : ''}
            />
            {fieldErrors.price && (
              <p className="text-xs text-destructive">{fieldErrors.price}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="variant-inventory">Inventory *</Label>
            <Input
              id="variant-inventory"
              type="number"
              min="0"
              value={inventory}
              onChange={(e) => {
                setInventory(e.target.value);
                if (fieldErrors.inventory) {
                  setFieldErrors({ ...fieldErrors, inventory: undefined });
                }
              }}
              placeholder="0"
              className={fieldErrors.inventory ? 'border-destructive' : ''}
            />
            {fieldErrors.inventory && (
              <p className="text-xs text-destructive">{fieldErrors.inventory}</p>
            )}
          </div>
          <Button onClick={handleAddVariant} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Variant
          </Button>
        </div>

        {/* Warning for incomplete variants */}
        {hasIncompleteVariants && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some variants are missing required fields. Please ensure all variants have size, color, price, and inventory values.
            </AlertDescription>
          </Alert>
        )}

        {/* Variants List */}
        {variants.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Inventory</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.size}</TableCell>
                    <TableCell>{variant.color}</TableCell>
                    <TableCell>
                      {editingId === variant.id ? (
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        `$${(Number(variant.price) / 100).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === variant.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editInventory}
                          onChange={(e) => setEditInventory(e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        Number(variant.inventory)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === variant.id ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveEdit(variant.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleStartEdit(variant)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No variants added yet. Add your first variant above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
