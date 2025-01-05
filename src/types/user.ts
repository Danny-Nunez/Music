import { User as NextAuthUser } from "next-auth";

export interface User extends NextAuthUser {
  id: string;
}

export interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
}