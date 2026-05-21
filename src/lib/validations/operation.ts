import { z } from "zod";

const positiveDecimal = z.coerce
  .number()
  .positive("Le montant doit être supérieur à 0");

const optionalClientId = z
  .string()
  .min(1)
  .nullable()
  .optional();

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .optional();

const optionalNote = z
  .string()
  .max(500)
  .trim()
  .optional()
  .or(z.literal(""));

// ─────────────────────────────────────────
// TYPE_A — Achat de dollars (CFA → $)
// Champs obligatoires : amountUsd, rateCfaPerUsd
// ─────────────────────────────────────────
const typeASchema = z.object({
  type: z.literal("TYPE_A"),
  amountUsd: positiveDecimal,
  rateCfaPerUsd: positiveDecimal,
  clientId: optionalClientId,
  operationDate: optionalDate,
  note: optionalNote,
});

// ─────────────────────────────────────────
// TYPE_B — Vente de dollars contre Naira ($ → ₦)
// Champs obligatoires : amountUsd, rateNgnPerUsd
// ─────────────────────────────────────────
const typeBSchema = z.object({
  type: z.literal("TYPE_B"),
  amountUsd: positiveDecimal,
  rateNgnPerUsd: positiveDecimal,
  clientId: optionalClientId,
  operationDate: optionalDate,
  note: optionalNote,
});

// ─────────────────────────────────────────
// TYPE_C — Vente de Naira contre CFA (₦ → CFA)
// Champs obligatoires : amountNgn, rateCfaPerNgn
// ─────────────────────────────────────────
const typeCSchema = z.object({
  type: z.literal("TYPE_C"),
  amountNgn: positiveDecimal,
  rateCfaPerNgn: positiveDecimal,
  clientId: optionalClientId,
  operationDate: optionalDate,
  note: optionalNote,
});

// Union discriminée sur le champ `type`
// Garantit que chaque variante n'accepte que ses propres champs
export const createOperationSchema = z.discriminatedUnion("type", [
  typeASchema,
  typeBSchema,
  typeCSchema,
]);

// Schéma de mise à jour — le type ne peut pas changer après création
// Seuls les montants, taux, date et note sont modifiables
export const updateOperationTypeASchema = z.object({
  amountUsd: positiveDecimal,
  rateCfaPerUsd: positiveDecimal,
  clientId: optionalClientId,
  operationDate: optionalDate,
  note: optionalNote,
});

export const updateOperationTypeBSchema = z.object({
  amountUsd: positiveDecimal,
  rateNgnPerUsd: positiveDecimal,
  clientId: optionalClientId,
  operationDate: optionalDate,
  note: optionalNote,
});

export const updateOperationTypeCSchema = z.object({
  amountNgn: positiveDecimal,
  rateCfaPerNgn: positiveDecimal,
  clientId: optionalClientId,
  operationDate: optionalDate,
  note: optionalNote,
});

// ─────────────────────────────────────────
// Types inférés
// ─────────────────────────────────────────
export type CreateOperationInput = z.infer<typeof createOperationSchema>;
export type CreateOperationTypeA = z.infer<typeof typeASchema>;
export type CreateOperationTypeB = z.infer<typeof typeBSchema>;
export type CreateOperationTypeC = z.infer<typeof typeCSchema>;

export type UpdateOperationTypeA = z.infer<typeof updateOperationTypeASchema>;
export type UpdateOperationTypeB = z.infer<typeof updateOperationTypeBSchema>;
export type UpdateOperationTypeC = z.infer<typeof updateOperationTypeCSchema>;
