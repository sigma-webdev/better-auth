import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: "http://localhost:3000/api/auth",
});

export const handleSignIn = async () => {
  const session = authClient.useSession();
  await authClient.signIn.social({ provider: "google" });
  return session;
};

export default authClient;
