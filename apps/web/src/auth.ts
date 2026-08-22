import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Sign in with Google, requesting read-only Calendar access so CalendarAgent
// (packages/agent/src/tools.ts) can call the real Google Calendar API
// instead of its simulated fallback. Deliberately read-only — no scope for
// writing events — see that file's comment for why.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  // Cloud Run sits behind a proxy that rewrites the Host header — Auth.js
  // only trusts that automatically on Vercel. Required for any non-Vercel
  // deploy (also set via AUTH_TRUST_HOST=true as a belt-and-suspenders env
  // var, since which one actually takes effect can be version-sensitive).
  trustHost: true,
  callbacks: {
    async jwt({ token, account }) {
      // Only present on the initial sign-in redirect, not subsequent calls —
      // stash it in the JWT so it survives to every future request's session.
      if (account?.access_token) {
        token.calendarAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.calendarAccessToken = token.calendarAccessToken;
      return session;
    },
  },
});
