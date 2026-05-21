# PROMPTS.md — Prompts pour Claude Code (VSCode)

> Utiliser ces prompts dans l'ordre, un par un.
> Attendre que chaque prompt soit terminé et validé avant de passer au suivant.
> Si Claude Code pose une question, répondre avant de continuer.

---

## PROMPT 0 — Lecture des specs (à envoyer en premier, une seule fois)

```
Avant de toucher au code, lis attentivement ces 4 fichiers de spécification :
- SPEC.md
- DATA_MODEL.md
- FORMULAS.md
- TASKS.md

Ce projet est un dashboard financier pour un cambiste (opérateur de change CFA/Naira). 
Les données financières sont critiques. 
Confirme-moi que tu as bien compris les 3 types d'opérations (TYPE_A, TYPE_B, TYPE_C) 
et comment le bénéfice est calculé.
```

---

## PROMPT 1 — Mise à jour du schéma Prisma

```
Tâche T1.1 + T1.2 de TASKS.md.

Mets à jour prisma/schema.prisma pour ajouter :
1. Le modèle Operation avec les champs exacts de DATA_MODEL.md
2. L'enum OperationType (TYPE_A, TYPE_B, TYPE_C)
3. Le modèle ClientType et l'enum ClientRole
4. Le modèle OperationAudit

Règles :
- Ne PAS modifier ni supprimer les modèles User, Transaction, TransactionAudit existants
- Ajouter Operation[], OperationAudit[] aux relations de User
- Ajouter les index composites décrits dans DATA_MODEL.md

Après avoir écrit le schema, lance : npx prisma validate
S'il passe, lance : npx prisma migrate dev --name add_operations_v2
```

---

## PROMPT 2 — Fichier des formules

```
Tâche T1.3 de TASKS.md.

Crée le fichier src/lib/formulas.ts avec exactement le code TypeScript 
décrit dans FORMULAS.md section 8.

Fonctions à implémenter :
- weightedAvgRate(items) : calcule le taux moyen pondéré
- calcProfit(totalCfaSpent, totalCfaReceived) : retourne profit et marginePct
- calcVariation(current, previous) : variation en %
- calcMinRate(avgCfaPerUsd, avgNgnPerUsd) : taux minimum de vente

Utiliser Decimal de "@prisma/client/runtime/library" pour tous les calculs.

Ensuite crée src/lib/formulas.test.ts avec les 3 tests décrits dans TASKS.md T1.3.
Lance npx tsc --noEmit pour vérifier qu'il n'y a pas d'erreurs TypeScript.
```

---

## PROMPT 3 — Schémas Zod

```
Tâche T1.4 de TASKS.md.

Crée src/lib/validations/operation.ts avec un schema Zod pour créer une opération.

Utilise z.discriminatedUnion sur le champ "type" avec 3 variantes :
- TYPE_A : amountUsd (>0), rateCfaPerUsd (>0) obligatoires
- TYPE_B : amountUsd (>0), rateNgnPerUsd (>0) obligatoires  
- TYPE_C : amountNgn (>0), rateCfaPerNgn (>0) obligatoires

Champs communs à tous les types :
- clientId : string optionnel (nullable)
- note : string optionnel
- operationDate : string datetime optionnel (défaut: maintenant)

Les champs qui ne correspondent pas au type doivent être absents du schema 
(pas de .optional(), vraiment absents dans chaque variante).

Lance npx tsc --noEmit après.
```

---

## PROMPT 4 — Repository des opérations

```
Tâche T2.1 de TASKS.md.

Crée src/server/repositories/operationRepo.ts.

Fonctions à implémenter :

1. createOperation(data: CreateOperationInput, userId: string)
   - Calculer totalCfaSpent / totalNgnReceived / totalCfaReceived côté serveur 
     (jamais depuis le client) selon le type :
     * TYPE_A : totalCfaSpent = amountUsd × rateCfaPerUsd
     * TYPE_B : totalNgnReceived = amountUsd × rateNgnPerUsd
     * TYPE_C : totalCfaReceived = amountNgn × rateCfaPerNgn
   - Insérer dans la table Operation avec Prisma

2. getOperations(filters: OperationFilters)
   - Filtres : type?, clientId?, dateFrom?, dateTo?, cursor?, limit=20
   - Exclure isDeleted=true
   - Inclure client (select: id, fullName)
   - Retourner {items, nextCursor}

3. getOperationById(id: string)
   - Inclure client

4. softDeleteOperation(id: string, userId: string)
   - Lire l'opération actuelle (snapshot)
   - Créer OperationAudit avec action=DELETE et snapshot JSON
   - Mettre isDeleted=true

5. updateOperation(id: string, data: UpdateOperationInput, userId: string)
   - Lire l'opération actuelle (snapshot)
   - Créer OperationAudit avec action=UPDATE et snapshot JSON
   - Recalculer les totaux après modification
   - Mettre à jour

Utiliser Decimal pour tous les calculs. Lance npx tsc --noEmit après.
```

---

## PROMPT 5 — Service dashboard

