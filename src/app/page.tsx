import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Page racine — redirige vers dashboard si connecté, sinon login
export default async function HomePage() {
  const session = await getSession();

  if (session.isLoggedIn) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
