# SPEC.md — Dashboard Cambiste V2
> Fichier de référence métier. À lire en entier avant toute modification du code.

---

## 1. Contexte métier

Le cambiste fait du change manuel CFA ↔ Naira. Son cycle de travail quotidien suit **3 opérations dans l'ordre** :

1. Il achète des dollars ($) avec du CFA — chez des particuliers ou sur Bybit
2. Il vend ces dollars contre du Naira — à des Nigérians
3. Il vend le Naira contre du CFA — à ses clients (c'est sa vente finale, là où il fait sa marge)

**Exemple simple :**
```
100 CFA → 1 $  (taux : 100 CFA/$)
1 $     → 1 000 ₦  (taux : 1 000 ₦/$)
1 000 ₦ → 120 CFA  (taux : 0.12 CFA/₦)

Coût    = 100 CFA
Recette = 120 CFA
Bénéfice = +20 CFA
```

L'app doit faire ce calcul automatiquement sur n'importe quelle période.

### Contraintes critiques
- **Pas de traçabilité lot par lot** : le cambiste travaille en "pot commun". On agrège les totaux, on ne lie pas un achat $ à une vente ₦ spécifique.
- **Saisie en moins de 5 secondes** : 2 champs maximum par opération.
- **Utilisable sur téléphone** en priorité.
- **Les données financières ne doivent jamais être perdues** : pas de suppression définitive, audit trail obligatoire.

---

## 2. Les 3 types d'opérations

### TYPE A — Achat de dollars (CFA → $)
| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `amount_usd` | Decimal | ✅ | Nombre de dollars achetés |
| `rate_cfa_per_usd` | Decimal | ✅ | Prix payé en CFA pour 1 dollar |
| `client_id` | FK | ❌ | Vendeur de dollars (optionnel) |
| `note` | String | ❌ | Remarque libre |
| `operation_date` | DateTime | auto | Date/heure de l'opération |

**Valeur calculée automatiquement :**
```
total_cfa_spent = amount_usd × rate_cfa_per_usd
```

---

### TYPE B — Vente de dollars contre Naira ($ → ₦)
| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `amount_usd` | Decimal | ✅ | Nombre de dollars vendus |
| `rate_ngn_per_usd` | Decimal | ✅ | Naira reçus pour 1 dollar |
| `client_id` | FK | ❌ | Acheteur de dollars (optionnel) |
| `note` | String | ❌ | Remarque libre |
| `operation_date` | DateTime | auto | Date/heure de l'opération |

**Valeur calculée automatiquement :**
```
total_ngn_received = amount_usd × rate_ngn_per_usd
```

---

### TYPE C — Vente de Naira contre CFA (₦ → CFA)
| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `amount_ngn` | Decimal | ✅ | Nombre de Naira vendus |
| `rate_cfa_per_ngn` | Decimal | ✅ | CFA reçus pour 1 Naira |
| `client_id` | FK | ❌ | Acheteur de Naira (optionnel) — **client prioritaire** |
| `note` | String | ❌ | Remarque libre |
| `operation_date` | DateTime | auto | Date/heure de l'opération |

**Valeur calculée automatiquement :**
```
total_cfa_received = amount_ngn × rate_cfa_per_ngn
```

---

## 3. Le Dashboard

### Filtres de période
Le cambiste choisit sa période d'analyse :
- `1J` — aujourd'hui uniquement
- `7J` — 7 derniers jours
- `1M` — 30 derniers jours
- `1AN` — 365 derniers jours
- `Personnalisé` — date début + date fin au choix
- `Tout` — depuis le début

### KPIs affichés

#### Bloc A — Achats de dollars
```
Total $ achetés         : Σ amount_usd  (TYPE A)
Taux moyen CFA/$        : Σ(amount_usd × rate_cfa_per_usd) ÷ Σ(amount_usd)
Total CFA dépensé       : Σ(amount_usd × rate_cfa_per_usd)
```

#### Bloc B — Conversion $ → ₦
```
Total $ convertis       : Σ amount_usd  (TYPE B)
Taux moyen ₦/$          : Σ(amount_usd × rate_ngn_per_usd) ÷ Σ(amount_usd)
Total ₦ obtenu          : Σ(amount_usd × rate_ngn_per_usd)
```

#### Bloc C — Ventes ₦ → CFA
```
Total ₦ vendu           : Σ amount_ngn  (TYPE C)
Taux moyen CFA/₦        : Σ(amount_ngn × rate_cfa_per_ngn) ÷ Σ(amount_ngn)
Total CFA encaissé      : Σ(amount_ngn × rate_cfa_per_ngn)
```

#### Bloc Bénéfice — le plus important
```
Coût total      = Σ(amount_usd × rate_cfa_per_usd)   [TYPE A]
Recette totale  = Σ(amount_ngn × rate_cfa_per_ngn)   [TYPE C]
Bénéfice net    = Recette — Coût
Marge %         = (Bénéfice ÷ Coût) × 100
```

#### Bloc Stock estimé (pot commun)
```
Stock $ restant  = Σ amount_usd [TYPE A]  —  Σ amount_usd [TYPE B]
Stock ₦ restant  = Σ total_ngn_received [TYPE B]  —  Σ amount_ngn [TYPE C]
```
> ⚠️ Le stock est indicatif. Il peut être négatif si des opérations passées n'ont pas été saisies. Ne jamais bloquer une saisie à cause du stock.

#### Bloc Activité clients
```
Nombre d'opérations TYPE C (ventes ₦→CFA)  ← le plus important
Nombre de clients distincts sur la période
Nouveaux clients sur la période
```

### Graphiques
- **Graphe bénéfice** : bénéfice par jour sur la période sélectionnée (barres)
- **Graphe volume** : CFA traité par jour (ligne)
- **Top clients** : classement des acheteurs ₦→CFA par volume CFA sur la période

---

## 4. Gestion des clients

### Informations stockées
| Champ | Type | Description |
|---|---|---|
| `full_name` | String | Nom ou surnom |
| `phone` | String? | Téléphone (optionnel) |
| `client_type` | Enum | Voir types ci-dessous |
| `note` | String? | Remarque libre |
| `is_active` | Boolean | Soft delete |
| `created_at` | DateTime | Date d'ajout |

### Types de clients
```
DOLLAR_SELLER     — Vendeur de dollars (impliqué dans TYPE A)
DOLLAR_BUYER      — Acheteur de dollars contre Naira (impliqué dans TYPE B)
NAIRA_BUYER       — Acheteur de Naira contre CFA (impliqué dans TYPE C) ← PRIORITAIRE
```
Un client peut avoir plusieurs types.

### KPIs par client
- Nombre total d'opérations (par type)
- Volume total CFA traité
- Fréquence (opérations par semaine en moyenne)
- Dernière opération : date + type
- Évolution : actif / inactif depuis X jours

### Recherche rapide dans les formulaires
Lors d'une opération, le champ "Avec qui ?" :
- Autocomplétion dès la 1ère lettre tapée
- Affiche les 5 clients les plus récents par défaut (sans taper)
- Sélection en un tap
- Pas obligatoire : peut être ignoré

---

## 5. Historique

- Liste de toutes les opérations, toutes types confondus
- Filtres : type (A/B/C), client, période
- Pagination cursor-based (20 par page)
- Chaque ligne montre : type, montant, taux, client (si renseigné), date
- Modification possible (crée un audit)
- Pas de suppression définitive : soft delete avec audit

---

## 6. Navigation (mobile-first)

```
Barre de navigation bas (mobile) / sidebar (desktop) :
  📊 Dashboard
  ➕ Opérations   ← page principale avec 3 boutons TYPE A / B / C
  👥 Clients
  📋 Historique
```

La page **Opérations** est la page par défaut à l'ouverture (pas le dashboard).
Le cambiste doit pouvoir saisir une opération en moins de 5 secondes depuis l'ouverture de l'app.

---

## 7. Règles de gestion importantes

1. **Tous les taux sont saisis manuellement** — pas d'API externe de taux de change.
2. **Les montants sont toujours positifs** — validation côté client et serveur.
3. **La date est automatique** (now()) mais modifiable si l'utilisateur veut corriger une saisie oubliée.
4. **Les taux moyens sont toujours pondérés par les volumes**, jamais une simple moyenne arithmétique.
5. **Le bénéfice compare TYPE A (coût CFA) vs TYPE C (recette CFA)** — le TYPE B est le flux intermédiaire.
6. **Ne jamais supprimer une opération** — soft delete + audit trail avec snapshot JSON.
7. **Les calculs de bénéfice doivent utiliser les valeurs Decimal de Prisma** pour éviter les erreurs de virgule flottante sur de grands montants CFA.