```
Tâche T2.3 de TASKS.md.

Crée src/server/services/dashboardService.ts.

Implémente la fonction getDashboardKpis(userId: string, dateFrom: Date, dateTo: Date).

Elle doit retourner l'interface DashboardKpis complète définie dans TASKS.md T2.3.

Règles importantes :
1. Utiliser des requêtes Prisma aggregate et groupBy — PAS de boucles JS sur des tableaux
2. Le stock (stockUsd, stockNgn) se calcule sans filtre de date (sur toute la durée)
3. Les taux moyens utilisent la fonction weightedAvgRate de src/lib/formulas.ts
4. Le bénéfice utilise calcProfit de src/lib/formulas.ts
5. dailyStats groupe les opérations par jour sur la période (utiliser groupBy sur operationDate tronqué au jour)
6. topClients : top 5 clients TYPE_C par SUM(totalCfaReceived) sur la période
7. tauxMinCfaPerNgn : calculer avec calcMinRate, retourner null si données insuffisantes

Convertir tous les Decimal en number avec .toNumber() uniquement au moment du return final.
Lance npx tsc --noEmit après.
```

---

## PROMPT 6 — Routes API

```
Tâches T3.1, T3.2, T3.3 de TASKS.md.

Crée les routes API suivantes dans src/app/api/ :

1. src/app/api/operations/route.ts (GET + POST)
   - GET : appelle operationRepo.getOperations() avec les query params
   - POST : valide avec createOperationSchema (Zod), appelle operationRepo.createOperation()
   - Les deux appellent requireAuth() en premier

2. src/app/api/operations/[id]/route.ts (PATCH + DELETE)
   - PATCH : audit obligatoire via operationRepo.updateOperation()
   - DELETE : soft delete via operationRepo.softDeleteOperation()

3. src/app/api/dashboard/route.ts (GET)
   - Query params : period (1d|7d|1m|1y|all|custom), from?, to?
   - Convertir period en dateFrom/dateTo
   - Appeler dashboardService.getDashboardKpis()
   - Sérialiser : tous les Decimal → string (pas number, pour éviter la perte de précision)

4. src/app/api/clients/search/route.ts (GET)
   - Query param : q (optionnel)
   - Si q vide → retourner les 5 clients avec la dernière opération la plus récente
   - Si q présent → recherche sur fullName (ILIKE)
   - Max 5 résultats

Chaque route : 400 si validation échoue, 401 si non auth, 404 si not found, 500 avec message si erreur serveur.
Lance npx tsc --noEmit après.
```

---

## PROMPT 7 — Page Opérations (formulaires)

```
Tâche T4.1 de TASKS.md.

Crée src/app/(app)/operations/page.tsx — c'est la page la plus importante de l'app.

Interface :
- 3 boutons larges en haut : "Achat $" (bleu), "Vente $ → ₦" (orange), "Vente ₦ → CFA" (vert)
- Chaque bouton ouvre un Sheet (Radix/shadcn) qui monte du bas sur mobile
- Dans chaque Sheet, un formulaire react-hook-form + Zod

Formulaire TYPE_A "Achat $" :
  - Champ "Montant ($)" — inputMode="decimal" — requis
  - Champ "Taux (CFA par $)" — inputMode="decimal" — requis
  - Aperçu calculé en temps réel : "= X CFA dépensés" (montant × taux)
  - Champ "Avec qui ?" — combobox avec autocomplétion via /api/clients/search — FACULTATIF
  - Champ "Date" — datetime-local — défaut: maintenant — FACULTATIF
  - Bouton "Enregistrer" large

Formulaire TYPE_B "Vente $ → ₦" :
  - Champ "Montant ($)" — inputMode="decimal" — requis
  - Champ "Taux (₦ par $)" — inputMode="decimal" — requis
  - Aperçu : "= X ₦ reçus"
  - Champ "Avec qui ?" — FACULTATIF
  - Champ "Date" — FACULTATIF
  - Bouton "Enregistrer" large

Formulaire TYPE_C "Vente ₦ → CFA" :
  - Champ "Montant (₦)" — inputMode="decimal" — requis
  - Champ "Taux (CFA par ₦)" — inputMode="decimal" — requis
  - Aperçu : "= X CFA reçus"
  - Champ "Avec qui ?" — FACULTATIF
  - Champ "Date" — FACULTATIF
  - Bouton "Enregistrer" large

Après soumission réussie :
  - Toast Sonner "Opération enregistrée ✓"
  - Fermer le Sheet
  - Invalider les queries TanStack : ["operations"], ["dashboard"]

Sous les 3 boutons, afficher les 5 dernières opérations du jour (toutes types confondus)
sous forme de liste compacte. Fetch via /api/operations?period=today&limit=5.
```

---

## PROMPT 8 — Page Dashboard

