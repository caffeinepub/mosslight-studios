import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Info,
  Loader2,
  Palette,
  Plus,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ExternalBlob } from "../backend";
import type {
  CreateProductData,
  Product,
  ProductColor,
  ProductVariant,
} from "../backendTypes";
import { useAddProduct, useUpdateProduct } from "../hooks/useProducts";
import VariantManager from "./VariantManager";

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// --- Preset Data ---
type PresetType = "Sticker" | "Magnet" | "Keychain";

interface SizePreset {
  size: string;
  price: number; // in dollars
}

interface TypePreset {
  label: PresetType;
  shipping: number;
  inventory: number;
  category: string;
  sizes: SizePreset[];
  /** If true, all sizes become variants automatically when the type is selected */
  allSizesAsVariants: boolean;
}

const PRESETS: TypePreset[] = [
  {
    label: "Sticker",
    shipping: 4.59,
    inventory: 1000,
    category: "Sticker",
    allSizesAsVariants: true,
    sizes: [
      { size: "2x2", price: 1.75 },
      { size: "3x3", price: 2.0 },
      { size: "4x4", price: 2.5 },
      { size: "6x6", price: 3.0 },
    ],
  },
  {
    label: "Magnet",
    shipping: 4.99,
    inventory: 1000,
    category: "Magnet",
    allSizesAsVariants: true,
    sizes: [
      { size: "2x2", price: 6.25 },
      { size: "3x3", price: 7.25 },
      { size: "4x4", price: 8.25 },
      { size: "5x5", price: 10.0 },
      { size: "6x6", price: 11.5 },
    ],
  },
  {
    label: "Keychain",
    shipping: 1.99,
    inventory: 1000,
    category: "Keychain",
    allSizesAsVariants: false,
    sizes: [{ size: "Standard", price: 2.75 }],
  },
];

