import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

// A pre-hashed dummy value (bcrypt cost 12, same as real registrations —
// see src/app/api/auth/register/route.ts) with no matching plaintext. Used
// so authorize() always pays the same bcrypt.compare cost whether or not
// the email exists, instead of short-circuiting on a missing user/hash —
// that timing difference is a small email-enumeration side channel.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8G9v3wbb0m7GaYAqoJmc8pI/j3Xzuu";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validations/auth";

// Email + password now (Credentials provider). The schema already carries a
// `phone` field on User for when phone/OTP auth lands later — this provider
// doesn't use it yet. Sessions are JWT-based: the Credentials provider
// doesn't populate an Account row the way OAuth does, so database sessions
// don't apply here — the adapter is still used to persist Users/Accounts,
// ready for OAuth providers to be added later without a data migration.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        // Always run bcrypt.compare, even against a dummy hash for a
        // nonexistent user/OAuth-only account, so this doesn't return
        // measurably faster for emails that aren't registered.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user?.passwordHash || !valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
