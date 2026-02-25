import React, { useState } from 'react';
import { ProductVariant } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  productId: string;
}

interface VariantFormState {
  id: string;
  size: string;
  color: string;
  price: string;
  inventory: string;
}

const emptyVariantForm = (): VariantFormState => ({
  id: `variant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  size: '',
  color: '',
  price: '',
  inventory: '',
});

export default function VariantManager({ variants, onChange, productId }: VariantManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<VariantFormState>(emptyVariantForm());
  const [formErrors, setFormErrors] = useState<Partial<VariantFormState>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  const validateForm = (): boolean => {
    const errors: Partial<VariantFormState> = {};
    if (!form.size.trim()) errors.size = 'Size is required';
    if (!form.color.trim()) errors.color = 'Color is required';
    if (!form.price || Number(form.price) <= 0) errors.price = 'Price must be greater than 0';
    if (form.inventory === '' || Number(form.inventory) < 0) errors.inventory = 'Inventory must be 0 or more';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // parentProductId: use productId if available (editing existing product),
    // or a placeholder for new products — the backend will auto-set the correct value
    const newVariant: ProductVariant = {
      id: form.id,
      size: form.size.trim(),
      color: form.color.trim(),
      price: BigInt(Math.round(Number(form.price))),
      inventory: BigInt(Math.round(Number(form.inventory))),
      parentProductId: productId || 'pending', // backend overwrites this for new products
    };

    if (editingIndex !== null) {
      const updated = [...variants];
      updated[editingIndex] = newVariant;
      onChange(updated);
      setEditingIndex(null);
    } else {
      onChange([...variants, newVariant]);
    }

    setForm(emptyVariantForm());
    setFormErrors({});
    setShowAddForm(false);
  };

  const handleEdit = (index: number) => {
    const v = variants[index];
    setForm({
      id: v.id,
      size: v.size,
      color: v.color,
      price: String(Number(v.price)),
      inventory: String(Number(v.inventory)),
    });
    setFormErrors({});
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleDelete = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setForm(emptyVariantForm());
      setFormErrors({});
      setShowAddForm(false);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setForm(emptyVariantForm());
    setFormErrors({});
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Existing Variants List */}
      {variants.length > 0 ? (
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{variant.size} / {variant.color}</span>
                <span className="text-muted-foreground">₱{Number(variant.price).toLocaleString()}</span>
                <span className="text-muted-foreground">Stock: {Number(variant.inventory)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(index)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No variants added yet. You can save the product without variants, or add variants below.
        </p>
      )}

      {/* Add/Edit Form */}
      {showAddForm ? (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">
              {editingIndex !== null ? 'Edit Variant' : 'New Variant'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Size *</Label>
                <Input
                  value={form.size}
                  onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                  placeholder="e.g. Small, M, 10cm"
                  className={formErrors.size ? 'border-destructive' : ''}
                />
                {formErrors.size && <p className="text-xs text-destructive">{formErrors.size}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color *</Label>
                <Input
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="e.g. Green, Natural"
                  className={formErrors.color ? 'border-destructive' : ''}
                />
                {formErrors.color && <p className="text-xs text-destructive">{formErrors.color}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (₱) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  className={formErrors.price ? 'border-destructive' : ''}
                />
                {formErrors.price && <p className="text-xs text-destructive">{formErrors.price}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Inventory *</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.inventory}
                  onChange={e => setForm(f => ({ ...f, inventory: e.target.value }))}
                  placeholder="0"
                  className={formErrors.inventory ? 'border-destructive' : ''}
                />
                {formErrors.inventory && <p className="text-xs text-destructive">{formErrors.inventory}</p>}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleSave}>
                {editingIndex !== null ? 'Update Variant' : 'Add Variant'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { setForm(emptyVariantForm()); setShowAddForm(true); }}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variant
        </Button>
      )}
    </div>
  );
}