function buildVariantsFromPreset(preset: TypePreset): ProductVariant[] {
  return preset.sizes.map((s, i) => ({
    id: `preset_variant_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
    size: s.size,
    colors: [],
    price: BigInt(Math.round(s.price)),
    parentProductId: "pending",
    sku: "",
  }));
}

export default function ProductForm({
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product ? Number(product.price) : 0);
  const [inventory, setInventory] = useState(
    product ? Number(product.inventory) : 0,
  );
  const [hasVariants, setHasVariants] = useState(product?.hasVariants || false);
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants ? product.variants.map((v) => ({ ...v })) : [],
  );
  const [productColors, setProductColors] = useState<ProductColor[]>(
    product && !product.hasVariants
      ? (product.colors || []).map((name) => ({ name, inventory: BigInt(0) }))
      : [],
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExternalBlob[]>(
    product?.images || [],
  );
  const [categories, setCategories] = useState<string[]>(
    product?.categories || [],
  );
  const [sizes, setSizes] = useState<string[]>(product?.sizes || []);
  const [categoryInput, setCategoryInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [skuError, setSkuError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [shippingPrice, setShippingPrice] = useState<number>(
    product?.shippingPrice !== undefined ? product.shippingPrice : 0,
  );

  // Preset state
  const [activePresetType, setActivePresetType] = useState<PresetType | null>(
    null,
  );
  const [presetApplied, setPresetApplied] = useState(false);

  const addProductMutation = useAddProduct();
  const updateProductMutation = useUpdateProduct();

  const isEditing = !!product;
  const isLoading =
    addProductMutation.isPending ||
    updateProductMutation.isPending ||
    isUploading;

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setDescription(product.description);
      setPrice(Number(product.price));
      setInventory(Number(product.inventory));
      setHasVariants(product.hasVariants);
      setVariants(
        product.variants ? product.variants.map((v) => ({ ...v })) : [],
      );
      setExistingImages(product.images || []);
      setCategories(product.categories || []);
      setSizes(product.sizes || []);
      setShippingPrice(
        product.shippingPrice !== undefined ? product.shippingPrice : 0,
      );
      if (!product.hasVariants) {
        setProductColors(
          (product.colors || []).map((name) => ({
            name,
            inventory: BigInt(0),
          })),
        );
      } else {
        setProductColors([]);
      }
    }
  }, [product]);

  const handlePresetTypeClick = (typePreset: TypePreset) => {
    if (activePresetType === typePreset.label) {
      // Deselect — clear everything set by the preset
      setActivePresetType(null);
      setPresetApplied(false);
      if (typePreset.allSizesAsVariants) {
        setHasVariants(false);
        setVariants([]);
      } else {
        setPrice(0);
        setInventory(0);
        setShippingPrice(0);
        setSizes([]);
      }
      setCategories([]);
      return;
    }

    setActivePresetType(typePreset.label);
    setShippingPrice(typePreset.shipping);
    setCategories([typePreset.category]);
    setPresetApplied(true);

    if (typePreset.allSizesAsVariants) {
      // Sticker / Magnet — enable variants and load all sizes
      setHasVariants(true);
      setProductColors([]);
      setVariants(buildVariantsFromPreset(typePreset));
      setSizes(typePreset.sizes.map((s) => s.size));
      // Base price not relevant when variants exist
      setPrice(0);
      setInventory(typePreset.inventory);
    } else {
      // Keychain — auto-fill base fields, no variants
      setHasVariants(false);
      setVariants([]);
      setPrice(typePreset.sizes[0].price);
      setInventory(typePreset.inventory);
      setSizes([typePreset.sizes[0].size]);
    }
  };

  const clearPreset = () => {
    setActivePresetType(null);
    setPresetApplied(false);
    setHasVariants(false);
    setVariants([]);
    setPrice(0);
    setInventory(0);
    setShippingPrice(0);
    setCategories([]);
    setSizes([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setInput("");
  };

  const removeTag = (
    index: number,
    setList: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setList((prev) => prev.filter((_, i) => i !== index));
  };

  const addProductColor = () => {
    setProductColors((prev) => [...prev, { name: "", inventory: BigInt(0) }]);
  };

  const updateProductColor = (
    index: number,
    field: "name" | "inventory",
    value: string,
  ) => {
    setProductColors((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (field === "name") return { ...c, name: value };
        return {
          ...c,
          inventory: BigInt(Math.max(0, Math.round(Number(value) || 0))),
        };
      }),
    );
  };

  const removeProductColor = (index: number) => {
    setProductColors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku.trim()) {
      setSkuError("SKU is required");
      return;
    }
    setSkuError("");

    if (hasVariants && variants.length > 0) {
      for (const variant of variants) {
        if (!variant.id) {
          toast.error("Each variant must have an ID");
          return;
        }
        if (!variant.size) {
          toast.error("Each variant must have a size");
          return;
        }
        if (!variant.price || Number(variant.price) <= 0) {
          toast.error("Each variant must have a price greater than 0");
          return;
        }
        if (variant.colors.length === 0) {
          toast.error(
            `Variant "${variant.size}" must have at least one color. Click "Colors" to add one.`,
          );
          return;
        }
        for (const color of variant.colors) {
          if (!color.name.trim()) {
            toast.error(
              `All color entries in variant "${variant.size}" must have a name`,
            );
            return;
          }
        }
      }
    }

    if (!hasVariants) {
      for (const color of productColors) {
        if (!color.name.trim()) {
          toast.error("All color entries must have a name");
          return;
        }
      }
    }

    try {
      setIsUploading(true);

      let imageBlobs: ExternalBlob[] = [...existingImages];

      if (imageFiles.length > 0) {
        const { ExternalBlob: ExternalBlobClass } = await import("../backend");
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          const blob = ExternalBlobClass.fromBytes(bytes).withUploadProgress(
            (pct) => {
              setUploadProgress(
                Math.round(((i + pct / 100) / imageFiles.length) * 100),
              );
            },
          );
          imageBlobs.push(blob);
        }
      }

      setIsUploading(false);
      setUploadProgress(0);

      const preparedVariants: ProductVariant[] =
        hasVariants && variants.length > 0
          ? variants.map((v) => ({
              ...v,
              parentProductId: product?.id || v.parentProductId || "",
              price: BigInt(Math.round(Number(v.price))),
              colors: v.colors.map((c) => ({
                name: c.name.trim(),
                inventory: BigInt(Math.round(Number(c.inventory))),
              })),
            }))
          : [];

      const colorNames = !hasVariants
        ? productColors.map((c) => c.name.trim()).filter(Boolean)
        : [
            ...new Set(
              preparedVariants.flatMap((v) => v.colors.map((c) => c.name)),
            ),
          ];

      const productData: CreateProductData = {
        name: name.trim(),
        description: description.trim(),
        price: BigInt(Math.round(price)),
        inventory: BigInt(Math.round(inventory)),
        hasVariants,
        variants:
          hasVariants && preparedVariants.length > 0 ? preparedVariants : null,
        sku: sku.trim(),
        categories,
        colors: colorNames,
        sizes,
        taxRate: 8.5,
        shippingPrice: shippingPrice,
      };

      if (isEditing && product) {
        await updateProductMutation.mutateAsync({
          productId: product.id,
          product: productData,
          images: imageBlobs,
        });
        toast.success("Product updated successfully!");
      } else {
        await addProductMutation.mutateAsync({
          product: productData,
          images: imageBlobs,
        });
        toast.success("Product added successfully!");
      }

      onSuccess?.();
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      const message = error?.message || "Failed to save product";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Fill Preset Panel — new products only */}
      {!isEditing && (
        <Card className="border-2 border-dashed border-emerald-600/40 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Quick Fill
              <span className="text-xs font-normal text-muted-foreground ml-1">
                Auto-fill all sizes as variants
              </span>
              {(presetApplied || activePresetType) && (
                <button
                  type="button"
                  onClick={clearPreset}
                  className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                  data-ocid="product_preset.close_button"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetTypeClick(preset)}
                  data-ocid={`product_preset.${preset.label.toLowerCase()}.button`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    activePresetType === preset.label
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-border bg-background hover:border-emerald-600/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Info row showing what was applied */}
            {presetApplied &&
              activePresetType &&
              (() => {
                const typePreset = PRESETS.find(
                  (p) => p.label === activePresetType,
                )!;
                return (
                  <div
                    className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"
                    data-ocid="product_preset.success_state"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      {typePreset.allSizesAsVariants ? (
                        <>
                          <strong>
                            {typePreset.sizes.length} size variants
                          </strong>{" "}
                          added automatically (
                          {typePreset.sizes.map((s) => s.size).join(", ")}) —
                          click <strong>Colors</strong> on each variant to add
                          color options.
                        </>
                      ) : (
                        <>Preset applied — all fields are editable.</>
                      )}
                    </span>
                  </div>
                );
              })()}
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => {
                setSku(e.target.value);
                if (skuError) setSkuError("");
              }}
              placeholder="e.g. MOSS-001"
              className={skuError ? "border-destructive" : ""}
            />
            {skuError && <p className="text-sm text-destructive">{skuError}</p>}
            <p className="text-xs text-muted-foreground">
              Unique identifier for inventory tracking
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing & Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasVariants && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Base Price (USD $) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter price in US dollars (e.g. 25.00)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory *</Label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  value={inventory}
                  onChange={(e) => setInventory(Number(e.target.value))}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          )}

          {hasVariants && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inventory">Default Inventory per Variant</Label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  value={inventory}
                  onChange={(e) => setInventory(Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Price is set per variant/size below
                </p>
              </div>
            </div>
          )}

          {/* Tax & Shipping */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="taxRate" className="flex items-center gap-1.5">
                Tax Rate
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="taxRate"
                  type="text"
                  value="8.5%"
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <Badge
                  variant="secondary"
                  className="whitespace-nowrap text-xs"
                >
                  Fixed
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Applied automatically at checkout
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingPrice">Shipping Price (USD $)</Label>
              <Input
                id="shippingPrice"
                type="number"
                min="0"
                step="0.01"
                value={shippingPrice}
                onChange={(e) => setShippingPrice(Number(e.target.value))}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Flat shipping fee for this item
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {existingImages.map((img, idx) => (
                <div
                  key={img.getDirectURL() || `existing-img-${idx}`}
                  className="relative group"
                >
                  <img
                    src={img.getDirectURL()}
                    alt={`Product view ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="images">
              {existingImages.length > 0 ? "Add More Images" : "Upload Images"}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
            {imageFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {imageFiles.length} file(s) selected
              </p>
            )}
            {isUploading && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex gap-2">
              <Input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="Add category..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(
                      categoryInput,
                      categories,
                      setCategories,
                      setCategoryInput,
                    );
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  addTag(
                    categoryInput,
                    categories,
                    setCategories,
                    setCategoryInput,
                  )
                }
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categories.map((cat, idx) => (
                  <span
                    key={`cat-tag-${cat}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeTag(idx, setCategories)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <Label>Sizes</Label>
            <div className="flex gap-2">
              <Input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                placeholder="Add size..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(sizeInput, sizes, setSizes, setSizeInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addTag(sizeInput, sizes, setSizes, setSizeInput)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sizes.map((size, idx) => (
                  <span
                    key={`size-tag-${size}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeTag(idx, setSizes)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Color Options for Unsized Products */}
      {!hasVariants && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Add color variants for this product. Each color has its own stock
              quantity. Price is the same for all colors.
            </p>

            {productColors.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No color options added. Click "Add Color" to add color variants.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-4 text-xs text-muted-foreground px-1">
                  <span className="flex-1">Color Name</span>
                  <span className="w-32">Stock Quantity</span>
                  <span className="w-8" />
                </div>
                {productColors.map((color, idx) => (
                  <div
                    key={color.name || `product-color-${idx}`}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1">
                      <Input
                        value={color.name}
                        onChange={(e) =>
                          updateProductColor(idx, "name", e.target.value)
                        }
                        placeholder="Color name (e.g. Red, Forest Green)"
                        className="h-9"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        value={String(Number(color.inventory))}
                        onChange={(e) =>
                          updateProductColor(idx, "inventory", e.target.value)
                        }
                        placeholder="0"
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProductColor(idx)}
                      className="text-destructive hover:text-destructive h-9 w-9 p-0 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProductColor}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Color
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Size Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="hasVariants"
              checked={hasVariants}
              onCheckedChange={(checked) => {
                setHasVariants(checked);
                if (!checked) {
                  setVariants([]);
                } else {
                  setProductColors([]);
                }
              }}
            />
            <Label htmlFor="hasVariants" className="cursor-pointer">
              This product has size variants (e.g. S, M, L, XL)
            </Label>
          </div>

          {hasVariants && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Each size has its own price. Click "Colors" on a variant to add
                color options with individual stock quantities.
              </p>
              <VariantManager
                variants={variants}
                onChange={setVariants}
                productId={product?.id || ""}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isUploading ? `Uploading... ${uploadProgress}%` : "Saving..."}
            </>
          ) : isEditing ? (
            "Update Product"
          ) : (
            "Add Product"
          )}
        </Button>
      </div>
    </form>
  );
}
