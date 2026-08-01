import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "gg_admin_session";

function resolveAdminSecret() {
  const configured = process.env.ADMIN_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim() || "";
  if (configured) return configured;

  if (process.env.NODE_ENV !== "production") {
    return "G0ld3nb33";
  }

  return "";
}

export function getAdminPassword() {
  return resolveAdminSecret();
}

export async function isAdminAuthenticated() {
  const expectedSecret = getAdminPassword();
  if (!expectedSecret) {
    console.error("ADMIN_SECRET is missing in production environment.");
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === expectedSecret;
}
