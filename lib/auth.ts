import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Django APIでユーザー認証
          const response = await fetch(`${process.env.DJANGO_API_URL || 'https://world-fastest-punch-backend.onrender.com'}/api/auth/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (response.ok) {
            const user = await response.json();
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.username || user.email,
            };
          }
        } catch (error) {
          console.error('Authentication error:', error);
        }

        return null;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = 'USER'; // 一時的に固定値
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Google認証成功時にDjango APIにユーザー情報を送信
      if (account?.provider === 'google') {
        try {
          const response = await fetch(`${process.env.DJANGO_API_URL || 'https://world-fastest-punch-backend.onrender.com'}/api/auth/sync-user/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              google_id: account.providerAccountId,
              email: user.email,
              name: user.name,
              picture: user.image,
            }),
          });
          
          if (!response.ok) {
            console.error('Django sync failed:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Failed to sync user with Django:', error);
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 管理者ダッシュボードへの直接アクセスの場合のみ管理者サインインページにリダイレクト
      if (url === `${baseUrl}/admin` || url === '/admin') {
        return `${baseUrl}/admin/signin`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
}
