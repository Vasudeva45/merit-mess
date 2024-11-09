// ProfileClient.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FaGithub,
  FaLinkedin,
  FaMapMarkerAlt,
  FaEnvelope,
  FaBriefcase,
  FaTrophy,
  FaCode,
  FaUserCircle,
  FaProjectDiagram,
} from "react-icons/fa";

const ProfileSection = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="space-y-4"
  >
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const SocialLink = ({ href, icon, label }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {icon}
          <span className="hidden md:inline">{label}</span>
        </motion.a>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ProfileClient = ({ profile }) => {
  const [activeProject, setActiveProject] = useState(null);

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              The requested profile could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="">
        <CardHeader className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Avatar className="w-32 h-32 border-4 border-primary/10">
                <AvatarImage src={profile.imageUrl || ""} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <CardTitle className="text-4xl font-bold">
                {profile.name}
              </CardTitle>
              <CardDescription className="text-xl font-medium">
                {profile.title || profile.type}
              </CardDescription>

              <div className="flex flex-col gap-2 mt-4">
                {profile.organization && (
                  <motion.div
                    className="flex items-center gap-2 justify-center md:justify-start"
                    whileHover={{ x: 5 }}
                  >
                    <FaBriefcase className="w-4 h-4" />
                    <span>{profile.organization}</span>
                  </motion.div>
                )}
                {profile.location && (
                  <motion.div
                    className="flex items-center gap-2 justify-center md:justify-start"
                    whileHover={{ x: 5 }}
                  >
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {profile.email && (
              <SocialLink
                href={`mailto:${profile.email}`}
                icon={<FaEnvelope className="w-5 h-5" />}
                label="Email"
              />
            )}
            {profile.github && (
              <SocialLink
                href={`https://github.com/${profile.github}`}
                icon={<FaGithub className="w-5 h-5" />}
                label="GitHub"
              />
            )}
            {profile.linkedin && (
              <SocialLink
                href={`https://linkedin.com/in/${profile.linkedin}`}
                icon={<FaLinkedin className="w-5 h-5" />}
                label="LinkedIn"
              />
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4">
              {profile.bio && (
                <ProfileSection
                  title="About"
                  icon={<FaUserCircle className="w-5 h-5" />}
                >
                  <motion.p
                    className="text-muted-foreground whitespace-pre-wrap leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {profile.bio}
                  </motion.p>
                </ProfileSection>
              )}
            </TabsContent>

            <TabsContent value="skills">
              {profile.skills?.length > 0 && (
                <ProfileSection
                  title="Skills"
                  icon={<FaCode className="w-5 h-5" />}
                >
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Badge
                          variant="secondary"
                          className="text-sm py-1 px-3 hover:scale-105 transition-transform cursor-default"
                        >
                          {skill}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </ProfileSection>
              )}
            </TabsContent>

            <TabsContent value="achievements">
              {profile.achievements?.length > 0 && (
                <ProfileSection
                  title="Achievements"
                  icon={<FaTrophy className="w-5 h-5" />}
                >
                  <div className="space-y-3">
                    {profile.achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="text-xl">🏆</span>
                        <span className="flex-1">{achievement}</span>
                      </motion.div>
                    ))}
                  </div>
                </ProfileSection>
              )}
            </TabsContent>

            <TabsContent value="projects">
              {Array.isArray(profile.ongoing_projects) &&
                profile.ongoing_projects.length > 0 && (
                  <ProfileSection
                    title="Ongoing Projects"
                    icon={<FaProjectDiagram className="w-5 h-5" />}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      {profile.ongoing_projects.map((project, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() =>
                              setActiveProject(
                                activeProject === index ? null : index
                              )
                            }
                          >
                            <CardHeader>
                              <CardTitle className="text-base">
                                {project.name}
                              </CardTitle>
                              <motion.div
                                initial={false}
                                animate={{
                                  height:
                                    activeProject === index ? "auto" : "2.5rem",
                                }}
                                className="overflow-hidden"
                              >
                                <CardDescription>
                                  {project.description}
                                </CardDescription>
                              </motion.div>
                            </CardHeader>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </ProfileSection>
                )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileClient;
