import { Suspense } from "react";
import { MdCreateNewFolder } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { SearchForms } from "./SearchForms";
import { getPublicFormsWithOwners } from "@/actions/form";
import LandingPage from "./LandingPage";

export default async function HomePage({ user }) {
  const forms = await getPublicFormsWithOwners();

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-16 pb-12">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight">
              Public Forms Directory
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse and fill out public forms from our community.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="default" asChild>
                <a href="/project/new">
                  <MdCreateNewFolder className="w-5 h-5 mr-2" />
                  Create Your Form
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Forms Section */}
        <div className="container mx-auto px-4 py-8">
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
    </div>
  );
}