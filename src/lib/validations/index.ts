import { z } from "zod";

// ─────────────────────────────────────────
// Validation Client
// ─────────────────────────────────────────

export const createClientSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  nickname: z.string().max(50).trim().optional().or(z.literal("")),
  phone: z
    .string()
    .max(20)
    .trim()
    .optional()
    .or(z.literal(""))
    // Accepte formats internationaux basiques
    .refine((val) => !val || /^[+\d\s\-().]{6,20}$/.test(val), {
      message: "Format de téléphone invalide",
    }),
  note: z.string().max(500).trim().optional().or(z.literal("")),
});

export const updateClientSchema = createClientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ─────────────────────────────────────────
// Validation Transaction
// ─────────────────────────────────────────

export const createTransactionSchema = z.object({
  clientId: z.string().min(1, "Veuillez sélectionner un client"),
  operationType: z.enum(["BUY_NAIRA", "SELL_NAIRA"]),
  amountCfa: z.coerce
    .number()
    .positive("Le montant CFA doit être supérieur à 0"),
  amountNaira: z.coerce
    .number()
    .positive("Le montant Naira doit être supérieur à 0"),
  exchangeRate: z.coerce
    .number()
    .positive("Le taux doit être supérieur à 0"),
  note: z.string().max(500).trim().optional().or(z.literal("")),
});

export const updateTransactionSchema = z.object({
  operationType: z.enum(["BUY_NAIRA", "SELL_NAIRA"]),
  amountCfa: z.coerce
    .number()
    .positive("Le montant CFA doit être supérieur à 0"),
  amountNaira: z.coerce
    .number()
    .positive("Le montant Naira doit être supérieur à 0"),
  exchangeRate: z.coerce
    .number()
    .positive("Le taux doit être supérieur à 0"),
  note: z.string().max(500).trim().optional().or(z.literal("")),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// ─────────────────────────────────────────
// Validation Auth
// ─────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email invalide").trim().toLowerCase(),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;
