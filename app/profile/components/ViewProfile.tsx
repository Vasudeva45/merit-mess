import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Github,
  Linkedin,
  Mail,
  MapPin,
  Building,
  Edit3,
  ExternalLink,
  Clock,
  Star,
} from "lucide-react";
import { Profile } from "./types";

interface ViewProfileProps {
  profile: Profile;
  onEdit: () => void;
}

export const ViewProfile: React.FC<ViewProfileProps> = ({
  profile,
  onEdit,
}) => {
  return (
    <div className="grid md:grid-cols-12 gap-6">
      {/* Sidebar */}
      <motion.div
        className="md:col-span-4"
        initial={{ x: -20 }}
        animate={{ x: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>{profile.email}</span>
              </div>
              {profile.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.organization && (
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-primary" />
                  <span>{profile.organization}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span>{profile.github}</span>
                  <ExternalLink className="h-4 w-4 ml-auto opacity-50" />
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={`https://linkedin.com/in/${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span>{profile.linkedin}</span>
                  <ExternalLink className="h-4 w-4 ml-auto opacity-50" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="md:col-span-8 space-y-6"
        initial={{ x: 20 }}
        animate={{ x: 0 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>About</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onEdit}
            >
              <Edit3 className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed">
              {profile.bio || "No bio added yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <motion.div
                  key={skill}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  <Badge variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {profile.ongoing_projects.map((project, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-semibold text-lg mb-2">
                            {project.name}
                          </h4>
                          <p className="text-muted-foreground">
                            {project.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {project.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {profile.type === "mentor" && (
          <Card>
            <CardHeader>
              <CardTitle>Mentor Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.yearsOfExperience !== null &&
                profile.yearsOfExperience !== undefined && (
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-primary" />
                    <span>
                      {profile.yearsOfExperience} Years of Professional
                      Experience
                    </span>
                  </div>
                )}

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span>
                  Available for Mentorship:{" "}
                  {profile.availableForMentorship ? "Yes" : "No"}
                </span>
              </div>

              {profile.mentorExpertise &&
                profile.mentorExpertise.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-2 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-primary" />
                      Areas of Expertise
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.mentorExpertise.map((exp) => (
                        <Badge
                          key={exp}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {profile.certifications && profile.certifications.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-2 flex items-center">
                    Professional Certifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.certifications.map((cert) => (
                      <Badge
                        key={cert}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};
