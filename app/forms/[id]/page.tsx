import React, { Suspense } from "react";
import { GetFormById, GetFormWithSubmissions } from "@/actions/form";
import {
  getFormSubmissionsWithProfiles,
  getProjectGroup,
} from "@/actions/group";
import { StatsCard } from "@/app/project/new/page";
import {
  ElementsType,
  FormElementInstance,
} from "@/components/FormRelated/FormElements";
import FormLinkShare from "@/components/FormRelated/FormLinkShare";
import VisitBtn from "@/components/FormRelated/VisitBtn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistance } from "date-fns";
import { ReactNode } from "react";
import { Zap, Users as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import SubmissionGroupManager from "@/components/groupRelated/SubmissionGroupManager";
import { StatusButton } from "@/components/FormRelated/StatusButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
// Separate client-side component for description
import DescriptionExpander from "@/components/FormRelated/DescriptionExpander";

// Loading component
function BuilderPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header section loading */}
      <div className="py-8 border-b border-muted bg-card">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-center h-full">
                <Zap className="w-12 h-12 animate-pulse text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Stats cards loading skeleton */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>

        {/* Submissions & Groups loading */}
        <div className="mt-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}

async function BuilderPage({
  params,
}: Readonly<{
  params: {
    id: string;
  };
}>) {
  const { id } = params;
  const form = await GetFormById(Number(id));
  if (!form) {
    throw new Error("form not found");
  }

  const { visits, submissions } = form;
  const submissionRate = visits > 0 ? (submissions / visits) * 100 : 0;
  const bouncedRate = 100 - submissionRate;

  // Fetch submissions with profile data for group management
  const submissionsWithProfiles = (await getFormSubmissionsWithProfiles(
    Number(id)
  )).map(submission => ({
    ...submission,
    createdAt: submission.createdAt.toISOString(),
  }));

  // Fetch existing group data if it exists
  const existingGroup = await getProjectGroup(Number(id));
  if (existingGroup) {
    // existingGroupId is not used, so we don't need to assign it
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header section */}
      <div className="py-8 border-b border-muted bg-card">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  {form.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {form.domain && (
                    <Badge variant="outline" className="text-sm">
                      Domain: {form.domain}
                    </Badge>
                  )}
                  {form.specialization && (
                    <Badge variant="outline" className="text-sm">
                      Specialization: {form.specialization}
                    </Badge>
                  )}
                </div>
              </div>
              {form.description && (
                <DescriptionExpander description={form.description} />
              )}
            </div>
            <div className="flex items-center gap-4">
              <StatusButton status={form.status} formId={form.id} />
              <FormLinkShare shareURL={form.shareURL} />
              <VisitBtn shareURL={form.shareURL} />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Stats cards section */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total visits"
            icon={<Zap className="w-6 h-6" />}
            iconBg="bg-primary"
            helperText="All time form visits"
            value={visits.toLocaleString() ?? "0"}
            loading={false}
            className="transition-transform hover:scale-105"
          />
          <StatsCard
            title="Total submissions"
            icon={<Zap className="w-6 h-6" />}
            iconBg="bg-primary"
            helperText="All time form submissions"
            value={submissions.toLocaleString() ?? "0"}
            loading={false}
            className="transition-transform hover:scale-105"
          />
          <StatsCard
            title="Submission rate"
            icon={<Zap className="w-6 h-6" />}
            iconBg="bg-primary"
            helperText="Visits that result in form submission"
            value={submissionRate.toLocaleString() + "%" || "0"}
            loading={false}
            className="transition-transform hover:scale-105"
          />
          <StatsCard
            title="Bounce rate"
            icon={<Zap className="w-6 h-6" />}
            iconBg="bg-primary"
            helperText="Visits that leave without interacting"
            value={bouncedRate.toLocaleString() + "%" || "0"}
            loading={false}
            className="transition-transform hover:scale-105"
          />
        </div>

        {/* Tabbed interface for submissions and groups */}
        <Tabs defaultValue="submissions" className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Submissions & Groups</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage form responses and create project groups
                </p>
              </div>
              <TabsList>
                <TabsTrigger
                  value="submissions"
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Submissions
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Groups
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="submissions">
                <SubmissionsTable id={Number(id)} />
              </TabsContent>
              <TabsContent value="groups">
                <SubmissionGroupManager
                  formId={id.toString()}
                  submissions={submissionsWithProfiles}
                  existingGroup={existingGroup}
                />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}

type Row = { [key: string]: string } & {
  submittedAt: Date;
};

async function SubmissionsTable({ id }: { id: number }) {
  const form = await GetFormWithSubmissions(id);

  if (!form) {
    throw new Error("form not found");
  }

  const formElements = JSON.parse(form.content) as FormElementInstance[];
  const columns: {
    id: string;
    label: string;
    required: boolean;
    type: ElementsType;
  }[] = [];

  formElements.forEach((element) => {
    switch (element.type) {
      case "TextField":
      case "NumberField":
      case "TextAreaField":
      case "DateField":
      case "SelectField":
      case "CheckboxField":
      case "RadioField":
      case "TimeField":
      case "DurationField":
      case "LinearScale":
        columns.push({
          id: element.id,
          label: element.extraAttributes?.label,
          required: element.extraAttributes?.required,
          type: element.type,
        });
        break;
      default:
        break;
    }
  });

  // Sort submissions by date in descending order (most recent first)
  const rows: Row[] = form.FormSubmissions.map((submission) => ({
    ...JSON.parse(submission.content),
    submittedAt: submission.createdAt,
  })).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  return (
    <div className="relative overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columns.map((column) => (
              <TableHead key={column.id} className="font-semibold">
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.required && (
                    <span className="text-red-500 text-sm">*</span>
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="text-right">Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
                className="text-center py-8 text-muted-foreground"
              >
                No submissions yet
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow
                key={index}
                className="hover:bg-muted/50 transition-colors"
              >
                {columns.map((column) => (
                  <RowCell
                    key={column.id}
                    type={column.type}
                    value={row[column.id]}
                  />
                ))}
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-muted-foreground text-sm">
                      {formatDistance(row.submittedAt, new Date(), {
                        addSuffix: true,
                      })}
                    </span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function RowCell({ type, value }: { type: ElementsType; value: string }) {
  let node: ReactNode = value;

  switch (type) {
    case "DateField":
      if (!value) break;
      const date = new Date(value);
      node = <Badge variant={"outline"}>{format(date, "dd/MM/yyyy")}</Badge>;
      break;
    case "CheckboxField":
      const checked = value === "true";
      node = <Checkbox checked={checked} disabled />;
      break;
  }

  return (
    <TableCell>
      <span className="truncate block max-w-[200px]">{node}</span>
    </TableCell>
  );
}

// Wrap the page with Suspense for loading state

interface BuilderPageWrapperProps {
  params: {
    id: string;
  };
}

export default function BuilderPageWrapper(props: BuilderPageWrapperProps) {
  return (
    <Suspense fallback={<BuilderPageLoading />}>
      <BuilderPage {...props} />
    </Suspense>
  );
}
