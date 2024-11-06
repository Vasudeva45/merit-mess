"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, Mail, Building, MapPin } from "lucide-react";

const ProjectMembers = ({ members }) => {
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "owner") return -1;
    if (b.role === "owner") return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Project Members</h2>
      <div className="grid grid-cols-2 gap-4">
        {sortedMembers.map((member) => (
          <Card key={member.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>{member.profile.name}</span>
                  {member.role === "owner" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Crown className="h-4 w-4 text-yellow-500" />
                        </TooltipTrigger>
                        <TooltipContent>Project Owner</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </CardTitle>
                <Badge
                  variant={member.status === "accepted" ? "success" : "secondary"}
                >
                  {member.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {member.profile.title && (
                  <div className="flex items-center text-gray-500">
                    <Building className="h-4 w-4 mr-2" />
                    {member.profile.title}
                  </div>
                )}
                {member.profile.email && (
                  <div className="flex items-center text-gray-500">
                    <Mail className="h-4 w-4 mr-2" />
                    {member.profile.email}
                  </div>
                )}
                {member.profile.location && (
                  <div className="flex items-center text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    {member.profile.location}
                  </div>
                )}
                {member.profile.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectMembers;