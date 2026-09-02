import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

/**
 * Studio access = GitHub OAuth + an explicit allowlist.
 *
 * Only the GitHub logins in STUDIO_GITHUB_LOGINS may sign in at all; the
 * `signIn` callback rejects everyone else before a session is ever issued, so
 * there is no "logged in but unauthorised" state to defend against later.
 */
const ALLOWED_LOGINS = (process.env.STUDIO_GITHUB_LOGINS ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

export function isAllowedLogin(login: string | null | undefined): boolean {
  if (!login) return false
  // An empty allowlist locks the studio rather than opening it to everyone.
  if (ALLOWED_LOGINS.length === 0) return false
  return ALLOWED_LOGINS.includes(login.toLowerCase())
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/studio/login',
    error: '/studio/login',
  },
  callbacks: {
    signIn({ profile }) {
      return isAllowedLogin(profile?.login as string | undefined)
    },
    jwt({ token, profile }) {
      if (profile?.login) token.login = String(profile.login)
      return token
    },
    session({ session, token }) {
      if (session.user) {
        const login = typeof token.login === 'string' ? token.login : undefined
        session.user.login = login
        session.user.isOwner = isAllowedLogin(login)
      }
      return session
    },
  },
})

/** Server-side guard: resolves the session only when it belongs to the owner. */
export async function getOwnerSession() {
  const session = await auth()
  return session?.user?.isOwner ? session : null
}
