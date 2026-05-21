# TASKS.md — Plan d'implémentation V2

> Tâches ordonnées. Compléter chaque tâche entièrement avant de passer à la suivante.
> Chaque tâche a des critères de validation clairs.
> Ne jamais casser le build entre deux tâches.

---

## PHASE 0 — Préparation (avant tout changement)

### T0.1 — Sauvegarde des données V1
- [ ] Exporter toutes les données actuelles de Supabase (backup SQL complet)
- [ ] Versionner le `schema.prisma` actuel dans git avant toute modification
- [ ] S'assurer que `git status` est propre avant de commencer

**Validation :** backup SQL présent, git clean.

---

### T0.2 — Lire tous les fichiers de spec
- [ ] Lire `SPEC.md` en entier
- [ ] Lire `DATA_MODEL.md` en entier
- [ ] Lire `FORMULAS.md` en entier
- [ ] Lire ce fichier `TASKS.md` en entier

**Validation :** aucune question sur le métier ne devrait rester sans réponse après cette lecture.

---

## PHASE 1 — Modèle de données

### T1.1 — Mise à jour du schéma Prisma
- [ ] Ouvrir `prisma/schema.prisma`
- [ ] Ajouter le modèle `Operation` (voir DATA_MODEL.md section 1)
- [ ] Ajouter l'enum `OperationType` (TYPE_A, TYPE_B, TYPE_C)
- [ ] Mettre à jour le modèle `Client` pour ajouter `ClientType[]` et `ClientRole`
- [ ] Ajouter le modèle `OperationAudit`
- [ ] Mettre à jour `User` pour référencer `Operation[]` et `OperationAudit[]`
- [ ] Garder les anciens modèles `Transaction` et `TransactionAudit` tels quels pour l'instant

**Validation :** `npx prisma validate` passe sans erreur.

---

### T1.2 — Migration base de données
- [ ] Lancer `npx prisma migrate dev --name add_operations_v2`
- [ ] Vérifier que les nouvelles tables sont créées dans Supabase
- [ ] Vérifier que les anciennes tables `Transaction` et `TransactionAudit` sont toujours là

**Validation :** `npx prisma studio` montre les nouvelles tables vides et les anciennes intactes.

---

### T1.3 — Fichier des formules
- [ ] Créer `src/lib/formulas.ts` avec le code TypeScript de FORMULAS.md section 8
- [ ] Ajouter les fonctions : `weightedAvgRate`, `calcProfit`, `calcVariation`, `calcMinRate`
- [ ] Écrire les tests unitaires dans `src/lib/formulas.test.ts` (voir exemples ci-dessous)

**Tests à écrire :**
```typescript
// weightedAvgRate
// input: [{amount: 10, rate: 615}, {amount: 5, rate: 620}]
// expected: (10×615 + 5×620) / 15 = 616.67

// calcProfit
// input: coutTotal=307500, recetteTotal=311250
// expected: profit=3750, marginPct=1.22

// calcVariation
// input: current=100, previous=80
// expected: 25
```

**Validation :** `npx tsc --noEmit` passe, tests passent.

---

### T1.4 — Schémas de validation Zod
- [ ] Créer `src/lib/validations/operation.ts`
- [ ] Schema `createOperationSchema` avec 3 variantes selon le type (voir règles DATA_MODEL.md)
- [ ] Le type conditionne les champs obligatoires (utiliser `z.discriminatedUnion`)
- [ ] Les montants doivent être > 0
- [ ] `operationDate` est optionnel (défaut: now())
- [ ] `clientId` est optionnel (string ou null)

**Validation :** `npx tsc --noEmit` passe.

---

## PHASE 2 — Couche serveur (repositories + services)

### T2.1 — Repository des opérations
- [ ] Créer `src/server/repositories/operationRepo.ts`
- [ ] Fonction `createOperation(data, userId)` — calcule les totaux côté serveur avant insertion
- [ ] Fonction `getOperations(filters)` — filtres : type, clientId, dateFrom, dateTo, isDeleted=false, cursor
- [ ] Fonction `getOperationById(id)` — avec client inclus
- [ ] Fonction `softDeleteOperation(id, userId)` — isDeleted=true + crée OperationAudit
- [ ] Fonction `updateOperation(id, data, userId)` — snapshot avant update + OperationAudit

**Règle importante :** `totalCfaSpent`, `totalNgnReceived`, `totalCfaReceived` sont TOUJOURS calculés dans ce repository, jamais acceptés depuis l'extérieur.

**Validation :** `npx tsc --noEmit` passe.

---

### T2.2 — Repository des clients
- [ ] Mettre à jour `src/server/repositories/clientRepo.ts`
- [ ] Ajouter `getClientsByType(type: ClientRole)` 
- [ ] Ajouter `searchClients(query, limit=5)` — recherche sur fullName, retourne les 5 plus récents si query vide
- [ ] Mettre à jour `createClient` pour accepter `types: ClientRole[]`
- [ ] Fonction `getClientStats(clientId)` — stats par type d'opération

