# FORMULAS.md — Formules de calcul

> Toutes les formules financières de l'application.
> Ces formules doivent être implémentées dans `src/lib/formulas.ts`
> et utilisées PARTOUT dans l'app (dashboard, API, rapports).
> Ne jamais dupliquer ces calculs ailleurs.

---

## 1. Valeurs calculées par opération (côté serveur, au moment de la saisie)

### TYPE_A — Achat de dollars
```
totalCfaSpent = amountUsd × rateCfaPerUsd
```
Exemple : 10$ à 615 CFA/$ → totalCfaSpent = 6 150 CFA

### TYPE_B — Vente de dollars contre Naira
```
totalNgnReceived = amountUsd × rateNgnPerUsd
```
Exemple : 10$ à 1 580 ₦/$ → totalNgnReceived = 15 800 ₦

### TYPE_C — Vente de Naira contre CFA
```
totalCfaReceived = amountNgn × rateCfaPerNgn
```
Exemple : 15 800 ₦ à 0.39 CFA/₦ → totalCfaReceived = 6 162 CFA

---

## 2. Agrégats sur une période (dashboard)

> Toujours utiliser des requêtes SQL avec SUM() pour ces calculs,
> jamais itérer en JavaScript sur un tableau d'objets.

### Total dollars achetés (TYPE_A)
```sql
SELECT SUM("amountUsd") as total_usd_bought
FROM "Operation"
WHERE type = 'TYPE_A'
  AND "isDeleted" = false
  AND "operationDate" BETWEEN :start AND :end
```

### Taux moyen pondéré CFA/$ (TYPE_A)
```
tauxMoyenCfaPerUsd = SUM(amountUsd × rateCfaPerUsd) ÷ SUM(amountUsd)
                   = SUM(totalCfaSpent) ÷ SUM(amountUsd)
```
```sql
SELECT
  SUM("amountUsd")      as total_usd,
  SUM("totalCfaSpent")  as total_cfa_spent,
  CASE WHEN SUM("amountUsd") > 0
    THEN SUM("totalCfaSpent") / SUM("amountUsd")
    ELSE 0
  END as avg_rate_cfa_per_usd
FROM "Operation"
WHERE type = 'TYPE_A' AND "isDeleted" = false
  AND "operationDate" BETWEEN :start AND :end
```

### Total Naira obtenu + taux moyen ₦/$ (TYPE_B)
```
tauxMoyenNgnPerUsd = SUM(totalNgnReceived) ÷ SUM(amountUsd)
```

### Total CFA encaissé + taux moyen CFA/₦ (TYPE_C)
```
tauxMoyenCfaPerNgn = SUM(totalCfaReceived) ÷ SUM(amountNgn)
```

---

## 3. Calcul du bénéfice — LE PLUS IMPORTANT

```
coutTotal     = SUM(totalCfaSpent)    [toutes les opérations TYPE_A sur la période]
recetteTotal  = SUM(totalCfaReceived) [toutes les opérations TYPE_C sur la période]
beneficeNet   = recetteTotal - coutTotal
margePercent  = (beneficeNet / coutTotal) × 100   [si coutTotal > 0]
```

### Exemple chiffré
```
TYPE_A sur la journée : 500$ achetés, taux moyen 615 CFA/$
  → coutTotal = 307 500 CFA

TYPE_C sur la journée : 750 000 ₦ vendus, taux moyen 0.415 CFA/₦
  → recetteTotal = 311 250 CFA

beneficeNet  = 311 250 - 307 500 = +3 750 CFA
margePercent = (3 750 / 307 500) × 100 = 1.22%
```

---

## 4. Stock estimé (indicatif)

```
stockUsd  = SUM(amountUsd) [TYPE_A]  -  SUM(amountUsd) [TYPE_B]
stockNgn  = SUM(totalNgnReceived) [TYPE_B]  -  SUM(amountNgn) [TYPE_C]
```

> ⚠️ Le stock peut être négatif (opérations antérieures non saisies).
> Afficher un avertissement si négatif, ne jamais bloquer.
> Le stock est calculé sur TOUTE la durée (filtre = "Tout"),
> pas seulement sur la période du dashboard.

---

## 5. Taux de rentabilité minimum (indicatif, facultatif V2)

Aide le cambiste à fixer son taux de vente ₦→CFA pour être rentable.

```
// Coût d'un Naira en CFA (en partant du coût d'achat du $)
coutNairaEnCfa = tauxMoyenCfaPerUsd / tauxMoyenNgnPerUsd

// Taux minimum pour rentrer dans ses frais
tauxMinCfaPerNgn = coutNairaEnCfa

// Taux suggéré avec une marge cible de X%
tauxSuggereCfaPerNgn = coutNairaEnCfa × (1 + margeTargetPercent / 100)
```

Exemple :
```
tauxMoyenCfaPerUsd = 615
tauxMoyenNgnPerUsd = 1 580
coutNairaEnCfa     = 615 / 1 580 = 0.389 CFA/₦

Pour une marge de 5% :
tauxSuggere = 0.389 × 1.05 = 0.408 CFA/₦
```

---

## 6. KPIs clients

### Fréquence d'un client
```
nbSemaines    = (dateDerniereOp - datePremierOp) / 7
frequence     = nbOperations / nbSemaines   [ops par semaine]
```

### Volume total CFA d'un client (TYPE_C uniquement)
```
volumeClientCfa = SUM(totalCfaReceived) WHERE clientId = :id AND type = 'TYPE_C'
```

---

## 7. Évolution (variation %)

```
variation% = ((valeurActuelle - valeurPrecedente) / valeurPrecedente) × 100
```

- Si valeurPrecedente = 0 et valeurActuelle > 0 → afficher "Nouveau"
- Si valeurPrecedente = 0 et valeurActuelle = 0 → afficher "—"
- Seuil d'affichage : > +2% = vert ↑, < -2% = rouge ↓, entre les deux = gris →

---

## 8. Implémentation TypeScript

```typescript
// src/lib/formulas.ts
import { Decimal } from "@prisma/client/runtime/library";

// Toujours travailler avec Decimal pour les montants CFA/Naira
// pour éviter les erreurs de virgule flottante sur de grands montants.

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

export function calcVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function calcMinRate(
  avgCfaPerUsd: Decimal,
  avgNgnPerUsd: Decimal
): Decimal {
  if (avgNgnPerUsd.isZero()) return new Decimal(0);
  return avgCfaPerUsd.div(avgNgnPerUsd);
}
```
