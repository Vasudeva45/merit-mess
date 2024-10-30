"use client";

import React from 'react';
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function AchievementsPage() {
  const { user, isLoading } = useUser();

  if (!isLoading && !user) {
    redirect("/api/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Achievements</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="font-bold">450 Points</span>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((achievement) => (
          <Card key={achievement}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Achievement {achievement}</CardTitle>
                  <p className="text-sm text-muted-foreground">50 points</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete your first project milestone to earn this achievement.
              </p>
              <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '60%' }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">60% Complete</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}