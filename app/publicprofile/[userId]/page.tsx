import { getPublicProfile } from "@/actions/profile";
import ProfileClient from "../components/ProfileClient";

export default async function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  try {
    const decodedUserId = decodeURIComponent(params.userId);
    const profile = await getPublicProfile(decodedUserId);

    return (
      <div className="container mx-auto px-4 py-8">
        <ProfileClient profile={profile} />
      </div>
    );
  } catch (error) {
    console.error("Error in PublicProfilePage:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <ProfileClient profile={null} />
      </div>
    );
  }
}
