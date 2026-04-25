import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { InfoIcon } from "./InfoIcon";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Optional tooltip body shown next to the header. */
  info?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  render: (row: T, idx: number) => ReactNode;
}

interface StatTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  rowKey?: (row: T, idx: number) => string;
  compact?: boolean;
  highlightRow?: (row: T, idx: number) => boolean;
}

export function StatTable<T>({
  rows,
  columns,
  emptyMessage = "No data",
  rowKey,
  compact,
  highlightRow,
}: StatTableProps<T>) {
  if (rows.length === 0) {
    return <div className="text-sm text-ink-dim py-3">{emptyMessage}</div>;
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3",
                  compact ? "py-1.5" : "py-2.5",
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left",
                  col.className
                )}
              >
                {col.header}
                {col.info && <InfoIcon label={col.info} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={rowKey ? rowKey(row, idx) : idx}
              className={cn(
                "border-b border-white/5 hover:bg-white/[0.02]",
                highlightRow?.(row, idx) && "bg-white/[0.04]"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-3",
                    compact ? "py-1.5" : "py-2.5",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left",
                    col.className
                  )}
                >
                  {col.render(row, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
