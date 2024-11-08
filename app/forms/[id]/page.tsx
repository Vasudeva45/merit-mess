import React from "react";
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
import { FaWpforms, FaUsers } from "react-icons/fa";
import { HiCursorClick } from "react-icons/hi";
import { LuView } from "react-icons/lu";
import { TbArrowBounce } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import SubmissionGroupManager from "@/components/groupRelated/SubmissionGroupManager";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LuSettings } from "react-icons/lu";
import { StatusButton } from "@/components/FormRelated/StatusButton";

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
  let submissionRate = visits > 0 ? (submissions / visits) * 100 : 0;
  const bouncedRate = 100 - submissionRate;

  // Fetch submissions with profile data for group management
  const submissionsWithProfiles = await getFormSubmissionsWithProfiles(
    Number(id)
  );

  // Fetch existing group data if it exists
  const existingGroup = await getProjectGroup(Number(id));

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
              <p className="text-muted-foreground">
                {form.description || "Form Dashboard"}
              </p>
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
            icon={<LuView className="w-6 h-6" />}
            helperText="All time form visits"
            value={visits.toLocaleString() ?? "0"}
            loading={false}
            className="transition-transform hover:scale-105"
          />
          <StatsCard
            title="Total submissions"
            icon={<FaWpforms className="w-6 h-6" />}
            helperText="All time form submissions"
            value={submissions.toLocaleString() ?? "0"}
            loading={false}
            className="transition-transform hover:scale-105"
          />
          <StatsCard
            title="Submission rate"
            icon={<HiCursorClick className="w-6 h-6" />}
            helperText="Visits that result in form submission"
            value={submissionRate.toLocaleString() + "%" || "0"}
            loading={false}
            className="transition-transform hover:scale-105"
          />
          <StatsCard
            title="Bounce rate"
            icon={<TbArrowBounce className="w-6 h-6" />}
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
                  <FaWpforms className="w-4 h-4" />
                  Submissions
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <FaUsers className="w-4 h-4" />
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
                  formId={Number(id)}
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

export default BuilderPage;
