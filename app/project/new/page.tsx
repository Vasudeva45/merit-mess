"use client";

import { GetForms, GetFormStats } from "@/actions/form";
import CreateFormBtn from "@/components/smallComponents/CreateFormBtn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SelectSeparator } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Form } from "@prisma/client";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";
import { FaWpforms, FaEdit } from "react-icons/fa";
import { HiCursorClick } from "react-icons/hi";
import { LuView } from "react-icons/lu";
import { TbArrowBounce } from "react-icons/tb";
import { BiRightArrowAlt } from "react-icons/bi";
import { Users } from "lucide-react";

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
    <>
      <StatsCards loading={false} data={stats} />
      <SelectSeparator className="my-6" />
      <h2 className="text-4xl font-bold col-span-2">Your forms</h2>
      <SelectSeparator className="my-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CreateFormBtn />
        <Suspense
          fallback={[1, 2, 3, 4].map((el) => (
            <FormCardSkeleton key={el} />
          ))}
        >
          <FormCards />
        </Suspense>
      </div>
    </>
  );
}

interface StatsCardProps {
  data: Awaited<ReturnType<typeof GetFormStats>> | null;
  loading: boolean;
}

export function StatsCards(props: Readonly<StatsCardProps>) {
  const { data, loading } = props;

  return (
    <div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total visits"
        icon={<LuView className="text-blue-600" />}
        helperText="All time form visits"
        value={data?.visits.toLocaleString() ?? "0"}
        loading={loading}
        className="shadow-md shadow-blue-600"
      />
      <StatsCard
        title="Total submissions"
        icon={<FaWpforms className="text-yellow-600" />}
        helperText="All time form submissions"
        value={data?.submissions.toLocaleString() ?? "0"}
        loading={loading}
        className="shadow-md shadow-yellow-600"
      />
      <StatsCard
        title="Submission rate"
        icon={<HiCursorClick className="text-green-600" />}
        helperText="Visits that result in form submission"
        value={data?.submissionRate.toLocaleString() + "%" || "0"}
        loading={loading}
        className="shadow-md shadow-green-600"
      />
      <StatsCard
        title="Bounce rate"
        icon={<TbArrowBounce className="text-red-600" />}
        helperText="Visits that leave without interacting"
        value={data?.submissionRate.toLocaleString() + "%" || "0"}
        loading={loading}
        className="shadow-md shadow-red-600"
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
}: Readonly<{
  title: string;
  value: string;
  helperText: string;
  className: string;
  loading: boolean;
  icon: ReactNode;
}>) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading && (
            <Skeleton>
              <span className="opacity-0">0</span>
            </Skeleton>
          )}
          {!loading && value}
        </div>
        <p className="text-xs text-muted-foreground pt-1">{helperText}</p>
      </CardContent>
    </Card>
  );
}

function FormCardSkeleton() {
  return <Skeleton className="border-2 border-primary-/20 h-[190px] w-full" />;
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
    <>
      {[1, 2, 3, 4].map((el) => (
        <FormCardSkeleton key={el} />
      ))}
    </>
  ) : (
    <>
      {forms.map((form) => (
        <FormCard key={form.id} form={form} />
      ))}
    </>
  );
}

function FormCard({ form }: Readonly<{ form: Form }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <span className="truncate font-bold">{form.name}</span>
          <div className="flex gap-2">
            {form.projectGroup && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Group
              </Badge>
            )}
            {form.published && <Badge>Published</Badge>}
            {!form.published && <Badge variant="destructive">Draft</Badge>}
          </div>
        </CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            {formatDistance(form.createdAt, new Date(), {
              addSuffix: true,
            })}
            {form.published && (
              <span className="flex items-center gap-2">
                <LuView className="text-muted-foreground" />
                <span>{form.visits.toLocaleString()}</span>
                <FaWpforms className="text-muted-foreground" />
                <span>{form.submissions.toLocaleString()}</span>
              </span>
            )}
          </div>
          {(form.domain || form.specialization) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {form.domain && (
                <Badge variant="outline" className="text-xs">
                  {form.domain}
                </Badge>
              )}
              {form.specialization && (
                <Badge variant="outline" className="text-xs">
                  {form.specialization}
                </Badge>
              )}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[20px] truncate text-sm text-muted-foreground">
        {form.description || "No Description"}
      </CardContent>
      <CardFooter>
        {form.published && (
          <Button asChild className="w-full mt-2 text-md gap-4">
            <Link href={`/forms/${form.id}`}>
              View Submissions <BiRightArrowAlt />
            </Link>
          </Button>
        )}
        {!form.published && (
          <Button
            asChild
            variant="secondary"
            className="w-full mt-2 text-md gap-4"
          >
            <Link href={`/builder/${form.id}`}>
              Edit form <FaEdit />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
