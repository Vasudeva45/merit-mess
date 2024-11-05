"use client";

import React from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { LoginButton } from "./login-button";
import { SignupButton } from "./signup-button";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme/ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Rocket,
  PlusCircle,
  Users,
  UserCircle,
  Laptop,
  GraduationCap,
  Trophy,
  Menu,
  BarChart,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { StatsCards } from "@/app/project/new/page";

const NavLink = ({ href, children, className }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-accent text-accent-foreground" : "text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
};

const Navbar = () => {
  const { user, isLoading } = useUser();

  // If not logged in, only show the landing page nav
  if (!user && !isLoading) {
    return (
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 mr-8">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">MeritMess</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <SignupButton />
            <LoginButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2 mr-8">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden md:inline-block">
            MeritMess
          </span>
        </Link>

        {/* Main Navigation - Desktop */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="">
            <NavigationMenuItem>
              <NavLink
                href="/project/new"
                fallback={<StatsCards loading={true} data={null} />}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Start Project
              </NavLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavLink href="/mentors">
                <GraduationCap className="mr-2 h-4 w-4" />
                Find Mentor
              </NavLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavLink href="/dashboard">
                <BarChart className="mr-2 h-4 w-4" />
                My Dashboard
              </NavLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavLink href="/achievements">
                <Trophy className="mr-2 h-4 w-4" />
                Achievements
              </NavLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavLink href="/project-invites">
                <Users className="mr-2 h-4 w-4" />
                Projects
              </NavLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Menu */}
        <div className="md:hidden flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/project/new" className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Start Project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/mentors" className="flex items-center">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Find Mentor
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center">
                  <BarChart className="mr-2 h-4 w-4" />
                  My Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/achievements" className="flex items-center">
                  <Trophy className="mr-2 h-4 w-4" />
                  Achievements
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/project-invites" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Projects
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side - User Menu */}
        <div className="ml-auto flex items-center gap-4">
          {user && !isLoading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <UserCircle className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-projects" className="flex items-center">
                    <Laptop className="mr-2 h-4 w-4" />
                    My Projects
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