**Validation :** `npx tsc --noEmit` passe.

---

### T2.3 — Service dashboard
- [ ] Créer `src/server/services/dashboardService.ts`
- [ ] Fonction `getDashboardKpis(userId, dateFrom, dateTo)` qui retourne :

```typescript
interface DashboardKpis {
  // Bloc A
  totalUsdBought: Decimal;
  avgRateCfaPerUsd: Decimal;
  totalCfaSpent: Decimal;
  countTypeA: number;

  // Bloc B
  totalUsdSold: Decimal;
  avgRateNgnPerUsd: Decimal;
  totalNgnReceived: Decimal;
  countTypeB: number;

  // Bloc C
  totalNgnSold: Decimal;
  avgRateCfaPerNgn: Decimal;
  totalCfaReceived: Decimal;
  countTypeC: number;

  // Bénéfice
  beneficeNet: Decimal;
  marginePct: Decimal;

  // Stock (calculé sur TOUT le temps, pas juste la période)
  stockUsd: Decimal;
  stockNgn: Decimal;

  // Activité clients
  nbOperationsTypeC: number;
  nbDistinctClients: number;
  nbNewClients: number;

  // Pour les graphes
  dailyStats: Array<{
    date: string;
    benefice: number;
    volumeCfa: number;
    countOps: number;
  }>;

  // Top clients TYPE_C
  topClients: Array<{
    clientId: string;
    fullName: string;
    totalCfaReceived: number;
    nbOps: number;
  }>;

  // Taux minimum suggéré (facultatif)
  tauxMinCfaPerNgn: Decimal | null;
}
```

- [ ] Utiliser les formules de `src/lib/formulas.ts` pour tous les calculs
- [ ] Utiliser des requêtes Prisma `groupBy` et `aggregate` — pas de boucles JS sur les données
- [ ] Le stock est calculé sans filtre de date (toujours sur tout le temps)

**Validation :** `npx tsc --noEmit` passe, les calculs sont cohérents avec FORMULAS.md.

---

## PHASE 3 — API REST

### T3.1 — Routes des opérations
- [ ] `GET  /api/operations` — liste paginée avec filtres (type, clientId, dateFrom, dateTo, cursor)
- [ ] `POST /api/operations` — créer une opération (valider avec Zod, calculer totaux côté serveur)
- [ ] `PATCH /api/operations/[id]` — modifier (audit obligatoire)
- [ ] `DELETE /api/operations/[id]` — soft delete (audit obligatoire)

**Chaque route doit :**
- Appeler `requireAuth()` en premier
- Valider le body avec le schema Zod approprié
- Retourner des erreurs claires (400 validation, 401 auth, 404 not found, 500 server)

**Validation :** tester avec curl ou un client HTTP — chaque route répond correctement.

---

### T3.2 — Route dashboard
- [ ] `GET /api/dashboard?period=1d|7d|1m|1y|all&from=&to=`
- [ ] Appeler `dashboardService.getDashboardKpis()`
- [ ] Convertir les `Decimal` en `number` ou `string` avant de sérialiser en JSON

**Validation :** la route retourne un JSON avec tous les champs de `DashboardKpis`.

---

### T3.3 — Routes clients (mise à jour)
- [ ] `GET  /api/clients/search?q=` — autocomplétion (max 5 résultats, triés par dernière opération)
- [ ] `POST /api/clients` — accepte `types: ClientRole[]`
- [ ] `GET  /api/clients/[id]/stats` — stats avec détail par type d'opération

**Validation :** `npx tsc --noEmit` passe.

---

## PHASE 4 — Interface utilisateur

### T4.1 — Page Opérations (priorité absolue)
Fichier : `src/app/(app)/operations/page.tsx`

- [ ] Afficher 3 boutons principaux : "Achat $", "Vente $ → ₦", "Vente ₦ → CFA"
- [ ] Chaque bouton ouvre un formulaire en modal/sheet
- [ ] Formulaire TYPE_A : 2 champs (montant $, taux CFA/$) + champ facultatif client + date modifiable
- [ ] Formulaire TYPE_B : 2 champs (montant $, taux ₦/$) + champ facultatif client + date modifiable
- [ ] Formulaire TYPE_C : 2 champs (montant ₦, taux CFA/₦) + champ facultatif client + date modifiable
- [ ] Champ client : autocomplétion avec `GET /api/clients/search`, 5 récents par défaut
- [ ] Afficher le total calculé en temps réel sous les champs (ex : "= 6 150 CFA")
- [ ] Soumission avec react-hook-form + Zod
- [ ] Toast de succès via Sonner après soumission
- [ ] Invalider le cache TanStack Query après soumission
- [ ] La page est la page par défaut à l'ouverture de l'app

