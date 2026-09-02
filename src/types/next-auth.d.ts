import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      login?: string
      isOwner?: boolean
    } & DefaultSession['user']
  }

  interface Profile {
    login?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    login?: string
  }
}

export {}
