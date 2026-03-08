import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  DollarSign,
  Layers,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import AdminGuard from "../components/AdminGuard";
import {
  type CatalogEntry,
  useGetCatalogEntries,
} from "../hooks/useProductCatalog";
import { useSaleRecords } from "../hooks/useSaleRecords";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// ─── Inline editable "Units Sold" cell ────────────────────────────────────────

interface UnitsSoldCellProps {
  variant: CatalogEntry;
  idx: number;
  getSaleRecord: (
    item_name: string,
    size: string,
    merch_type: string,
  ) => { units_sold: number } | undefined;
  setSaleRecord: (
    item_name: string,
    size: string,
    merch_type: string,
    units_sold: number,
  ) => void;
}

function UnitsSoldCell({
  variant: v,
  idx,
  getSaleRecord,
  setSaleRecord,
}: UnitsSoldCellProps) {
  const record = getSaleRecord(v.item_name, v.size, v.merch_type);
  const [localValue, setLocalValue] = useState<string>(
    record ? String(record.units_sold) : "",
  );
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBlur = useCallback(() => {
    const parsed = Number.parseInt(localValue, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setSaleRecord(v.item_name, v.size, v.merch_type, parsed);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 1800);
    }
  }, [localValue, v.item_name, v.size, v.merch_type, setSaleRecord]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
    },
    [],
  );

  return (
    <TableCell
      className="whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className="w-20 h-7 text-sm font-mono px-2 border-blue-200 dark:border-blue-800 focus-visible:ring-blue-400"
          data-ocid={`catalog_detail.units_sold.input.${idx + 1}`}
        />
        {saved && (
          <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in duration-200">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>
    </TableCell>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminCatalogDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { itemName?: string };
  const itemNameRaw = params.itemName ?? "";
  const itemName = decodeURIComponent(itemNameRaw);

  const { data: allEntries = [], isLoading } = useGetCatalogEntries();
  const { getSaleRecord, setSaleRecord } = useSaleRecords();

  const variants = useMemo(
    () => allEntries.filter((e) => e.item_name === itemName),
    [allEntries, itemName],
  );

  const uniqueSizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter(Boolean))].sort(),
    [variants],
  );

  const uniqueMerchTypes = useMemo(
    () =>
      [...new Set(variants.map((v) => v.merch_type).filter(Boolean))].sort(),
    [variants],
  );

  const totalYearlyEarnings = useMemo(
    () => variants.reduce((acc, v) => acc + v.yearly_earnings, 0),
    [variants],
  );

  const bestProfitAmount = useMemo(
    () =>
      variants.length > 0
        ? Math.max(...variants.map((v) => v.profit_amount))
        : 0,
    [variants],
  );

  // Total units sold across all variants of this item
  const totalUnitsSold = useMemo(() => {
    return variants.reduce((acc, v) => {
      const rec = getSaleRecord(v.item_name, v.size, v.merch_type);
      return acc + (rec ? rec.units_sold : 0);
    }, 0);
  }, [variants, getSaleRecord]);

  return (
    <AdminGuard>
      <div className="container py-10 space-y-8 max-w-screen-xl">
        {/* Back button + title */}
        <div className="flex items-start gap-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/admin/catalog" })}
            data-ocid="catalog_detail.back_button"
            className="shrink-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>

          <div className="space-y-1">
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              {itemName}
            </h1>
            <p className="text-muted-foreground text-sm">
              Design Detail Page ·{" "}
              <span className="font-medium text-foreground">
                {isLoading ? "…" : variants.length} variant
                {variants.length !== 1 ? "s" : ""}
              </span>
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : variants.length === 0 ? (
          <div
            className="text-center py-20 text-muted-foreground"
            data-ocid="catalog_detail.empty_state"
          >
            <Package className="mx-auto h-12 w-12 opacity-20 mb-3" />
            <p className="font-medium">No variants found for "{itemName}"</p>
            <p className="text-sm mt-1">
              This item may not exist in the catalog yet.
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards — now 5 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {/* Sizes */}
              <Card className="bg-lime-50/60 dark:bg-lime-950/30 border-lime-200 dark:border-lime-800">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-lime-700 dark:text-lime-400 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    Sizes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-wrap gap-1">
                    {uniqueSizes.map((s) => (
                      <Badge
                        key={s}
                        className="text-xs bg-lime-200 dark:bg-lime-900 text-lime-800 dark:text-lime-200 border-0"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {uniqueSizes.length}
                  </p>
                </CardContent>
              </Card>

              {/* Merch Types */}
              <Card className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    Merch Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-wrap gap-1">
                    {uniqueMerchTypes.map((t) => (
                      <Badge
                        key={t}
                        className="text-xs bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-0"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {uniqueMerchTypes.length}
                  </p>
                </CardContent>
              </Card>

              {/* Total Yearly Earnings */}
              <Card className="bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Total Yearly Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {fmt$(totalYearlyEarnings)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    across all variants
                  </p>
                </CardContent>
              </Card>

              {/* Best Profit */}
              <Card className="bg-violet-50/60 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-400 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Best Profit/Unit
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">
                    {fmt$(bestProfitAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    highest across variants
                  </p>
                </CardContent>
              </Card>

              {/* Total Units Sold — new 5th card */}
              <Card
                className="bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                data-ocid="catalog_detail.total_sold.card"
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Total Sold
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {totalUnitsSold.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    units across all sizes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Full detail table */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">
                  All Variants — Financial Detail
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter actual units sold per variant. Changes are saved
                  instantly to your browser.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table data-ocid="catalog_detail.table">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Merch Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Prod. Cost</TableHead>
                        <TableHead>Profit Margin</TableHead>
                        <TableHead>Profit Amt</TableHead>
                        <TableHead>Shipping</TableHead>
                        <TableHead>AZ Tax Rate</TableHead>
                        <TableHead>AZ Tax Total</TableHead>
                        <TableHead>Qtr Sales</TableHead>
                        <TableHead>Qtr Earnings</TableHead>
                        <TableHead>Yearly Sales</TableHead>
                        <TableHead>Yearly Earnings</TableHead>
                        <TableHead className="text-blue-700 dark:text-blue-400 whitespace-nowrap">
                          Units Sold
                        </TableHead>
                        <TableHead className="text-blue-600 dark:text-blue-300 whitespace-nowrap">
                          Actual Earnings
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((v, idx) => {
                        const rec = getSaleRecord(
                          v.item_name,
                          v.size,
                          v.merch_type,
                        );
                        const unitsSold = rec ? rec.units_sold : 0;
                        const actualEarnings = unitsSold * v.profit_amount;

                        return (
                          <TableRow
                            key={v.id}
                            className="hover:bg-muted/20"
                            data-ocid={`catalog_detail.row.${idx + 1}`}
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-xs font-normal"
                              >
                                {v.merch_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {v.size}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {fmt$(v.total_cost)}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {fmt$(v.production_cost)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {fmtPct(v.profit_margin)}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                              {fmt$(v.profit_amount)}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {fmt$(v.shipping)}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {fmtPct(v.az_tax_rate)}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {fmt$(v.az_tax_total)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {v.quarter_sales.toFixed(0)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {fmt$(v.quarterly_earnings)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {v.yearly_sales.toFixed(0)}
                            </TableCell>
                            <TableCell className="font-mono text-sm font-bold text-lime-700 dark:text-lime-400">
                              {fmt$(v.yearly_earnings)}
                            </TableCell>

                            {/* Units Sold — editable */}
                            <UnitsSoldCell
                              variant={v}
                              idx={idx}
                              getSaleRecord={getSaleRecord}
                              setSaleRecord={setSaleRecord}
                            />

                            {/* Actual Earnings — computed */}
                            <TableCell className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                              {unitsSold > 0 ? (
                                fmt$(actualEarnings)
                              ) : (
                                <span className="text-muted-foreground font-normal">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminGuard>
  );
}
