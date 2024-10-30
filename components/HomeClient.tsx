"use client";

import LandingPage from "../components/Screens/LandingPage";

interface HomeClientProps {
  user?: any;
}

const HomeClient: React.FC<HomeClientProps> = ({ user }) => {
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="flex justify-center items-center">
      <div>
        <h1>Welcome, {user.name}!</h1>
      </div>
    </div>
  );
};

export default HomeClient;