import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Users,
  Rocket,
  GraduationCap,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = async () => {
  const featuredProjects = [
    {
      id: 1,
      title: "Local Beach Cleanup Drive",
      category: "Environmental",
      teamSize: "4-6 members",
      description: "Organizing monthly beach cleanups with local youth groups. Looking for passionate environmentalists!",
      mentorAvailable: true
    },
    {
      id: 2,
      title: "Coding Workshop Series",
      category: "Education",
      teamSize: "3-4 members",
      description: "Teaching basic programming to middle school students. Need curriculum designers and instructors.",
      mentorAvailable: true
    },
    {
      id: 3,
      title: "Community Art Festival",
      category: "Arts & Culture",
      teamSize: "5-8 members",
      description: "Planning a weekend art festival showcasing young local artists. Seeking event organizers and coordinators.",
      mentorAvailable: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <Rocket className="h-20 w-20 text-primary animate-bounce" />
            </div>
            <h1 className="text-6xl font-bold tracking-tight">
              Turn Your Ideas Into Impact
            </h1>
            <p className="text-xl text-muted-foreground">
              Join MeritMess - where young changemakers connect, collaborate, and create meaningful projects. 
              Find your team, get mentored, and make a difference.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <a href="/api/auth/login">Start Your Project</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#explore">Explore Projects</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Your Journey to Success
          </h2>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Build Your Dream Team</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Post your project idea and connect with passionate team members who share your vision. Find the perfect mix of skills and enthusiasm.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Learn from Mentors</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get guidance from experienced project leaders who've been there before. Access resources, tips, and personalized advice.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Level Up Together</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Earn badges, unlock achievements, and track your progress as you complete project milestones. Celebrate success as a team!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Featured Projects */}
      <div id="explore" className="bg-secondary/10 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6">Featured Projects</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Discover exciting projects looking for team members. Join an existing initiative or get inspired to start your own!
          </p>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {featuredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <p className="text-sm text-primary">{project.category}</p>
                    </div>
                    {project.mentorAvailable && (
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                        Mentor Available
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{project.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{project.teamSize}</span>
                    <Button variant="outline" asChild>
                      <a href="/api/auth/login">Join Project</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Make an Impact?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join a community of young innovators and changemakers. Start your project journey today - it's free and fun!
          </p>
          <Button size="lg" asChild>
            <a href="/api/auth/login">Launch Your Project</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;