```
Tâche T4.2 de TASKS.md.

Crée src/app/(app)/dashboard/page.tsx.

Composant client avec TanStack Query. Fetch /api/dashboard?period={period}.

Structure de la page :

1. Sélecteur de période (tabs ou boutons) :
   1J | 7J | 1M | 1AN | Perso | Tout
   → "Perso" affiche deux inputs date (from/to)
   → Quand la période change, refetch automatique

2. Bloc Bénéfice (le plus grand, en haut) :
   - Bénéfice net en gros (vert si positif, rouge si négatif)
   - Marge % en dessous
   - Coût total vs Recette totale côte à côte

3. Trois blocs KPI côte à côte (cards) :
   - Bloc A : $ achetés, taux moyen CFA/$, CFA dépensé
   - Bloc B : $ convertis, taux moyen ₦/$, ₦ obtenu
   - Bloc C : ₦ vendus, taux moyen CFA/₦, CFA encaissé

4. Bloc Stock (si stockUsd ou stockNgn est négatif → fond orange avec avertissement) :
   - Stock $ restant estimé
   - Stock ₦ restant estimé

5. Graphe bénéfice par jour (Recharts BarChart) sur la période

6. Top 5 clients TYPE_C (tableau : nom, nb ops, volume CFA)

7. Si tauxMinCfaPerNgn disponible : encart "Taux minimum suggéré : X CFA/₦"

Afficher des skeletons pendant le chargement.
Tous les montants CFA formatés avec formatCfa(), Naira avec formatNaira(), $ avec formatUsd().
Ces fonctions doivent être dans src/lib/formatters.ts.
```

---

## PROMPT 9 — Page Clients + fix /clients/[id]

```
Tâche T4.3 de TASKS.md.

1. Mets à jour src/app/(app)/clients/page.tsx :
   - Filtre par type en haut (tabs : Tous | Acheteurs ₦→CFA | Vendeurs $ | Acheteurs $→₦)
   - "Acheteurs ₦→CFA" est l'onglet par défaut
   - Formulaire de création inline avec champs : fullName (requis), phone (optionnel), types[] (checkboxes)
   - Liste des clients avec : nom, téléphone, types (badges), dernière opération, nb total ops

2. Crée (ou répare) src/app/(app)/clients/[id]/page.tsx :
   - Page SSR (pas client)
   - Stats en haut : nb ops TYPE_A/B/C, volume CFA total (TYPE_C), fréquence/semaine, dernière op
   - Formulaire de modification (fullName, phone, note, types)
   - Liste des 20 dernières opérations du client

Si le fichier existait déjà en V1 et ne se compilait pas, identifie pourquoi et corrige.
Lance npx next build après pour vérifier que /clients/[id] est bien compilé.
```

---

## PROMPT 10 — Historique et navigation

```
Tâches T4.4 + T4.5 de TASKS.md.

1. Mets à jour src/app/(app)/history/page.tsx :
   - Filtres : type (A/B/C/Tous), client (search), dateFrom, dateTo
   - Infinite scroll cursor-based, 20 items par page
   - Chaque ligne : badge type coloré (A=bleu, B=orange, C=vert), montants clés, taux, client si dispo, date
   - Bouton crayon (modifier) et poubelle (supprimer) sur chaque ligne
   - Modal de confirmation avant suppression

2. Mets à jour la navigation (bottom bar mobile + sidebar desktop) :
   - Ordre : Opérations (icône +) | Dashboard (icône 📊) | Clients (icône 👥) | Historique (icône 📋)
   - Route par défaut à l'ouverture = /operations
   - Mets à jour middleware.ts si nécessaire pour rediriger / vers /operations

Lance npx next build pour vérifier que tout compile.
```

---

## PROMPT 11 — Build final et déploiement

```
Tâche T5 de TASKS.md.

1. Lance npx next build — corrige toutes les erreurs jusqu'à ce que le build passe proprement.

2. Crée .env.example avec les variables :
   DATABASE_URL=
   DIRECT_URL=
   SESSION_SECRET=
   NEXT_PUBLIC_APP_URL=

3. Vérifie que .env est bien dans .gitignore.

4. Pour le déploiement Vercel :
   - Crée vercel.json si nécessaire
   - Liste toutes les variables d'environnement à configurer dans le dashboard Vercel
   - La commande de build doit être : prisma migrate deploy && next build
   
5. Optionnel PWA : si next-pwa n'est pas installé, installe-le et configure next.config.ts 
   pour générer le service worker. Crée public/manifest.json avec :
   name: "Cambis Dashboard"
   short_name: "Cambis"
   theme_color: couleur principale de l'app
   display: "standalone"
   start_url: "/operations"
```

---

## Notes importantes pour Claude Code

- **Ne jamais supprimer les tables V1** (Transaction, TransactionAudit) sans backup confirmé
- **Tous les calculs financiers passent par src/lib/formulas.ts** — aucune duplication
- **Decimal Prisma** pour les montants, jamais `number` natif pour les calculs
- **requireAuth()** en première ligne de chaque route API
- **Audit trail** obligatoire sur chaque UPDATE et DELETE
- En cas de doute sur une formule, se référer à FORMULAS.md
- En cas de doute sur le métier, se référer à SPEC.md
