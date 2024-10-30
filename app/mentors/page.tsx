"use client";

import React from 'react';
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

export default function MentorsPage() {
  const { user, isLoading } = useUser();

  if (!isLoading && !user) {
    redirect("/api/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Find a Mentor</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((mentor) => (
          <Card key={mentor}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Mentor {mentor}</CardTitle>
                  <p className="text-sm text-muted-foreground">Senior Developer</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Experienced in web development, cloud architecture, and system design.
              </p>
              <Button variant="secondary" className="w-full">View Profile</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}