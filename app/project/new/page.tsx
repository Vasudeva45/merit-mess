"use client";

import { GetForms, GetFormStats } from "@/actions/form";
import FormStatusTabs from "@/components/FormRelated/FormStatusTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Form } from "@prisma/client";
import { formatDistance } from "date-fns";
import { Layers, Rows4, Users, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";
import { BiRightArrowAlt } from "react-icons/bi";
import { FaWpforms } from "react-icons/fa";
import { HiCursorClick } from "react-icons/hi";
import { LuView } from "react-icons/lu";
import { TbArrowBounce } from "react-icons/tb";

export default function NewProjectPage() {
  const { user, isLoading } = useUser();
  const [stats, setStats] = useState<Awaited<
    ReturnType<typeof GetFormStats>
  > | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await GetFormStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      redirect("/api/auth/login");
    }
  }, [user, isLoading]);

  if (isLoading || !stats) {
    return <StatsCards loading={true} data={null} />;
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-6 border border-primary/10">
          <StatsCards loading={false} data={stats} />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Rows4 className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">Your Forms</h2>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4].map((el) => (
                  <FormCardSkeleton key={el} />
                ))}
              </div>
            }
          >
            <FormCards />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  data: Awaited<ReturnType<typeof GetFormStats>> | null;
  loading: boolean;
}

export function StatsCards(props: Readonly<StatsCardProps>) {
  const { data, loading } = props;

  return (
    <div className="w-full gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total visits"
        icon={<LuView className="w-6 h-6" />}
        helperText="All time form visits"
        value={data?.visits.toLocaleString() ?? "0"}
        loading={loading}
        className="
          bg-blue-50/50 
          dark:bg-blue-950/30 
          border-blue-200 
          dark:border-blue-900
        "
        iconBg="bg-blue-100 text-blue-600"
      />
      <StatsCard
        title="Total submissions"
        icon={<FaWpforms className="w-6 h-6" />}
        helperText="All time form submissions"
        value={data?.submissions.toLocaleString() ?? "0"}
        loading={loading}
        className="
          bg-green-50/50 
          dark:bg-green-950/30 
          border-green-200 
          dark:border-green-900
        "
        iconBg="bg-green-100 text-green-600"
      />
      <StatsCard
        title="Submission rate"
        icon={<HiCursorClick className="w-6 h-6" />}
        helperText="Visits that result in form submission"
        value={data?.submissionRate.toLocaleString() + "%" || "0"}
        loading={loading}
        className="
          bg-purple-50/50 
          dark:bg-purple-950/30 
          border-purple-200 
          dark:border-purple-900
        "
        iconBg="bg-purple-100 text-purple-600"
      />
      <StatsCard
        title="Bounce rate"
        icon={<TbArrowBounce className="w-6 h-6" />}
        helperText="Visits that leave without interacting"
        value={data?.submissionRate.toLocaleString() + "%" || "0"}
        loading={loading}
        className="
          bg-red-50/50 
          dark:bg-red-950/30 
          border-red-200 
          dark:border-red-900
        "
        iconBg="bg-red-100 text-red-600"
      />
    </div>
  );
}

