/**
 * Formateurs de valeurs monétaires et dates — Dashboard Cambiste
 * Centralise toute la logique de formatage pour cohérence affichage.
 */

// Formater un montant CFA
export function formatCfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Formater un montant Naira
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Formater un nombre générique avec séparateurs
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

// Formater une date courte (ex: 12 mars)
export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

// Formater une date complète (ex: 12 mars 2026)
export function formatDateFull(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// Formater une heure (ex: 14h32)
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Formater une variation % avec signe et couleur sémantique
export function formatVariation(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

// Calculer la variation % entre deux valeurs
export function calcVariation(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// Libellé du type d'opération
export function formatOperationType(type: "BUY_NAIRA" | "SELL_NAIRA"): string {
  return type === "BUY_NAIRA" ? "Achat Naira" : "Vente Naira";
}
