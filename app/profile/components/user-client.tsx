import { useUser } from "@auth0/nextjs-auth0/client";

const ProfileClient = ({ user }) => {
  if (!user) {
    return <div>No user logged in</div>;
  }

  return (
    <div>
      <img src={user.picture} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default ProfileClient;