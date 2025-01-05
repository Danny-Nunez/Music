import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { DbUser } from "../types/user";

export const authOptions: NextAuthOptions = {
  debug: true,
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('Attempting to authorize with credentials:', { email: credentials?.email });

          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            throw new Error('Please provide both email and password');
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          }) as DbUser | null;

          console.log('Found user:', user ? 'Yes' : 'No');

          if (!user || !user.password) {
            console.log('User not found or no password');
            throw new Error('Invalid email or password');
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('Password check result:', isCorrectPassword);

          if (!isCorrectPassword) {
            console.log('Incorrect password');
            throw new Error('Invalid email or password');
          }

          console.log('Authorization successful');
          return {
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            image: user.image || "",
            emailVerified: user.emailVerified
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};