import { Users, Lightbulb, Rocket } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

export const FeaturesSection = () => {
  const features = [
    {
      title: "Connect",
      description: "Join a community of like-minded individuals passionate about making a difference",
      icon: Users,
    },
    {
      title: "Ideate",
      description: "Transform your ideas into actionable plans with our collaborative tools",
      icon: Lightbulb,
    },
    {
      title: "Launch",
      description: "Bring your projects to life with support from mentors and resources",
      icon: Rocket,
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={0.2 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};