import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, Mail, Building, MapPin, UserCheck } from "lucide-react";
import { getProfilesByIds } from "@/actions/profile";

interface Member {
  id: string;
  userId: string;
  role: string;
  status: string;
  profile: {
    name: string;
  };
}

interface ProjectMembersProps {
  members: Member[];
}

const ProjectMembers: React.FC<ProjectMembersProps> = ({ members }) => {
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const userIds = [...new Set(members.map((member) => member.userId))];
        const fetchedProfiles = await getProfilesByIds(userIds);
        const profileMap = fetchedProfiles.reduce((acc: Record<string, any>, profile) => {
          acc[profile.userId] = profile;
          return acc;
        }, {});
        setProfiles(profileMap);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, [members]);

  // Deduplicate members based on userId and prioritize roles
  const dedupedMembers = members.reduce((acc: Member[], member) => {
    const existingMemberIndex = acc.findIndex(
      (m) => m.userId === member.userId
    );

    if (existingMemberIndex === -1) {
      // If no existing member, add this one
      acc.push(member);
    } else {
      // If existing member, prioritize roles
      const existingMember = acc[existingMemberIndex];
      if (
        member.role === "owner" ||
        (existingMember.role !== "owner" && member.status === "accepted")
      ) {
        acc[existingMemberIndex] = member;
      }
    }

    return acc;
  }, []);

  // Sort deduplicated members
  const sortedMembers = dedupedMembers
    .filter((member) => member.status !== "rejected")
    .sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      return 0;
    });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold">Project Members</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {sortedMembers.map((member) => {
          const profile = profiles[member.userId];
          return (
            <Card key={member.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                    <a
                      href={`/publicprofile/${encodeURIComponent(
                        member.userId
                      )}`}
                      className="flex items-center space-x-2 hover:text-primary transition-colors w-full"
                    >
                      <img
                        src={profile?.imageUrl || "/placeholder.png"}
                        alt={member.profile.name}
                        className="h-8 w-8 rounded-full"
                      />
                      <span>{member.profile.name}</span>
                    </a>
                    {member.role === "owner" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Crown className="h-4 w-4 text-yellow-500 sm:ml-2" />
                          </TooltipTrigger>
                          <TooltipContent>Project Owner</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </CardTitle>
                  <div className="flex flex-wrap items-center space-x-1 sm:space-x-2 justify-start sm:justify-end w-full sm:w-auto">
                    {member.role === "owner" && (
                      <Badge variant="secondary" className="mb-1 sm:mb-0">
                        Owner
                      </Badge>
                    )}
                    {profile?.type && (
                      <Badge
                        variant={
                          profile.type === "mentor" ? "default" : "outline"
                        }
                        className="mb-1 sm:mb-0"
                      >
                        {profile.type === "mentor" ? "Mentor" : "Student"}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        member.status === "accepted" ? "default" : "secondary"
                      }
                      className="mb-1 sm:mb-0"
                    >
                      {member.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {profile?.title && (
                    <div className="flex items-center text-gray-500">
                      <Building className="h-4 w-4 mr-2" />
                      {profile.title}
                    </div>
                  )}
                  {profile?.email && (
                    <div className="flex items-center text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      {profile.email}
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {profile.location}
                    </div>
                  )}
                  {profile?.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectMembers;
