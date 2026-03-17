import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Download,
  Loader2,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Order, OrderItem, Product } from "../backendTypes";
import AdminGuard from "../components/AdminGuard";
import { useFullActor } from "../hooks/useFullActor";

// ─── Helpers ────────────────────────────────────────────────────────────────

const TAX_RATE = 0.085;

function centsToUsd(cents: bigint | number): number {
  return Number(cents) / 100;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(time: bigint): string {
  return new Date(Number(time) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shortenPrincipal(p: { toString(): string }): string {
  const s = p.toString();
  return s.length > 12 ? `${s.slice(0, 8)}...` : s;
}

function calcItemTax(item: OrderItem): number {
  return centsToUsd(item.price) * Number(item.quantity) * TAX_RATE;
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "delivered") return "default";
  if (status === "shipped") return "secondary";
  return "outline";
}

type SortDir = "asc" | "desc";

function useSortedRows<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T | null,
  dir: SortDir,
) {
  return useMemo(() => {
    if (!key) return rows;
    return [...rows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === "number" && typeof bv === "number")
        return dir === "asc" ? av - bv : bv - av;
      return dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [rows, key, dir]);
}

// ─── Sales Page ──────────────────────────────────────────────────────────────

export default function AdminSalesPage() {
  const { actor, isFetching } = useFullActor();

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => (actor ? actor.getOrders() : []),
    enabled: !!actor && !isFetching,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["admin-products"],
    queryFn: async () => (actor ? actor.getProducts() : []),
    enabled: !!actor && !isFetching,
  });

  const isLoading = ordersLoading || productsLoading;

  // Product map for quick lookup
  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    let totalRevenue = 0;
    let totalTax = 0;
    const unitsByProduct = new Map<string, number>();

    for (const order of orders) {
      totalRevenue += centsToUsd(order.total);
      for (const item of order.items) {
        totalTax += calcItemTax(item);
        const prev = unitsByProduct.get(item.productId) ?? 0;
        unitsByProduct.set(item.productId, prev + Number(item.quantity));
      }
    }

    let bestProductId = "";
    let bestUnits = 0;
    for (const [pid, units] of unitsByProduct) {
      if (units > bestUnits) {
        bestUnits = units;
        bestProductId = pid;
      }
    }
    const bestName =
      productMap.get(bestProductId)?.name ??
      (orders.length ? "—" : "No sales yet");

    return { totalRevenue, totalTax, bestName, totalOrders: orders.length };
  }, [orders, productMap]);

  // ── Item popularity ────────────────────────────────────────────────────────
  type PopRow = {
    name: string;
    unitsSold: number;
    revenue: number;
    taxCollected: number;
  };

  const popularityRows = useMemo<PopRow[]>(() => {
    const map = new Map<
      string,
      { name: string; unitsSold: number; revenue: number; taxCollected: number }
    >();
    for (const order of orders) {
      for (const item of order.items) {
        const name = productMap.get(item.productId)?.name ?? item.productId;
        const prev = map.get(item.productId) ?? {
          name,
          unitsSold: 0,
          revenue: 0,
          taxCollected: 0,
        };
        map.set(item.productId, {
          name,
          unitsSold: prev.unitsSold + Number(item.quantity),
          revenue:
            prev.revenue + centsToUsd(item.price) * Number(item.quantity),
          taxCollected: prev.taxCollected + calcItemTax(item),
        });
      }
    }
    return [...map.values()].sort((a, b) => b.unitsSold - a.unitsSold);
  }, [orders, productMap]);

  const maxUnits = popularityRows[0]?.unitsSold ?? 1;

  // popularity sort
  const [popSortKey, setPopSortKey] = useState<keyof PopRow | null>(null);
  const [popSortDir, setPopSortDir] = useState<SortDir>("desc");
  const sortedPopRows = useSortedRows(
    popularityRows as unknown as Record<string, unknown>[],
    popSortKey as string | null,
    popSortDir,
  ) as unknown as PopRow[];

  function togglePopSort(key: keyof PopRow) {
    if (popSortKey === key) {
      setPopSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setPopSortKey(key);
      setPopSortDir("desc");
    }
  }

  // ── Sales by customer ──────────────────────────────────────────────────────
  type CustomerRow = {
    customerId: string;
    orderCount: number;
    itemNames: string;
    totalSpent: number;
    taxPaid: number;
  };

  const customerRows = useMemo<CustomerRow[]>(() => {
    const map = new Map<
      string,
      {
        orderCount: number;
        itemSet: Set<string>;
        totalSpent: number;
        taxPaid: number;
      }
    >();
    for (const order of orders) {
      const id = shortenPrincipal(order.customer);
      const prev = map.get(id) ?? {
        orderCount: 0,
        itemSet: new Set<string>(),
        totalSpent: 0,
        taxPaid: 0,
      };
      prev.orderCount += 1;
      prev.totalSpent += centsToUsd(order.total);
      for (const item of order.items) {
        const name = productMap.get(item.productId)?.name ?? item.productId;
        prev.itemSet.add(name);
        prev.taxPaid += calcItemTax(item);
      }
      map.set(id, prev);
    }
    return [...map.entries()]
      .map(([customerId, v]) => ({
        customerId,
        orderCount: v.orderCount,
        itemNames: [...v.itemSet].join(", "),
        totalSpent: v.totalSpent,
        taxPaid: v.taxPaid,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders, productMap]);

  // ── All sales table ────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allSalesRows = useMemo(() => {
    return [...orders]
      .sort((a, b) => Number(b.date) - Number(a.date))
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const customer = shortenPrincipal(o.customer).toLowerCase();
        const items = o.items
          .map((i) => productMap.get(i.productId)?.name ?? "")
          .join(" ")
          .toLowerCase();
        return customer.includes(q) || items.includes(q);
      })
      .map((order) => {
        const subtotal = centsToUsd(order.total);
        const tax = order.items.reduce((s, i) => s + calcItemTax(i), 0);
        const itemsLabel = order.items
          .map(
            (i) =>
              `${productMap.get(i.productId)?.name ?? "Unknown"} ×${Number(i.quantity)}`,
          )
          .join(", ");
        return {
          id: order.id,
          date: formatDate(order.date),
          customer: shortenPrincipal(order.customer),
          items: itemsLabel,
          subtotal,
          tax,
          total: subtotal,
          status: order.status,
        };
      });
  }, [orders, statusFilter, searchQuery, productMap]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  function exportCsv() {
    const header = "Date,Customer,Items,Subtotal,Tax,Total,Status";
    const rows = allSalesRows.map(
      (r) =>
        `"${r.date}","${r.customer}","${r.items}",${r.subtotal.toFixed(2)},${r.tax.toFixed(2)},${r.total.toFixed(2)},${r.status}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mosslight-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminGuard>
      <div className="container py-12 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-serif text-4xl font-bold">Sales Tracker</h1>
            <p className="text-muted-foreground">
              Track revenue, tax, and product popularity
            </p>
          </div>
          <Button
            onClick={exportCsv}
            className="gap-2 self-start"
            data-ocid="sales.export.button"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div
            className="flex justify-center py-24"
            data-ocid="sales.loading_state"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── Summary Cards ────────────────────────────────────── */}
            <section data-ocid="sales.summary.section">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                  icon={<ShoppingCart className="h-5 w-5" />}
                  label="Total Orders"
                  value={String(summary.totalOrders)}
                  ocid="sales.total_orders.card"
                />
                <SummaryCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Total Revenue"
                  value={formatUsd(summary.totalRevenue)}
                  ocid="sales.total_revenue.card"
                />
                <SummaryCard
                  icon={<Receipt className="h-5 w-5" />}
                  label="Tax Collected (8.5%)"
                  value={formatUsd(summary.totalTax)}
                  ocid="sales.tax_collected.card"
                />
                <SummaryCard
                  icon={<Package className="h-5 w-5" />}
                  label="Best Selling Item"
                  value={summary.bestName}
                  ocid="sales.best_seller.card"
                />
              </div>
            </section>

            {/* ── Item Popularity ──────────────────────────────────── */}
            <section data-ocid="sales.popularity.section">
              <h2 className="font-serif text-2xl font-semibold mb-4">
                Item Popularity
              </h2>
              {popularityRows.length === 0 ? (
                <EmptyState
                  message="No sales data yet."
                  ocid="sales.popularity.empty_state"
                />
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table data-ocid="sales.popularity.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <SortableHead
                            label="Units Sold"
                            sortKey="unitsSold"
                            activeKey={popSortKey}
                            onToggle={() => togglePopSort("unitsSold")}
                          />
                          <SortableHead
                            label="Revenue"
                            sortKey="revenue"
                            activeKey={popSortKey}
                            onToggle={() => togglePopSort("revenue")}
                          />
                          <SortableHead
                            label="Tax Collected"
                            sortKey="taxCollected"
                            activeKey={popSortKey}
                            onToggle={() => togglePopSort("taxCollected")}
                          />
                          <TableHead>Popularity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedPopRows.map((row, i) => (
                          <TableRow
                            key={row.name}
                            data-ocid={`sales.popularity.row.item.${i + 1}`}
                          >
                            <TableCell className="font-medium">
                              {row.name}
                            </TableCell>
                            <TableCell>{row.unitsSold}</TableCell>
                            <TableCell>{formatUsd(row.revenue)}</TableCell>
                            <TableCell>{formatUsd(row.taxCollected)}</TableCell>
                            <TableCell className="w-40">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: `${(row.unitsSold / maxUnits) * 100}%`,
                                  }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* ── Sales by Customer ─────────────────────────────────── */}
            <section data-ocid="sales.customers.section">
              <h2 className="font-serif text-2xl font-semibold mb-4">
                Sales by Customer
              </h2>
              {customerRows.length === 0 ? (
                <EmptyState
                  message="No customer data yet."
                  ocid="sales.customers.empty_state"
                />
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table data-ocid="sales.customers.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Items Purchased</TableHead>
                          <TableHead>Total Spent</TableHead>
                          <TableHead>Tax Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerRows.map((row, i) => (
                          <TableRow
                            key={row.customerId}
                            data-ocid={`sales.customers.row.item.${i + 1}`}
                          >
                            <TableCell className="font-mono text-xs">
                              {row.customerId}
                            </TableCell>
                            <TableCell>{row.orderCount}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {row.itemNames || "—"}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatUsd(row.totalSpent)}
                            </TableCell>
                            <TableCell>{formatUsd(row.taxPaid)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* ── All Sales ─────────────────────────────────────────── */}
            <section data-ocid="sales.all_orders.section">
              <h2 className="font-serif text-2xl font-semibold mb-4">
                All Sales
              </h2>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Input
                  placeholder="Search by customer or item…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                  data-ocid="sales.search.input"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    className="w-44"
                    data-ocid="sales.status_filter.select"
                  >
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {allSalesRows.length === 0 ? (
                <EmptyState
                  message="No orders match the current filters."
                  ocid="sales.all_orders.empty_state"
                />
              ) : (
                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table data-ocid="sales.all_orders.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>Tax</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSalesRows.map((row, i) => (
                          <TableRow
                            key={row.id}
                            data-ocid={`sales.all_orders.row.item.${i + 1}`}
                          >
                            <TableCell className="whitespace-nowrap text-sm">
                              {row.date}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {row.customer}
                            </TableCell>
                            <TableCell className="max-w-xs text-sm text-muted-foreground">
                              {row.items}
                            </TableCell>
                            <TableCell>{formatUsd(row.subtotal)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatUsd(row.tax)}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatUsd(row.total)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={row.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}
      </div>
    </AdminGuard>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  ocid,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ocid: string;
}) {
  return (
    <Card data-ocid={ocid}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold font-serif truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  onToggle,
}: {
  label: string;
  sortKey: string;
  activeKey: string | null;
  onToggle: () => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={onToggle}
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${
            activeKey === sortKey ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </button>
    </TableHead>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = statusVariant(status);
  const label =
    status === "delivered"
      ? "Delivered"
      : status === "shipped"
        ? "Shipped"
        : "Pending";
  return <Badge variant={variant}>{label}</Badge>;
}

function EmptyState({
  message,
  ocid,
}: {
  message: string;
  ocid: string;
}) {
  return (
    <Card data-ocid={ocid}>
      <CardContent className="py-12 text-center text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
