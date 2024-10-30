import HomeClient from "@/components/HomeClient";
import { getSession } from "@auth0/nextjs-auth0";

export default async function Home() {
  try {
    const session = await getSession();
    const user = session?.user;

    return <HomeClient user={user} />;
  } catch (error) {
    console.error("Error getting session:", error);
    return <HomeClient user={undefined} />;
  }
}
