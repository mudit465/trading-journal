import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  if (isNaN(value)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function getPnlColor(value: number) {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-zinc-400";
}

export function getInitials(name: string) {
  if (!name) return "U";

  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "U";
  }

  return (
    (parts[0][0] ?? "") + (parts[1][0] ?? "")
  ).toUpperCase();
}