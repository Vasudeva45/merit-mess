import { getSession } from "@auth0/nextjs-auth0";

export const ProfileServer = ({ user }) => {
  if (!user) {
    return null;
  }

  return (
    <div>
      <img src={user.picture} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default ProfileServer;