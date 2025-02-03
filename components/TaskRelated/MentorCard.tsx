import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

interface Mentor {
  imageUrl?: string;
  name: string;
  title?: string;
  userId: string;
}

interface MentorCardProps {
  mentor: Mentor;
  isMentor: boolean;
  projectHasMentor?: boolean;
}

export default function MentorCard({
  mentor,
  isMentor,
  projectHasMentor = false,
}: MentorCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Project Mentor
        </h2>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {mentor.imageUrl ? (
              <img
                src={mentor.imageUrl}
                alt={mentor.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
            )}
            <div className="flex-grow">
              <h3 className="font-medium">{mentor.name}</h3>
              {mentor.title && (
                <p className="text-sm text-muted-foreground">{mentor.title}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link
              href={`/mentor/${mentor.userId}?isProjectMentor=true`}
              target="_blank"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" className="w-full sm:w-auto">
                View Profile
              </Button>
            </Link>
            <Button
              variant="default"
              disabled={projectHasMentor}
              asChild
              className="w-full sm:w-auto"
            >
              <Link
                href={`/mentor/${mentor.userId}?isProjectMentor=true`}
                target="_blank"
              >
                {projectHasMentor ? "Project Has Mentor" : "Request Mentorship"}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
