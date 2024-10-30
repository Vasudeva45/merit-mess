"use client";

import React from 'react';
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Laptop, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Trash2,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Example project data
const projects = [
  {
    id: 1,
    name: "E-commerce Platform",
    description: "Building a modern e-commerce platform with Next.js and Stripe integration",
    status: "in-progress",
    progress: 65,
    dueDate: "2024-12-01",
    tech: ["Next.js", "TypeScript", "Stripe"],
    collaborators: 3
  },
  {
    id: 2,
    name: "Mobile Weather App",
    description: "Weather forecasting app with React Native and weather API integration",
    status: "completed",
    progress: 100,
    dueDate: "2024-10-15",
    tech: ["React Native", "JavaScript", "API"],
    collaborators: 2
  },
  {
    id: 3,
    name: "Task Management Tool",
    description: "Internal tool for task and project management",
    status: "planned",
    progress: 0,
    dueDate: "2024-12-30",
    tech: ["React", "Node.js", "MongoDB"],
    collaborators: 4
  }
];

export default function MyProjectsPage() {
  const { user, isLoading } = useUser();

  if (!isLoading && !user) {
    redirect("/api/auth/login");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-500/10';
      case 'in-progress':
        return 'text-blue-500 bg-blue-500/10';
      case 'planned':
        return 'text-orange-500 bg-orange-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'planned':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const ProjectCard = ({ project }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Project
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {project.description}
        </p>
        
        <div className="space-y-4">
          {/* Status and Progress */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {getStatusIcon(project.status)}
              <span className="capitalize">{project.status.replace('-', ' ')}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Due {new Date(project.dueDate).toLocaleDateString()}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${project.progress}%` }} 
              />
            </div>
          </div>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2">
            {project.tech.map((tech, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Collaborators */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {project.collaborators} Collaborators
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            Manage and track all your ongoing projects
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Project Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="planned">Planned</TabsTrigger>
        </TabsList>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Laptop className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'in-progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planned</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'planned').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Grid */}
        <TabsContent value="all" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </TabsContent>

        <TabsContent value="active" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects
            .filter((p) => p.status === 'in-progress')
            .map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
        </TabsContent>

        <TabsContent value="completed" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects
            .filter((p) => p.status === 'completed')
            .map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
        </TabsContent>

        <TabsContent value="planned" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects
            .filter((p) => p.status === 'planned')
            .map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}