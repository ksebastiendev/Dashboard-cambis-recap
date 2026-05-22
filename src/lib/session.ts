import { SessionOptions } from "iron-session";

// Structure de la session utilisateur
export interface SessionData {
  userId: string;
  email: string;
  name?: string;
  isLoggedIn: boolean;
}

// Configuration iron-session
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "chapkey_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  },
};
