import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { name: credentials.name as string },
        });

        if (!admin || !admin.passwordDigest) return null;

        const isValid = await compare(
          credentials.password as string,
          admin.passwordDigest
        );

        if (!isValid) return null;

        return {
          id: admin.id.toString(),
          name: admin.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
