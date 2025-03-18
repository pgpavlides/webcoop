import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// For demo purposes - in production, you'd use proper credential validation
const fakeUsers = [
  { id: "1", name: "Demo User", email: "user@example.com", password: "password" }
];

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // This is a simple demo - replace with actual auth logic
        const user = fakeUsers.find(
          (user) => 
            user.email === credentials.email && 
            user.password === credentials.password
        );
        
        if (user) {
          return { 
            id: user.id, 
            name: user.name, 
            email: user.email 
          };
        }
        
        return null;
      }
    }),
    // Uncomment and add your keys to enable these providers
    /*
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    */
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
