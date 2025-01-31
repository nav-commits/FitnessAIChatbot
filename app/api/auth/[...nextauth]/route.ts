import NextAuth, { NextAuthOptions } from "next-auth";
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

// Function to refresh Google OAuth token
async function refreshAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000, // Convert to ms
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Keep old one if not returned
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      // When user first signs in
      if (account) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_in as number) * 1000, // Expires in 1 hour
          refreshToken: account.refresh_token, // Needed to get a new access token
          user: token.user,
        };
      }

      // Refresh access token if expired
      if (Date.now() > (token.accessTokenExpires as number)) {
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub ?? "";
        session.user.token = token.accessToken as string;
        if (token.error) {
          session.user.error = token.error as string; // Handle token refresh errors in UI
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
