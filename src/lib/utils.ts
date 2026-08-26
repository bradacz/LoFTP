import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function joinPath(base: string, name: string) {
  if (!base || base === "/") return `/${name.replace(/^\/+/, "")}`;
  return `${base.replace(/\/+$/, "")}/${name.replace(/^\/+/, "")}`;
}

export function validateEntryName(value: string): string {
  const name = value.trim();
  if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new Error("Name must be a single file or folder name.");
  }
  return name;
}
