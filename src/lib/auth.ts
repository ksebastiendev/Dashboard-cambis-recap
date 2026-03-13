import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

/**
 * Récupère la session courante côté server (Server Components, Route Handlers).
 * Retourne null si l'utilisateur n'est pas connecté.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

/**
 * Vérifie que la session est valide et retourne les données utilisateur.
 * Lance une erreur si non authentifié — à utiliser dans les routes protégées.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
