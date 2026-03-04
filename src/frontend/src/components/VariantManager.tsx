import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import type { ProductColor, ProductVariant } from "../backend";

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  productId: string;
}

interface VariantFormState {
  id: string;
  size: string;
  price: string;
}

interface VariantFormErrors {
  size?: string;
  price?: string;
}

const emptyVariantForm = (): VariantFormState => ({
  id: `variant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  size: "",
  price: "",
});

export default function VariantManager({
  variants,
  onChange,
  productId,
}: VariantManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<VariantFormState>(emptyVariantForm());
  const [formErrors, setFormErrors] = useState<VariantFormErrors>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedColors, setExpandedColors] = useState<Set<number>>(new Set());
  // Track whether the currently-editing variant is a freshly-duplicated (unsaved) entry
  const [isDuplicatePending, setIsDuplicatePending] = useState(false);

  const validateForm = (): boolean => {
    const errors: VariantFormErrors = {};
    if (!form.size.trim()) errors.size = "Size is required";
    if (!form.price || Number(form.price) <= 0)
      errors.price = "Price must be greater than 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const newVariant: ProductVariant = {
      id: form.id,
      size: form.size.trim(),
      colors: [],
      price: BigInt(Math.round(Number(form.price))),
      parentProductId: productId || "pending",
    };

    if (editingIndex !== null) {
      const updated = [...variants];
      // Preserve existing colors when editing
      updated[editingIndex] = {
        ...newVariant,
        colors: variants[editingIndex].colors,
      };
      onChange(updated);
      setEditingIndex(null);
    } else {
      onChange([...variants, newVariant]);
    }

    setForm(emptyVariantForm());
    setFormErrors({});
    setShowAddForm(false);
    setIsDuplicatePending(false);
  };

  const handleEdit = (index: number) => {
    const v = variants[index];
    setForm({
      id: v.id,
      size: v.size,
      price: String(Number(v.price)),
    });
    setFormErrors({});
    setEditingIndex(index);
    setShowAddForm(true);
    setIsDuplicatePending(false);
  };

  const handleDuplicate = (index: number) => {
    const source = variants[index];

    // Deep-copy the colors array
    const copiedColors: ProductColor[] = source.colors.map((c) => ({
      name: c.name,
      inventory: c.inventory,
    }));

    const newId = `variant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duplicatedVariant: ProductVariant = {
      id: newId,
      size: `${source.size} (copy)`,
      colors: copiedColors,
      price: source.price,
      parentProductId: productId || "pending",
    };

    // Append the duplicate right after the source variant
    const updated = [
      ...variants.slice(0, index + 1),
      duplicatedVariant,
      ...variants.slice(index + 1),
    ];
    onChange(updated);

    const newIndex = index + 1;

    // Immediately open edit mode for the duplicate
    setForm({
      id: newId,
      size: duplicatedVariant.size,
      price: String(Number(duplicatedVariant.price)),
    });
    setFormErrors({});
    setEditingIndex(newIndex);
    setShowAddForm(true);
    setIsDuplicatePending(true);
  };

  const handleDelete = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setForm(emptyVariantForm());
      setFormErrors({});
      setShowAddForm(false);
      setIsDuplicatePending(false);
    }
    setExpandedColors((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleCancel = () => {
    // If we're cancelling a pending duplicate, remove it from the list
    if (isDuplicatePending && editingIndex !== null) {
      onChange(variants.filter((_, i) => i !== editingIndex));
    }
    setEditingIndex(null);
    setForm(emptyVariantForm());
    setFormErrors({});
    setShowAddForm(false);
    setIsDuplicatePending(false);
  };

  const toggleColorExpand = (index: number) => {
    setExpandedColors((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const addColorToVariant = (variantIndex: number) => {
    const updated = [...variants];
    const variant = updated[variantIndex];
    updated[variantIndex] = {
      ...variant,
      colors: [...variant.colors, { name: "", inventory: BigInt(0) }],
    };
    onChange(updated);
    // Auto-expand colors section
    setExpandedColors((prev) => new Set(prev).add(variantIndex));
  };

  const updateColorInVariant = (
    variantIndex: number,
    colorIndex: number,
    field: "name" | "inventory",
    value: string,
  ) => {
    const updated = [...variants];
    const variant = updated[variantIndex];
    const updatedColors = variant.colors.map((c, ci) => {
      if (ci !== colorIndex) return c;
      if (field === "name") return { ...c, name: value };
      return {
        ...c,
        inventory: BigInt(Math.max(0, Math.round(Number(value) || 0))),
      };
    });
    updated[variantIndex] = { ...variant, colors: updatedColors };
    onChange(updated);
  };

  const removeColorFromVariant = (variantIndex: number, colorIndex: number) => {
    const updated = [...variants];
    const variant = updated[variantIndex];
    updated[variantIndex] = {
      ...variant,
      colors: variant.colors.filter((_, ci) => ci !== colorIndex),
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Existing Variants List */}
      {variants.length > 0 ? (
        <div className="space-y-3">
          {variants.map((variant, index) => {
            const isColorsExpanded = expandedColors.has(index);
            const totalStock = variant.colors.reduce(
              (sum, c) => sum + Number(c.inventory),
              0,
            );
            const isBeingEdited = editingIndex === index;

            return (
              <div
                key={variant.id}
                className={`border rounded-lg overflow-hidden transition-colors ${
                  isBeingEdited
                    ? "border-primary/50 bg-primary/5"
                    : "bg-muted/20"
                }`}
              >
                {/* Variant Header Row */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{variant.size}</span>
                    <span className="text-muted-foreground">
                      ${Number(variant.price).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      {variant.colors.length} color
                      {variant.colors.length !== 1 ? "s" : ""}
                      {variant.colors.length > 0 &&
                        ` · ${totalStock} total stock`}
                    </span>
                    {isBeingEdited && (
                      <span className="text-xs text-primary font-medium">
                        {isDuplicatePending
                          ? "✦ Duplicated — editing"
                          : "Editing…"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleColorExpand(index)}
                      className="text-xs gap-1"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Colors
                      {isColorsExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(index)}
                      title="Edit variant"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(index)}
                      title="Duplicate variant"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(index)}
                      className="text-destructive hover:text-destructive"
                      title="Delete variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Color Entries Sub-section */}
                {isColorsExpanded && (
                  <div className="border-t bg-background/50 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Color Options for {variant.size}
                    </p>

                    {variant.colors.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No colors added yet. Add color options below.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {variant.colors.map((color, colorIdx) => (
                          <div
                            key={color.name || `variant-color-${colorIdx}`}
                            className="flex items-center gap-2"
                          >
                            <div className="flex-1">
                              <Input
                                value={color.name}
                                onChange={(e) =>
                                  updateColorInVariant(
                                    index,
                                    colorIdx,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                placeholder="Color name (e.g. Red, Forest Green)"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="w-28">
                              <Input
                                type="number"
                                min="0"
                                value={String(Number(color.inventory))}
                                onChange={(e) =>
                                  updateColorInVariant(
                                    index,
                                    colorIdx,
                                    "inventory",
                                    e.target.value,
                                  )
                                }
                                placeholder="Stock"
                                className="h-8 text-sm"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeColorFromVariant(index, colorIdx)
                              }
                              className="text-destructive hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-4 text-xs text-muted-foreground px-1">
                          <span className="flex-1">Color Name</span>
                          <span className="w-28">Stock Qty</span>
                          <span className="w-8" />
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addColorToVariant(index)}
                      className="w-full h-8 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Color
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No variants added yet. You can save the product without variants, or
          add variants below.
        </p>
      )}

      {/* Add/Edit Variant Form */}
      {showAddForm ? (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {isDuplicatePending
                  ? "Duplicate Variant"
                  : editingIndex !== null
                    ? "Edit Variant"
                    : "New Variant"}
              </p>
              {isDuplicatePending && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Copy
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isDuplicatePending
                ? "Rename the size and adjust the price. All colors from the original have been copied."
                : "Set the size and price. You can add color options after saving the variant."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Size *</Label>
                <Input
                  value={form.size}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, size: e.target.value }))
                  }
                  placeholder="e.g. Small, M, 10cm"
                  className={formErrors.size ? "border-destructive" : ""}
                  autoFocus={isDuplicatePending}
                />
                {formErrors.size && (
                  <p className="text-xs text-destructive">{formErrors.size}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (USD $) *</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="0.00"
                  className={formErrors.price ? "border-destructive" : ""}
                />
                {formErrors.price && (
                  <p className="text-xs text-destructive">{formErrors.price}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                {isDuplicatePending ? "Discard Copy" : "Cancel"}
              </Button>
              <Button type="button" size="sm" onClick={handleSave}>
                {isDuplicatePending
                  ? "Save Duplicate"
                  : editingIndex !== null
                    ? "Update Variant"
                    : "Add Variant"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setForm(emptyVariantForm());
            setShowAddForm(true);
            setIsDuplicatePending(false);
          }}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Variant (Size)
        </Button>
      )}
    </div>
  );
}
