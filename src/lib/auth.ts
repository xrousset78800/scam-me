import type { NextAuthOptions } from "next-auth";
import { prisma } from "./db";

// Steam uses OpenID 2.0 — we implement it as a custom provider
const STEAM_OPENID_URL = "https://steamcommunity.com/openid";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "steam",
      name: "Steam",
      type: "oauth",
      // Steam OpenID config (simplified — use next-auth-steam in production)
      authorization: {
        url: `${STEAM_OPENID_URL}/login`,
        params: {
          "openid.ns": "http://specs.openid.net/auth/2.0",
          "openid.mode": "checkid_setup",
          "openid.return_to": `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
          "openid.realm": process.env.NEXTAUTH_URL,
          "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
          "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        },
      },
      token: { url: `${STEAM_OPENID_URL}/login` },
      userinfo: {
        async request({ tokens }) {
          // Extract Steam ID from the openid.claimed_id URL
          const claimedId = tokens.id_token as string;
          const steamId = claimedId?.split("/").pop() ?? "";

          const res = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
          );
          const data = await res.json();
          const player = data.response.players[0];
          return { ...player, steamId };
        },
      },
      clientId: "not-used",
      clientSecret: "not-used",
      profile(profile) {
        return {
          id: profile.steamid,
          steamId: profile.steamid,
          name: profile.personaname,
          image: profile.avatarfull,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user }) {
      await prisma.user.upsert({
        where: { steamId: user.id },
        update: {
          displayName: user.name ?? "",
          avatarUrl: user.image ?? "",
        },
        create: {
          steamId: user.id,
          displayName: user.name ?? "",
          avatarUrl: user.image ?? "",
        },
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        (session.user as { steamId?: string }).steamId = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
