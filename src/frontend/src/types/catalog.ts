// src/frontend/src/types/catalog.ts
// Private financial data — never exposed to customers

export interface ProductCatalogEntry {
  id: string;
  merch_type: string;
  item_name: string;
  size: string;
  total_cost: number;
  production_cost: number;
  profit_margin: number;
  profit_amount: number;
  shipping: number;
  az_tax_rate: number;
  az_tax_total: number;
  quarter_sales: number;
  quarterly_earnings: number;
  yearly_sales: number;
  yearly_earnings: number;
  linkedProductId?: string;
  createdAt: bigint;
}

export interface ProductCatalogEntryInput {
  merch_type: string;
  item_name: string;
  size: string;
  total_cost: number;
  production_cost: number;
  profit_margin: number;
  profit_amount: number;
  shipping: number;
  az_tax_rate: number;
  az_tax_total: number;
  quarter_sales: number;
  quarterly_earnings: number;
  yearly_sales: number;
  yearly_earnings: number;
  linkedProductId?: string;
}

// Units sold tracking — stored in localStorage, admin-only
export interface SaleRecord {
  key: string; // composite: "item_name::size::merch_type"
  item_name: string;
  size: string;
  merch_type: string;
  units_sold: number;
  updatedAt: string; // ISO date string
}
