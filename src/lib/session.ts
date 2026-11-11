import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getOwnedBusiness } from "@/server/services/business-claim-service";

/** Call at the top of a protected server page. Redirects to /login (with a
 * `next` param back to the current path) when no session exists. */
export async function requireUser(currentPath?: string) {
  const session = await auth();
  if (session?.user) return session.user;

  const locale = await getLocale();
  redirect({
    href: currentPath ? `/login?next=${encodeURIComponent(currentPath)}` : "/login",
    locale,
  });
  // redirect() always throws — this is unreachable, but satisfies TS control-flow
  // analysis so callers get a non-nullable user back, not `| undefined`.
  throw new Error("unreachable");
}

/** Call at the top of a protected business-portal page. Resolves the caller's
 * owned business fresh from the database every time — never from a cached
 * role on the session — so approval/ownership changes take effect
 * immediately without requiring a re-login. Redirects to /business/join if
 * the signed-in user doesn't manage an active business. */
export async function requireBusinessOwner(currentPath?: string) {
  const user = await requireUser(currentPath);
  const business = await getOwnedBusiness(user.id);
  if (business) return { user, business };

  const locale = await getLocale();
  redirect({ href: "/business/join", locale });
  throw new Error("unreachable");
}

/** Call at the top of a protected admin page. Role is re-checked fresh from
 * the database every time (never trusted from the session) so a
 * promotion/demotion takes effect immediately. Renders a 404 rather than a
 * 403 for non-admins, so the existence of admin routes isn't confirmed to
 * users who shouldn't know they're there. */
export async function requireAdmin(currentPath?: string) {
  const user = await requireUser(currentPath);
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== "ADMIN") notFound();
  return user;
}
