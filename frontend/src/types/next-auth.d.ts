// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";
declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    mobile?: string;
    imageUrl?: string;
    token?: string;
    role?: string;
    permissions?: string[];
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    token: string;
    expires: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    token: string;
    role?: string;
    permissions?: string[];
  }
}