**UX mobile obligatoire :**
- Champs numériques avec `inputMode="decimal"` pour ouvrir le clavier numérique
- Boutons larges (min 48px de hauteur)
- Modal qui monte du bas sur mobile (bottom sheet)

**Validation :** saisir une opération de chaque type en moins de 10 secondes sur mobile.

---

### T4.2 — Page Dashboard
Fichier : `src/app/(app)/dashboard/page.tsx`

- [ ] Sélecteur de période en haut : 1J | 7J | 1M | 1AN | Perso | Tout
- [ ] Afficher les 3 blocs de KPIs (A, B, C) côte à côte sur desktop, empilés sur mobile
- [ ] Bloc Bénéfice bien mis en avant (grande typo, couleur verte/rouge selon positif/négatif)
- [ ] Bloc Stock avec avertissement si négatif
- [ ] Graphe bénéfice par jour (Recharts, barres)
- [ ] Graphe volume CFA (Recharts, ligne)
- [ ] Top 5 clients TYPE_C avec volume
- [ ] Utiliser TanStack Query pour fetch `/api/dashboard?period=...`
- [ ] Loading skeleton pendant le fetch

**Validation :** les chiffres du dashboard correspondent aux opérations saisies en T4.1.

---

### T4.3 — Page Clients
Fichier : `src/app/(app)/clients/page.tsx`

- [ ] Liste avec filtre par type (NAIRA_BUYER en premier)
- [ ] Formulaire de création inline (nom, téléphone optionnel, types)
- [ ] Recherche par nom
- [ ] Fix de la route `/clients/[id]` de la V1

Fichier : `src/app/(app)/clients/[id]/page.tsx`
- [ ] Stats du client : nb opérations par type, volume CFA total, fréquence, dernière opération
- [ ] Historique des opérations du client (20 dernières)
- [ ] Bouton modifier/désactiver

**Validation :** `/clients/[id]` se compile et s'affiche correctement.

---

### T4.4 — Page Historique
Fichier : `src/app/(app)/history/page.tsx`

- [ ] Liste toutes les opérations (soft-deleted exclues)
- [ ] Filtres : type (A/B/C), client, date début, date fin
- [ ] Infinite scroll cursor-based (20 par page)
- [ ] Chaque ligne : type (badge coloré), montants, taux, client si renseigné, date
- [ ] Bouton modifier et supprimer sur chaque ligne

**Validation :** les opérations créées en T4.1 apparaissent ici avec les bons filtres.

---

### T4.5 — Navigation
- [ ] Mettre à jour la navigation bottom bar (mobile) et sidebar (desktop)
- [ ] Ordre : Opérations | Dashboard | Clients | Historique
- [ ] Page par défaut à l'ouverture = Opérations
- [ ] Badge sur "Opérations" indiquant le nb d'opérations du jour

**Validation :** navigation fluide entre les 4 sections sur mobile.

---

## PHASE 5 — Déploiement

### T5.1 — Variables d'environnement
- [ ] Créer `.env.example` avec toutes les variables nécessaires :
  ```
  DATABASE_URL=
  DIRECT_URL=
  SESSION_SECRET=
  NEXT_PUBLIC_APP_URL=
  ```
- [ ] Vérifier que `.env` est dans `.gitignore`

---

### T5.2 — Build de production
- [ ] `npx next build` passe sans erreur
- [ ] Vérifier que toutes les routes dynamiques (ex: `/clients/[id]`) sont compilées
- [ ] `npx prisma migrate deploy` fonctionne sur la DB de production

---

### T5.3 — Déploiement Vercel
- [ ] Créer un projet sur vercel.com
- [ ] Connecter le repo GitHub
- [ ] Ajouter les variables d'environnement dans Vercel Dashboard
- [ ] Déclencher un premier déploiement
- [ ] Vérifier que la DB Supabase accepte les connexions depuis Vercel (whitelist IP ou "Allow all" en dev)

---

### T5.4 — PWA (optionnel mais recommandé pour mobile)
- [ ] Installer `next-pwa`
- [ ] Configurer `next.config.js` avec next-pwa
- [ ] Créer `public/manifest.json` avec icônes
- [ ] Tester "Ajouter à l'écran d'accueil" sur Android et iOS

---

## Ordre de priorité résumé

```
T0 (backup + lecture) → T1 (schéma + formules) → T2 (services) 
→ T3 (API) → T4.1 (formulaires opérations) → T4.2 (dashboard) 
→ T4.3 (clients) → T4.4 (historique) → T4.5 (nav) → T5 (déploiement)
```

**Ne jamais sauter T0. Ne jamais casser le build entre deux tâches.**
