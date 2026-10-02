import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * JWT-only sessions: no adapter, no Users/Accounts tables. Google verifies who
 * the person is; we just carry their id/email in a signed cookie. Products and
 * orders (the actual data) still persist to Postgres via lib/db.ts — this only
 * keeps sign-in itself lightweight, with no separate auth database to manage.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) token.sub = (profile as { sub?: string }).sub ?? token.sub;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.sub;
      return session;
    },
  },
};
