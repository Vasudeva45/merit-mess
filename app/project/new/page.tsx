"use client";

import React from 'react';
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Rocket } from 'lucide-react';

export default function NewProjectPage() {
  const { user, isLoading } = useUser();

  if (!isLoading && !user) {
    redirect("/api/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Start New Project</h1>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Create Project
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Rocket className="mr-2 h-4 w-4" />
              Web Application
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Rocket className="mr-2 h-4 w-4" />
              Mobile App
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Rocket className="mr-2 h-4 w-4" />
              Data Science
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">No recent projects</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}