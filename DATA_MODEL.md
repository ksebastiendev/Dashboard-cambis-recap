# DATA_MODEL.md — Modèle de données V2

> Ce fichier décrit exactement les modèles Prisma à créer/modifier.
> Ne pas modifier le modèle User ni la logique d'auth iron-session existante.

---

## Modèles à créer ou remplacer

### 1. Remplacer le modèle `Transaction` existant par `Operation`

Le modèle `Transaction` de la V1 mélange BUY_NAIRA / SELL_NAIRA avec des champs CFA/Naira.
En V2, on le remplace par un modèle `Operation` qui couvre les 3 types proprement.

> ⚠️ MIGRATION : avant de supprimer l'ancien modèle, exporter les données existantes si nécessaire.

```prisma
model Operation {
  id            String        @id @default(cuid())
  type          OperationType // TYPE_A | TYPE_B | TYPE_C

  // TYPE_A et TYPE_B : champs dollars
  amountUsd     Decimal?      @db.Decimal(18, 4)
  rateCfaPerUsd Decimal?      @db.Decimal(18, 4)  // utilisé si TYPE_A
  rateNgnPerUsd Decimal?      @db.Decimal(18, 4)  // utilisé si TYPE_B

  // TYPE_C : champs Naira
  amountNgn     Decimal?      @db.Decimal(18, 2)
  rateCfaPerNgn Decimal?      @db.Decimal(18, 6)

  // Valeurs calculées et stockées (pour éviter de recalculer)
  totalCfaSpent    Decimal?   @db.Decimal(18, 2)  // TYPE_A : amountUsd × rateCfaPerUsd
  totalNgnReceived Decimal?   @db.Decimal(18, 2)  // TYPE_B : amountUsd × rateNgnPerUsd
  totalCfaReceived Decimal?   @db.Decimal(18, 2)  // TYPE_C : amountNgn × rateCfaPerNgn

  note          String?
  operationDate DateTime      @default(now())
  isDeleted     Boolean       @default(false)     // soft delete
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  clientId      String?
  client        Client?       @relation(fields: [clientId], references: [id])

  userId        String
  user          User          @relation(fields: [userId], references: [id])

  audits        OperationAudit[]

  @@index([operationDate])
  @@index([type])
  @@index([clientId])
  @@index([userId])
  @@index([isDeleted])
}
```

---

### 2. Enum OperationType

```prisma
enum OperationType {
  TYPE_A  // Achat de dollars : CFA → $
  TYPE_B  // Vente de dollars : $ → Naira
  TYPE_C  // Vente de Naira  : Naira → CFA  ← opération principale
}
```

---

### 3. Modèle Client (mise à jour)

```prisma
model Client {
  id         String       @id @default(cuid())
  fullName   String
  phone      String?
  note       String?
  isActive   Boolean      @default(true)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  // Types de rôles (tableau pour qu'un client puisse avoir plusieurs rôles)
  types      ClientType[]

  operations Operation[]
}

// Table de liaison pour les types de clients
model ClientType {
  id       String     @id @default(cuid())
  type     ClientRole
  clientId String
  client   Client     @relation(fields: [clientId], references: [id])

  @@unique([clientId, type])
}

enum ClientRole {
  DOLLAR_SELLER  // Vendeur de dollars (TYPE_A)
  DOLLAR_BUYER   // Acheteur de dollars → Naira (TYPE_B)
  NAIRA_BUYER    // Acheteur de Naira → CFA (TYPE_C) ← PRIORITAIRE
}
```

---

### 4. Modèle OperationAudit (remplace TransactionAudit)

```prisma
model OperationAudit {
  id          String    @id @default(cuid())
  action      AuditAction
  snapshot    Json      // état complet avant la mutation
  performedAt DateTime  @default(now())

  operationId String
  operation   Operation @relation(fields: [operationId], references: [id])

  userId      String
  user        User      @relation(fields: [userId], references: [id])
}

enum AuditAction {
  UPDATE
  DELETE
}
```

---

### 5. Modèle User (inchangé)

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  password   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  operations      Operation[]
  operationAudits OperationAudit[]
}
```

---

## Index de performance importants

Les requêtes dashboard les plus fréquentes sont :
- Toutes les opérations d'un type sur une période → index sur `(type, operationDate, isDeleted)`
- Toutes les opérations d'un client → index sur `clientId`

Ajouter ces index composites :
```prisma
@@index([type, operationDate, isDeleted])
```

---

## Règles de validation (à appliquer côté Zod ET côté Prisma)

| Type | Champs obligatoires | Champs interdits |
|---|---|---|
| TYPE_A | `amountUsd`, `rateCfaPerUsd` | `amountNgn`, `rateCfaPerNgn`, `rateNgnPerUsd` |
| TYPE_B | `amountUsd`, `rateNgnPerUsd` | `amountNgn`, `rateCfaPerNgn`, `rateCfaPerUsd` |
| TYPE_C | `amountNgn`, `rateCfaPerNgn` | `amountUsd`, `rateCfaPerUsd`, `rateNgnPerUsd` |

Les valeurs calculées (`totalCfaSpent`, `totalNgnReceived`, `totalCfaReceived`) sont toujours calculées côté serveur, jamais acceptées du client.

---

## Migration depuis la V1

Si des données V1 existent dans `Transaction` :
1. Créer les nouvelles tables sans supprimer les anciennes
2. Script de migration : lire chaque `Transaction` V1 et créer une `Operation` V2 correspondante
3. `BUY_NAIRA` → `TYPE_C` (le cambiste reçoit du CFA, donne du Naira)
4. `SELL_NAIRA` → à analyser selon le contexte
5. Garder la table `Transaction` en read-only le temps de valider
