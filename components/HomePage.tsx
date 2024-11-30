import React from "react";
import { Suspense } from "react";
import { MdCreateNewFolder, MdDashboard, MdAutoGraph } from "react-icons/md";
import { FaWpforms, FaSearch, FaClipboardList } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { SearchForms } from "./SearchForms";
import { getPublicFormsWithOwners } from "@/actions/form";
import LandingPage from "./LandingPage";
import { cn } from "@/lib/utils";

const StatCard = ({ icon: Icon, title, value, className }) => (
  <div
    className={cn(
      "p-6 rounded-2xl shadow-lg bg-card text-card-foreground transform transition-all",
      "hover:scale-[1.03] hover:shadow-xl group relative overflow-hidden",
      className
    )}
  >
    <div className="absolute -top-4 -right-4 opacity-10 group-hover:opacity-20 transition-all">
      <Icon className="w-16 h-16" />
    </div>
    <div className="flex items-center justify-between relative z-10">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
          {title}
        </h3>
        <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
      </div>
      <Icon className="w-10 h-10 text-primary/70 group-hover:text-primary transition-colors" />
    </div>
  </div>
);

const FeatureHighlight = ({ icon: Icon, title, description }) => (
  <div
    className="group p-6 bg-background rounded-2xl border border-border 
    transition-all duration-300 hover:border-primary/30 
    hover:shadow-xl hover:-translate-y-2"
  >
    <div className="flex items-center mb-4 space-x-4">
      <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h4 className="text-xl font-semibold text-foreground">{title}</h4>
    </div>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export default async function EnhancedHomePage({ user }) {
  const forms = await getPublicFormsWithOwners();

  if (!user) {
    return <LandingPage />;
  }

  const totalForms = forms.length;
  const publicForms = forms.filter((form) => form.status !== "closed").length;
  const domainsCount = [...new Set(forms.map((form) => form.domain))].length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-background to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-4">
              <span className="text-primary text-sm font-medium flex items-center gap-2">
                <MdAutoGraph className="w-5 h-5" />
                Collaborative Form Platform
              </span>
            </div>
            <h1
              className="text-5xl font-extrabold tracking-tight leading-tight 
              text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary/70"
            >
              Discover and Create Public Forms
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empower your workflow with community-driven forms. Seamless
              creation, easy discovery, and collaborative innovation.
            </p>
            <div className="flex justify-center gap-4 pt-6">
              <Button
                size="lg"
                variant="default"
                className="shadow-md hover:scale-105 transition-transform"
                asChild
              >
                <a href="/project/new">
                  <MdCreateNewFolder className="w-5 h-5 mr-2" />
                  Create Form
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="shadow-md hover:scale-105 transition-transform"
                asChild
              >
                <a href="/dashboard">
                  <MdDashboard className="w-5 h-5 mr-2" />
                  My Dashboard
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={FaWpforms}
            title="Total Forms"
            value={totalForms}
            className="border-l-4 border-primary/50"
          />
          <StatCard
            icon={FaSearch}
            title="Public Forms"
            value={publicForms}
            className="border-l-4 border-green-500/50"
          />
          <StatCard
            icon={FaClipboardList}
            title="Unique Domains"
            value={domainsCount}
            className="border-l-4 border-purple-500/50"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Why Use Our Platform?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlock the power of collaborative form creation with intuitive tools
            and a user-friendly experience.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureHighlight
            icon={FaWpforms}
            title="Community-Driven"
            description="Forms created and shared by users across various domains and specializations, fostering collaboration and innovation."
          />
          <FeatureHighlight
            icon={FaSearch}
            title="Easy Discovery"
            description="Powerful search and filtering capabilities to help you find the perfect form for your specific needs quickly and efficiently."
          />
          <FeatureHighlight
            icon={MdCreateNewFolder}
            title="Quick Creation"
            description="Intuitive form builder that allows you to create and publish professional forms with no technical expertise required."
          />
        </div>
      </div>

      {/* Forms Section */}
      <div className="container mx-auto px-4 py-12 bg-secondary/10 rounded-t-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Browse Community Forms
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore a diverse collection of public forms created by our vibrant
            community.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-4">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <SearchForms initialForms={forms} />
        </Suspense>
      </div>
    </div>
  );
}
