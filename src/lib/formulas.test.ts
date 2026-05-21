import { describe, it, expect } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  weightedAvgRate,
  calcProfit,
  calcVariation,
  calcMinRate,
  calcSuggestedRate,
} from "./formulas";

describe("weightedAvgRate", () => {
  it("calcule le taux moyen pondéré correctement", () => {
    // (10 × 615 + 5 × 620) / 15 = (6150 + 3100) / 15 = 9250 / 15 = 616.666...
    const result = weightedAvgRate([
      { amount: new Decimal(10), rate: new Decimal(615) },
      { amount: new Decimal(5), rate: new Decimal(620) },
    ]);
    expect(result.toDP(2).toNumber()).toBe(616.67);
  });

  it("retourne 0 si tous les montants sont zéro", () => {
    const result = weightedAvgRate([
      { amount: new Decimal(0), rate: new Decimal(615) },
    ]);
    expect(result.toNumber()).toBe(0);
  });

  it("retourne 0 pour un tableau vide", () => {
    const result = weightedAvgRate([]);
    expect(result.toNumber()).toBe(0);
  });

  it("fonctionne avec un seul élément", () => {
    const result = weightedAvgRate([
      { amount: new Decimal(100), rate: new Decimal(0.39) },
    ]);
    expect(result.toNumber()).toBe(0.39);
  });
});

describe("calcProfit", () => {
  it("calcule le bénéfice et la marge correctement", () => {
    // coût = 307 500, recette = 311 250 → profit = 3 750, marge = 1.2195...%
    const { profit, marginPct } = calcProfit(
      new Decimal(307500),
      new Decimal(311250)
    );
    expect(profit.toNumber()).toBe(3750);
    expect(marginPct.toDP(2).toNumber()).toBe(1.22);
  });

  it("retourne un bénéfice négatif si le coût dépasse la recette", () => {
    const { profit, marginPct } = calcProfit(
      new Decimal(10000),
      new Decimal(9000)
    );
    expect(profit.toNumber()).toBe(-1000);
    expect(marginPct.toNumber()).toBeLessThan(0);
  });

  it("retourne marginPct = 0 si le coût est zéro", () => {
    const { profit, marginPct } = calcProfit(
      new Decimal(0),
      new Decimal(5000)
    );
    expect(profit.toNumber()).toBe(5000);
    expect(marginPct.toNumber()).toBe(0);
  });

  it("retourne profit = 0 et marge = 0 si les deux sont zéro", () => {
    const { profit, marginPct } = calcProfit(new Decimal(0), new Decimal(0));
    expect(profit.toNumber()).toBe(0);
    expect(marginPct.toNumber()).toBe(0);
  });
});

describe("calcVariation", () => {
  it("calcule la variation % correctement", () => {
    // (100 - 80) / 80 × 100 = 25%
    expect(calcVariation(100, 80)).toBe(25);
  });

  it("retourne une variation négative", () => {
    expect(calcVariation(80, 100)).toBe(-20);
  });

  it("retourne null si previous = 0 et current > 0", () => {
    expect(calcVariation(50, 0)).toBeNull();
  });

  it("retourne null si les deux sont zéro", () => {
    expect(calcVariation(0, 0)).toBeNull();
  });

  it("retourne 0% si la valeur est identique", () => {
    expect(calcVariation(100, 100)).toBe(0);
  });
});

describe("calcMinRate", () => {
  it("calcule le taux minimum CFA/₦ correctement", () => {
    // 615 / 1580 = 0.38924...
    const result = calcMinRate(new Decimal(615), new Decimal(1580));
    expect(result.toDP(3).toNumber()).toBe(0.389);
  });

  it("retourne 0 si le taux NGN/$ est zéro", () => {
    const result = calcMinRate(new Decimal(615), new Decimal(0));
    expect(result.toNumber()).toBe(0);
  });
});

describe("calcSuggestedRate", () => {
  it("applique la marge cible au taux minimum", () => {
    // taux min = 615/1580 ≈ 0.38924
    // avec 5% : 0.38924 × 1.05 ≈ 0.40870
    const result = calcSuggestedRate(
      new Decimal(615),
      new Decimal(1580),
      5
    );
    expect(result.toDP(3).toNumber()).toBe(0.409);
  });

  it("retourne le taux minimum si la marge cible est 0%", () => {
    const minRate = calcMinRate(new Decimal(615), new Decimal(1580));
    const suggested = calcSuggestedRate(new Decimal(615), new Decimal(1580), 0);
    expect(suggested.toNumber()).toBe(minRate.toNumber());
  });
});
