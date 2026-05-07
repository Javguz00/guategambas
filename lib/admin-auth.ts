import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "gg_admin_session";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "G0ld3nb33";
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === getAdminPassword();
}
