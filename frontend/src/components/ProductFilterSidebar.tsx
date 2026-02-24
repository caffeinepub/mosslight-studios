import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Product } from '../backend';

export interface ActiveFilters {
  categories: string[];
  priceRanges: string[];
  colors: string[];
  sizes: string[];
}

interface ProductFilterSidebarProps {
  products: Product[];
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
}

const PRICE_RANGES = [
  { id: 'under-25', label: 'Under $25', min: 0, max: 25 },
  { id: '25-50', label: '$25 – $50', min: 25, max: 50 },
  { id: '50-100', label: '$50 – $100', min: 50, max: 100 },
  { id: '100-plus', label: '$100+', min: 100, max: Infinity },
];

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

export default function ProductFilterSidebar({
  products,
  activeFilters,
  onFiltersChange,
}: ProductFilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive unique values from products
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.categories?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.colors?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [products]);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes?.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [products]);

  const totalActiveCount =
    activeFilters.categories.length +
    activeFilters.priceRanges.length +
    activeFilters.colors.length +
    activeFilters.sizes.length;

  const toggle = (
    key: keyof ActiveFilters,
    value: string
  ) => {
    const current = activeFilters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...activeFilters, [key]: updated });
  };

  const clearAll = () => {
    onFiltersChange({ categories: [], priceRanges: [], colors: [], sizes: [] });
  };

  const sidebarContent = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base text-foreground">Filters</span>
        {totalActiveCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {totalActiveCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.categories.map((c) => (
            <Badge
              key={`cat-${c}`}
              variant="secondary"
              className="gap-1 pr-1 text-xs cursor-pointer"
              onClick={() => toggle('categories', c)}
            >
              {c}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {activeFilters.priceRanges.map((r) => {
            const range = PRICE_RANGES.find((p) => p.id === r);
            return range ? (
              <Badge
                key={`price-${r}`}
                variant="secondary"
                className="gap-1 pr-1 text-xs cursor-pointer"
                onClick={() => toggle('priceRanges', r)}
              >
                {range.label}
                <X className="h-3 w-3" />
              </Badge>
            ) : null;
          })}
          {activeFilters.colors.map((c) => (
            <Badge
              key={`col-${c}`}
              variant="secondary"
              className="gap-1 pr-1 text-xs cursor-pointer"
              onClick={() => toggle('colors', c)}
            >
              {c}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {activeFilters.sizes.map((s) => (
            <Badge
              key={`sz-${s}`}
              variant="secondary"
              className="gap-1 pr-1 text-xs cursor-pointer"
              onClick={() => toggle('sizes', s)}
            >
              {s}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Category */}
      {availableCategories.length > 0 && (
        <>
          <FilterSection title="Category">
            {availableCategories.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <Checkbox
                  checked={activeFilters.categories.includes(cat)}
                  onCheckedChange={() => toggle('categories', cat)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                  {cat}
                </span>
              </label>
            ))}
          </FilterSection>
          <Separator />
        </>
      )}

      {/* Price Range */}
      <FilterSection title="Price Range">
        {PRICE_RANGES.map((range) => (
          <label
            key={range.id}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <Checkbox
              checked={activeFilters.priceRanges.includes(range.id)}
              onCheckedChange={() => toggle('priceRanges', range.id)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
              {range.label}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Color */}
      {availableColors.length > 0 && (
        <>
          <Separator />
          <FilterSection title="Color">
            {availableColors.map((color) => (
              <label
                key={color}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <Checkbox
                  checked={activeFilters.colors.includes(color)}
                  onCheckedChange={() => toggle('colors', color)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                  {color}
                </span>
              </label>
            ))}
          </FilterSection>
        </>
      )}

      {/* Size */}
      {availableSizes.length > 0 && (
        <>
          <Separator />
          <FilterSection title="Size">
            {availableSizes.map((size) => (
              <label
                key={size}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <Checkbox
                  checked={activeFilters.sizes.includes(size)}
                  onCheckedChange={() => toggle('sizes', size)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                  {size}
                </span>
              </label>
            ))}
          </FilterSection>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen((o) => !o)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {totalActiveCount > 0 && (
            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {totalActiveCount}
            </Badge>
          )}
        </Button>

        {mobileOpen && (
          <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-5 shadow-sm">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}

export { PRICE_RANGES };
