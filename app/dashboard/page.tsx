"use client";

import { getMyProjectGroups, getProjectInvites } from "@/actions/group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@auth0/nextjs-auth0/client";
import { BarChart, Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useUser();
  const [projectGroups, setProjectGroups] = useState([]);
  const [projectInvites, setProjectInvites] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!authLoading && user) {
        try {
          const [myGroups, invites] = await Promise.all([
            getMyProjectGroups(),
            getProjectInvites(),
          ]);
          setProjectGroups(myGroups);
          setProjectInvites(invites);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setDataLoading(false);
        }
      }
    };
    fetchData();
  }, [authLoading, user]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!authLoading && !user) {
    redirect("/api/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {
                projectGroups.filter((group) => group.status === "active")
                  .length
              }
            </div>
            <div className="text-sm text-muted-foreground">
              {
                projectGroups.filter((group) => group.status === "active")
                  .length
              }{" "}
              active projects
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Completed Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {
                projectGroups.filter((group) => group.status === "completed")
                  .length
              }
            </div>
            <div className="text-sm text-muted-foreground">
              {
                projectGroups.filter((group) => group.status === "completed")
                  .length
              }{" "}
              completed projects
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{projectInvites.length}</div>
            <div className="text-sm text-muted-foreground">
              {projectInvites.length} pending invitations
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectGroups.slice(0, 3).map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
              >
                <BarChart className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{group.form?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