export function StatsCard({
  title,
  value,
  icon,
  helperText,
  loading,
  className,
  iconBg,
}: Readonly<{
  title: string;
  value: string;
  helperText: string;
  className: string;
  loading: boolean;
  icon: ReactNode;
  iconBg: string;
}>) {
  return (
    <div
      className={`
        ${className}
        rounded-2xl 
        border 
        p-5 
        transform 
        transition-all 
        duration-300 
        hover:-translate-y-2 
        hover:shadow-lg
      `}
    >
      <div className="flex justify-between items-center mb-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
        <div className="text-right">
          <div className="text-3xl font-bold tracking-tight">
            {loading ? (
              <Skeleton>
                <span className="opacity-0">0</span>
              </Skeleton>
            ) : (
              value
            )}
          </div>
          <p className="text-xs text-muted-foreground/80 mt-1">{helperText}</p>
        </div>
      </div>
      <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(parseInt(value), 100)}%` }}
        />
      </div>
    </div>
  );
}

function FormCardSkeleton() {
  return (
    <div className="bg-muted/10 rounded-3xl border border-muted/20 overflow-hidden animate-pulse">
      <div className="h-48 bg-muted/20" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-muted/30 rounded w-3/4" />
        <div className="h-4 bg-muted/20 rounded w-1/2" />
      </div>
    </div>
  );
}

function FormCards() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setForms(await GetForms());
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  return loading ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4].map((el) => (
        <FormCardSkeleton key={el} />
      ))}
    </div>
  ) : (
    <FormStatusTabs forms={forms} />
  );
}

export function FormCard({ form }: Readonly<{ form: Form }>) {
  return (
    <div
      className="
        group 
        relative 
        bg-white 
        dark:bg-gray-900 
        rounded-3xl 
        border 
        border-muted/20 
        overflow-hidden 
        transition-all 
        duration-300 
        hover:border-primary/30 
        hover:shadow-xl
      "
    >
      {/* Decorative Gradient Background */}
      <div
        className="
          absolute 
          top-0 
          left-0 
          w-full 
          h-1 
          bg-gradient-to-r 
          from-primary/50 
          to-primary/10
        "
      />

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h3
              className="
                text-xl 
                font-bold 
                tracking-tight 
                group-hover:text-primary 
                transition-colors
              "
            >
              {form.name}
            </h3>
            <div className="flex items-center gap-2">
              {form.projectGroup && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 animate-pulse"
                >
                  <Users className="w-3 h-3" />
                  Group
                </Badge>
              )}
              <Badge
                variant={
                  form.status === "draft"
                    ? "secondary"
                    : form.status === "closed"
                    ? "destructive"
                    : "default"
                }
                className="animate-pulse"
              >
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </Badge>
              {form.published ? (
                <Badge className="animate-pulse">Published</Badge>
              ) : (
                <Badge variant="destructive" className="animate-pulse">
                  Draft
                </Badge>
              )}
            </div>
          </div>
          <div className="opacity-50 group-hover:opacity-100 transition-opacity">
            {form.published ? (
              <Zap className="w-6 h-6" />
            ) : (
              <Layers className="w-6 h-6" />
            )}
          </div>
        </div>

        <CardDescription className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="italic">
              {formatDistance(form.createdAt, new Date(), {
                addSuffix: true,
              })}
            </span>
            {form.published && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 hover:text-primary transition-colors">
                  <LuView />
                  <span>{form.visits.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 hover:text-primary transition-colors">
                  <FaWpforms />
                  <span>{form.submissions.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
          {(form.domain || form.specialization) && (
            <div className="flex flex-wrap gap-2 text-xs mt-2">
              {form.domain && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  {form.domain}
                </Badge>
              )}
              {form.specialization && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  {form.specialization}
                </Badge>
              )}
            </div>
          )}
        </CardDescription>

        <p
          className="
            text-sm 
            text-muted-foreground 
            line-clamp-2 
            italic
            group-hover:text-primary/80 
            transition-colors
          "
        >
          {form.description || "No description provided"}
        </p>

        <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: form.published
                ? `${(form.submissions / Math.max(form.visits, 1)) * 100}%`
                : "0%",
            }}
          />
        </div>

        <Button
          asChild
          variant={form.published ? "outline" : "secondary"}
          className="
            w-full 
            mt-4 
            group 
            transition-all 
            duration-300 
            hover:bg-primary 
            hover:text-primary-foreground
            rounded-xl
            border
            relative
            overflow-hidden
          "
        >
          <Link
            href={form.published ? `/forms/${form.id}` : `/builder/${form.id}`}
          >
            <span className="relative z-10 flex items-center justify-center">
              {form.published ? "View Submissions" : "Edit Form"}
              <BiRightArrowAlt className="ml-2" />
            </span>
            <span
              className="
                absolute 
                inset-0 
                bg-primary/10 
                opacity-0 
                group-hover:opacity-100 
                transition-opacity
                z-0
              "
            />
          </Link>
        </Button>
      </div>
    </div>
  );
}
