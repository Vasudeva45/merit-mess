"use client";

import React, { useEffect, useState } from "react";
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
  ChevronDown,
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
import { getProfile } from "@/actions/profile";
import { Profile } from "@prisma/client";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, className }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
        "hover:bg-primary hover:text-primary-foreground",
        "active:scale-95",
        isActive
          ? "bg-primary/10 text-primary before:absolute before:bottom-0 before:left-0 before:h-1 before:w-full before:bg-primary before:rounded-t-lg"
          : "text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
};

const Navbar = () => {
  const { user, isLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (user && !isLoading) {
      fetchProfile();
    }
  }, [user, isLoading]);

  if (!user && !isLoading) {
    return (
      <div
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200",
          isScrolled
            ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            : "bg-transparent"
        )}
      >
        <div className="flex h-16 items-center px-4 md:px-8">
          <Link href="/" className="flex items-center gap-3 mr-8 group">
            <Rocket className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              MeritMess
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <SignupButton />
            <LoginButton />
            <div className="h-6 w-px bg-border" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled
          ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-transparent"
      )}
    >
      <div className="flex h-16 items-center px-4 md:px-8">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3 mr-8 group">
          <Rocket className="h-6 w-6 text-primary transition-transform group-hover:rotate-12" />
          <span className="font-bold text-lg hidden md:block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            MeritMess
          </span>
        </Link>

        {/* Main Navigation - Desktop */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <NavLink href="/project/new">
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
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2">
              <DropdownMenuItem asChild>
                <Link
                  href="/project/new"
                  className="flex items-center p-2 rounded-lg"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Start Project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/mentors"
                  className="flex items-center p-2 rounded-lg"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Find Mentor
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center p-2 rounded-lg"
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  My Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/achievements"
                  className="flex items-center p-2 rounded-lg"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Achievements
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/project-invites"
                  className="flex items-center p-2 rounded-lg"
                >
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
                  className="relative flex items-center gap-2 rounded-lg pl-3 pr-2 hover:bg-primary/10"
                >
                  {profile?.imageUrl ? (
                    <img
                      src={profile.imageUrl}
                      alt={profile.name}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <UserCircle className="h-6 w-6" />
                  )}
                  <span className="hidden md:block text-sm font-medium">
                    {profile?.name || user.name || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {profile?.name || user.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center p-2 rounded-lg"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/project-invites"
                    className="flex items-center p-2 rounded-lg"
                  >
                    <Laptop className="mr-2 h-4 w-4" />
                    My Projects
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <LogoutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="h-6 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
