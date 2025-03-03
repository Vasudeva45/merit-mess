import { handleAuth, handleLogin } from "@auth0/nextjs-auth0";

export const GET = async (req, { params }) => {
  // Ensure params is awaited
  const authParam = await params.auth0;

  return handleAuth({
    login: handleLogin({
      returnTo: "/",
    }),
    signup: handleLogin({
      authorizationParams: {
        screen_hint: "signup",
      },
      returnTo: "/",
    }),
  })(req, { params });
};
