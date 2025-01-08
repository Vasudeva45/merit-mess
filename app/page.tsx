// app/page.tsx
import { getSession } from "@auth0/nextjs-auth0";
import HomePage from "@/components/HomePage";
import { getPublicFormsWithOwners } from "@/actions/form";

export default async function Page() {
  try {
    const session = await getSession();
    const forms = await getPublicFormsWithOwners();

    return <HomePage user={session?.user} initialForms={forms} />;
  } catch (error) {
    console.error("Error in page:", error);
    // Return a basic error state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Something went wrong. Please try again later.</p>
      </div>
    );
  }
}
