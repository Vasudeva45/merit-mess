import HomePage from "@/components/HomePage";
import { getSession } from "@auth0/nextjs-auth0";

export default async function Home() {
  try {
    const session = await getSession();
    const user = session?.user;

    return <HomePage user={user} />;
  } catch (error) {
    console.error("Error getting session:", error);
    return <HomePage user={undefined} />;
  }
}
