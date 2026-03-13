import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitaire de fusion des classes Tailwind.
 * Gère les conflits de classes et les valeurs conditionnelles.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
