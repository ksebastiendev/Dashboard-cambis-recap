import { Decimal } from "@prisma/client/runtime/library";

// Taux moyen pondéré par les volumes.
// Formule : Σ(amount × rate) / Σ(amount)
// Toujours utiliser cette fonction — jamais une moyenne arithmétique simple.
export function weightedAvgRate(
  items: Array<{ amount: Decimal; rate: Decimal }>
): Decimal {
  const totalAmount = items.reduce((s, i) => s.add(i.amount), new Decimal(0));
  if (totalAmount.isZero()) return new Decimal(0);
  const totalWeighted = items.reduce(
    (s, i) => s.add(i.amount.mul(i.rate)),
    new Decimal(0)
  );
  return totalWeighted.div(totalAmount);
}

// Bénéfice net et marge % sur une période.
// coutTotal    = Σ(totalCfaSpent)    [TYPE_A]
// recetteTotal = Σ(totalCfaReceived) [TYPE_C]
export function calcProfit(
  totalCfaSpent: Decimal,
  totalCfaReceived: Decimal
): { profit: Decimal; marginPct: Decimal } {
  const profit = totalCfaReceived.sub(totalCfaSpent);
  const marginPct = totalCfaSpent.isZero()
    ? new Decimal(0)
    : profit.div(totalCfaSpent).mul(100);
  return { profit, marginPct };
}

// Variation % entre deux périodes.
// Retourne null si les deux valeurs sont zéro (rien à comparer).
export function calcVariation(
  current: number,
  previous: number
): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// Taux CFA/₦ minimum pour être rentable.
// Formule : tauxMoyenCfaPerUsd / tauxMoyenNgnPerUsd
// En dessous de ce taux, chaque vente ₦→CFA est à perte.
export function calcMinRate(
  avgCfaPerUsd: Decimal,
  avgNgnPerUsd: Decimal
): Decimal {
  if (avgNgnPerUsd.isZero()) return new Decimal(0);
  return avgCfaPerUsd.div(avgNgnPerUsd);
}

// Taux suggéré avec une marge cible (ex: 5 pour 5%).
export function calcSuggestedRate(
  avgCfaPerUsd: Decimal,
  avgNgnPerUsd: Decimal,
  targetMarginPct: number
): Decimal {
  const minRate = calcMinRate(avgCfaPerUsd, avgNgnPerUsd);
  return minRate.mul(new Decimal(1).add(new Decimal(targetMarginPct).div(100)));
}
