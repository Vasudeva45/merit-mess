"use client";

import React from 'react';
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useUser();

  if (!isLoading && !user) {
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
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Mentor Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Achievement Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">450</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((activity) => (
              <div key={activity} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <BarChart className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Activity {activity}</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}