import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users } from "lucide-react";
import { MentorshipRequestButton } from "./MentorshipRequestButton";

interface MentorshipRequestProps {
  mentorId: string;
}

const MentorshipRequest: React.FC<MentorshipRequestProps> = ({ mentorId }) => {
  const [userProjects, setUserProjects] = React.useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        const response = await fetch("/api/projects/owned");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        setUserProjects(data);
      } catch (err) {
        setError("Failed to load your projects");
      }
    };

    fetchUserProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/mentorship/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId,
          projectId: selectedProject,
          message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send request");
      setSuccess(true);
      setMessage("");
      setSelectedProject("");
    } catch (err) {
      setError("Failed to send mentorship request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Request Mentorship
        </CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4 bg-green-50">
            <AlertDescription className="text-green-800">
              Mentorship request sent successfully! The mentor will review your
              request.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-4 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to be mentored" />
              </SelectTrigger>
              <SelectContent>
                {userProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message to Mentor</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Briefly describe why you'd like this mentor to guide your project..."
              className="min-h-[100px]"
            />
          </div>

          <MentorshipRequestButton
            mentorId={mentorId}
            projectGroupId={Number(selectedProject)}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default MentorshipRequest;
