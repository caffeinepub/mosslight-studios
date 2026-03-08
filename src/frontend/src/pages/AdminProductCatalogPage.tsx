import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  DatabaseZap,
  FileSpreadsheet,
  Loader2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "../components/AdminGuard";
import {
  useBulkUpsertCatalogEntries,
  useClearCatalog,
  useGetCatalogEntries,
} from "../hooks/useProductCatalog";
import { useSaleRecords } from "../hooks/useSaleRecords";
import type {
  ProductCatalogEntry,
  ProductCatalogEntryInput,
} from "../types/catalog";

// ─── CSV Parser ───────────────────────────────────────────────────────────────

type CSVRow = {
  merch_type: string;
  item_name: string;
  size: string;
  total_cost: string;
  production_cost: string;
  profit_margin: string;
  profit_amount: string;
  shipping: string;
  az_tax_rate: string;
  az_tax_total: string;
  quarter_sales: string;
  quarterly_earnings: string;
  yearly_sales: string;
  yearly_earnings: string;
  [key: string]: string;
};

function parseCSV(text: string): ProductCatalogEntryInput[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    const row = {} as CSVRow;
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return {
      merch_type: row.merch_type || "",
      item_name: row.item_name || "",
      size: row.size || "",
      total_cost: Number.parseFloat(row.total_cost) || 0,
      production_cost: Number.parseFloat(row.production_cost) || 0,
      profit_margin: Number.parseFloat(row.profit_margin) || 0,
      profit_amount: Number.parseFloat(row.profit_amount) || 0,
      shipping: Number.parseFloat(row.shipping) || 0,
      az_tax_rate: Number.parseFloat(row.az_tax_rate) || 0,
      az_tax_total: Number.parseFloat(row.az_tax_total) || 0,
      quarter_sales: Number.parseFloat(row.quarter_sales) || 0,
      quarterly_earnings: Number.parseFloat(row.quarterly_earnings) || 0,
      yearly_sales: Number.parseFloat(row.yearly_sales) || 0,
      yearly_earnings: Number.parseFloat(row.yearly_earnings) || 0,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  return `$${n.toFixed(2)}`;
}

type SortField =
  | "item_name"
  | "size"
  | "profit_amount"
  | "quarterly_earnings"
  | "yearly_earnings";
type SortDir = "asc" | "desc";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminProductCatalogPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data
  const { data: entries = [], isLoading } = useGetCatalogEntries();
  const bulkUpsert = useBulkUpsertCatalogEntries();
  const clearCatalog = useClearCatalog();

  // Units sold (localStorage)
  const { getSaleRecord } = useSaleRecords();

  // CSV state
  const [parsedRows, setParsedRows] = useState<ProductCatalogEntryInput[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter / sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMerchType, setFilterMerchType] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [sortField, setSortField] = useState<SortField>("item_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // ── Derived filter options ────────────────────────────────────────────────

  const uniqueMerchTypes = useMemo(
    () => [...new Set(entries.map((e) => e.merch_type).filter(Boolean))].sort(),
    [entries],
  );

  const uniqueSizes = useMemo(
    () => [...new Set(entries.map((e) => e.size).filter(Boolean))].sort(),
    [entries],
  );

  // ── Filtered + sorted rows ────────────────────────────────────────────────

  const displayedEntries = useMemo(() => {
    let rows = [...entries];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      rows = rows.filter((e) => e.item_name.toLowerCase().includes(lower));
    }

    if (filterMerchType !== "all") {
      rows = rows.filter((e) => e.merch_type === filterMerchType);
    }

    if (filterSize !== "all") {
      rows = rows.filter((e) => e.size === filterSize);
    }

    rows.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      const cmp =
        typeof valA === "string"
          ? valA.localeCompare(valB as string)
          : (valA as number) - (valB as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [entries, searchTerm, filterMerchType, filterSize, sortField, sortDir]);

  // ── Sort toggle ────────────────────────────────────────────────────────────

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3 inline" />
    );
  }

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
      if (rows.length === 0) {
        toast.error("No data rows found in CSV");
      } else {
        toast.success(`Parsed ${rows.length} rows — ready to upload`);
      }
    };
    reader.readAsText(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Upload ─────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (parsedRows.length === 0) {
      toast.error("No data to upload. Please select a CSV file first.");
      return;
    }
    try {
      await bulkUpsert.mutateAsync(parsedRows);
      toast.success(
        `Successfully uploaded ${parsedRows.length} catalog entries`,
      );
      setParsedRows([]);
      setFileName(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Upload failed: ${msg}`);
    }
  };

  // ── Clear ──────────────────────────────────────────────────────────────────

  const handleClear = async () => {
    try {
      await clearCatalog.mutateAsync();
      toast.success("Catalog cleared successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to clear catalog: ${msg}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AdminGuard>
      <div className="container py-10 space-y-8 max-w-screen-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-6 w-6 text-lime-600" />
              <h1 className="font-serif text-3xl font-bold tracking-tight">
                Mosslight_Product_Catalog
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Private financial data — never visible to customers
            </p>
          </div>
          <Badge
            variant="secondary"
            className="text-sm px-3 py-1 bg-lime-50 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-800"
          >
            {entries.length} entries
          </Badge>
        </div>

        {/* CSV Upload Card */}
        <Card className="border-dashed border-2 border-lime-200 dark:border-lime-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <FileSpreadsheet className="h-5 w-5 text-lime-600" />
              Upload CSV Data
            </CardTitle>
            <CardDescription>
              Upload your Mosslight product catalog CSV. Columns required:{" "}
              <code className="text-xs bg-muted px-1 rounded">
                merch_type, item_name, size, total_cost, production_cost,
                profit_margin, profit_amount, shipping, az_tax_rate,
                az_tax_total, quarter_sales, quarterly_earnings, yearly_sales,
                yearly_earnings
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag & drop zone */}
            <label
              htmlFor="csv-file-input"
              className={`block relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-lime-500 bg-lime-50 dark:bg-lime-950/30"
                  : "border-border hover:border-lime-400 hover:bg-muted/40"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              data-ocid="catalog.dropzone"
            >
              <input
                id="csv-file-input"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={onFileChange}
              />
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              {fileName ? (
                <div>
                  <p className="font-medium text-foreground">{fileName}</p>
                  <p className="text-sm text-lime-600 mt-1">
                    {parsedRows.length} rows parsed and ready
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-foreground">
                    Drop your CSV here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accepts .csv files
                  </p>
                </div>
              )}
            </label>

            {/* Preview table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Preview (first 3 rows of {parsedRows.length}):
                </p>
                <div className="overflow-x-auto rounded-md border text-xs">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          merch_type
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          item_name
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          size
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          total_cost
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          profit_amount
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          yearly_earnings
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.slice(0, 3).map((row, idx) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: preview only
                        <TableRow key={idx}>
                          <TableCell>{row.merch_type}</TableCell>
                          <TableCell>{row.item_name}</TableCell>
                          <TableCell>{row.size}</TableCell>
                          <TableCell>{fmt$(row.total_cost)}</TableCell>
                          <TableCell>{fmt$(row.profit_amount)}</TableCell>
                          <TableCell>{fmt$(row.yearly_earnings)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={handleUpload}
                disabled={parsedRows.length === 0 || bulkUpsert.isPending}
                className="bg-lime-700 hover:bg-lime-800 text-white"
                data-ocid="catalog.upload_button"
              >
                {bulkUpsert.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {bulkUpsert.isPending
                  ? "Uploading..."
                  : `Upload ${parsedRows.length > 0 ? `${parsedRows.length} rows` : "to Catalog"}`}
              </Button>

              {entries.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      data-ocid="catalog.clear_button"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Catalog
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="catalog.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Clear the entire catalog?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {entries.length}{" "}
                        catalog entries. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="catalog.cancel_button">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClear}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-ocid="catalog.confirm_button"
                      >
                        {clearCatalog.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Yes, clear all data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Catalog Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Catalog Table</CardTitle>
            <CardDescription>
              Click any item name to view all variants and full financial
              details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters bar */}
            <div className="flex gap-3 flex-wrap items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search item name…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-ocid="catalog.search_input"
                />
              </div>

              <Select
                value={filterMerchType}
                onValueChange={setFilterMerchType}
              >
                <SelectTrigger
                  className="w-[160px]"
                  data-ocid="catalog.merch_type.select"
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueMerchTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger
                  className="w-[140px]"
                  data-ocid="catalog.size.select"
                >
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {uniqueSizes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm ||
                filterMerchType !== "all" ||
                filterSize !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterMerchType("all");
                    setFilterSize("all");
                  }}
                >
                  Clear filters
                </Button>
              )}

              <span className="text-sm text-muted-foreground ml-auto">
                {displayedEntries.length} of {entries.length} entries
              </span>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-2" data-ocid="catalog.loading_state">
                {[...Array(5)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="catalog.empty_state"
              >
                <DatabaseZap className="mx-auto h-12 w-12 opacity-20 mb-3" />
                <p className="font-medium">No catalog data yet</p>
                <p className="text-sm mt-1">
                  Upload a CSV file above to populate the catalog
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table data-ocid="catalog.table">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Merch Type</TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort("item_name")}
                      >
                        Item Name <SortIcon field="item_name" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort("size")}
                      >
                        Size <SortIcon field="size" />
                      </TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort("profit_amount")}
                      >
                        Profit <SortIcon field="profit_amount" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort("quarterly_earnings")}
                      >
                        Qtr Earnings <SortIcon field="quarterly_earnings" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort("yearly_earnings")}
                      >
                        Yearly Earnings <SortIcon field="yearly_earnings" />
                      </TableHead>
                      <TableHead className="text-blue-700 dark:text-blue-400">
                        Units Sold
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedEntries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-10 text-muted-foreground"
                          data-ocid="catalog.empty_state"
                        >
                          No entries match your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedEntries.map(
                        (entry: ProductCatalogEntry, idx: number) => {
                          const saleRecord = getSaleRecord(
                            entry.item_name,
                            entry.size,
                            entry.merch_type,
                          );
                          return (
                            <TableRow
                              key={entry.id}
                              className="hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() =>
                                navigate({
                                  to: "/admin/catalog/$itemName",
                                  params: {
                                    itemName: encodeURIComponent(
                                      entry.item_name,
                                    ),
                                  },
                                })
                              }
                              data-ocid={`catalog.row.${idx + 1}`}
                            >
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal"
                                >
                                  {entry.merch_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-lime-700 dark:text-lime-400 hover:underline">
                                {entry.item_name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {entry.size}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {fmt$(entry.total_cost)}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-emerald-700 dark:text-emerald-400">
                                {fmt$(entry.profit_amount)}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {fmt$(entry.quarterly_earnings)}
                              </TableCell>
                              <TableCell className="font-mono text-sm font-semibold">
                                {fmt$(entry.yearly_earnings)}
                              </TableCell>
                              <TableCell
                                className="font-mono text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {saleRecord ? (
                                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                                    {saleRecord.units_sold.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
