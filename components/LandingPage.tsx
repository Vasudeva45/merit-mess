"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Rocket,
  BookOpen,
  CheckCircle,
  Globe,
  Star,
  Award,
  Zap,
  Lock,
  Share2,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublicProjects } from "@/actions/group";

const truncateDescription = (description, maxLength = 100) => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + "...";
};

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const [publicProjects, setPublicProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const projects = await getPublicProjects();
        setPublicProjects(projects);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch projects", error);
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const projectCategories = [
    {
      name: "All Projects",
      projects: publicProjects,
    },
  ];

  const collaborationSteps = [
    {
      icon: Rocket,
      title: "Ideate",
      description:
        "Develop your unique project concept with structured guidance and brainstorming tools.",
    },
    {
      icon: Users,
      title: "Assemble",
      description:
        "Find and connect with talented teammates who complement your skills and vision.",
    },
    {
      icon: BookOpen,
      title: "Learn & Grow",
      description:
        "Access mentorship, skill-building resources, and collaborative frameworks.",
    },
    {
      icon: Target,
      title: "Impact",
      description:
        "Execute your project, track milestones, and create meaningful community change.",
    },
  ];

  const platformFeatures = [
    {
      icon: Users,
      title: "Dynamic Team Formation",
      description:
        "Advanced matching algorithm connects you with ideal teammates based on skills, interests, and project goals.",
      details: [
        "Skill-based matching",
        "Interest alignment",
        "Collaborative profile building",
      ],
    },
    {
      icon: Award,
      title: "Mentorship Ecosystem",
      description:
        "Connect with experienced professionals who provide personalized guidance and industry insights.",
      details: [
        "Professional mentor network",
        "Structured mentorship programs",
        "Skill development tracking",
      ],
    },
    {
      icon: Zap,
      title: "Project Management",
      description:
        "Integrated tools to streamline collaboration, track progress, and manage project lifecycles.",
      details: [
        "Task assignment",
        "Progress tracking",
        "Communication channels",
      ],
    },
    {
      icon: Share2,
      title: "Knowledge Sharing",
      description:
        "Build a collaborative learning environment with resources, workshops, and peer-to-peer support.",
      details: [
        "Resource libraries",
        "Workshop scheduling",
        "Community forums",
      ],
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Navigation */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">MeritMess</div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <a href="/api/auth/login">Sign In</a>
            </Button>
            <Button asChild>
              <a href="/api/auth/signup">Sign Up</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center pt-36">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Globe className="w-10 h-10 animate-pulse" />
            <span className="text-sm uppercase tracking-wide">
              Collaborative Innovation Platform
            </span>
          </div>
          <h1 className="text-5xl font-bold leading-tight">
            Transform Ideas into Collective Impact
          </h1>
          <p className="text-xl opacity-70">
            MeritMess empowers young innovators to collaborate, learn, and
            create projects that solve real-world challenges through
            community-driven innovation.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <a href="/api/auth/signup">Start Your Project</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#projects">Explore Opportunities</a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {collaborationSteps.map((step, index) => (
            <Card
              key={index}
              className="border-dashed hover:border-solid transition-all hover:shadow-lg"
            >
              <CardHeader className="pb-2">
                <step.icon className="w-10 h-10 opacity-70" />
              </CardHeader>
              <CardContent>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-sm opacity-60">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Project Discovery */}
      <div id="projects" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Explore Community Projects
          </h2>
          <p className="max-w-2xl mx-auto opacity-70">
            Discover real projects created by innovative teams across various
            domains.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-8">
            <TabsTrigger value="projects">All Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="grid md:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center">
                <p>Loading projects...</p>
              </div>
            ) : publicProjects.length === 0 ? (
              <div className="col-span-full text-center">
                <p>No public projects available at the moment.</p>
              </div>
            ) : (
              publicProjects.map((project, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <h3 className="text-2xl font-bold">{project.title}</h3>
                    <p className="opacity-70">
                      {truncateDescription(project.description)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Project Domain:</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 rounded-full text-xs border opacity-80"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{project.teamSize}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">{project.impact}</span>
                    </div>
                    <Button asChild className="w-full">
                      <a href="/api/auth/login">View Project Details</a>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Platform Features */}
      <div className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Your Collaborative Ecosystem
          </h2>
          <p className="max-w-2xl mx-auto opacity-70">
            Comprehensive tools and features designed to support your project
            journey from concept to completion.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="mb-4">
                  <feature.icon className="w-10 h-10 opacity-70" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="opacity-70 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 opacity-50" />
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6 bg-secondary/10 p-12 rounded-xl">
          <h2 className="text-4xl font-bold">Your Impact Journey Begins Now</h2>
          <p className="text-xl opacity-70">
            Whether you're a student, aspiring professional, or passionate
            innovator, MeritMess provides the ultimate platform to transform
            your ideas into impactful projects.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/api/auth/signup">Create Your Project</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#projects">Explore Community</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
