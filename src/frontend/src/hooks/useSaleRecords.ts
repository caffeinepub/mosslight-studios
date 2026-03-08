// src/frontend/src/hooks/useSaleRecords.ts
// Tracks actual units sold per variant in localStorage — admin-only, no backend needed.

import { useCallback, useState } from "react";
import type { SaleRecord } from "../types/catalog";

const STORAGE_KEY = "mosslight_sale_records";

function loadRecords(): Record<string, SaleRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SaleRecord>) : {};
  } catch {
    return {};
  }
}

function saveRecords(records: Record<string, SaleRecord>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function useSaleRecords() {
  const [records, setRecords] =
    useState<Record<string, SaleRecord>>(loadRecords);

  const setSaleRecord = useCallback(
    (
      item_name: string,
      size: string,
      merch_type: string,
      units_sold: number,
    ) => {
      const key = `${item_name}::${size}::${merch_type}`;
      const record: SaleRecord = {
        key,
        item_name,
        size,
        merch_type,
        units_sold,
        updatedAt: new Date().toISOString(),
      };
      setRecords((prev) => {
        const next = { ...prev, [key]: record };
        saveRecords(next);
        return next;
      });
      return record;
    },
    [],
  );

  const getSaleRecord = useCallback(
    (
      item_name: string,
      size: string,
      merch_type: string,
    ): SaleRecord | undefined => {
      const key = `${item_name}::${size}::${merch_type}`;
      return records[key];
    },
    [records],
  );

  const getAllSaleRecords = useCallback((): SaleRecord[] => {
    return Object.values(records);
  }, [records]);

  return { records, setSaleRecord, getSaleRecord, getAllSaleRecords };
}
