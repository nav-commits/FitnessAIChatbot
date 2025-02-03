import NextAuth, { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials in environment variables.");
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET in environment variables.");
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      token?: string;
      error?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile", // Ensure Google ID is included
          access_type: "offline",  // Ensure refresh token is provided
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_in as number) * 1000,
          refreshToken: account.refresh_token,
          user: {
            id: profile.sub, // ✅ Ensure Google ID is stored
            name: profile.name,
            email: profile.email,
            image: profile.image,
          },
        };
      }

      // No refresh token logic, simply return the token
      return token;
    },

    async session({ session, token }: { session: Session; token: any }) {
      if (session?.user) {
        session.user.id = token.user?.id ?? ""; // ✅ Ensure ID is passed
        session.user.name = token.user?.name ?? "";
        session.user.email = token.user?.email ?? "";
        session.user.image = token.user?.image ?? "";
        session.user.token = token.accessToken as string;
        if (token.error) {
          session.user.error = token.error as string; // Handle token errors in UI
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
