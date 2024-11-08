"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaWpforms } from "react-icons/fa";
import { LuView, LuSearch } from "react-icons/lu";
import { formatDistance } from "date-fns";
import { HiClock } from "react-icons/hi";

// Types for our form data
type Form = {
  id: number;
  name: string;
  description: string;
  domain: string;
  specialization: string;
  visits: number;
  createdAt: string;
  shareURL: string;
  status: string;
};

const SearchBar = ({ onSearch }) => {
  return (
    <div className="relative w-full max-w-xl mx-auto mb-8">
      <div className="relative">
        <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder="Search forms by name, domain, or specialization..."
          className="w-full pl-10 pr-4"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
};

const FormGrid = ({ forms }: { forms: Form[] }) => {
  // Filter out closed forms (though they should already be filtered on server)
  const activeForms = forms.filter((form) => form.status !== "closed");

  if (!activeForms.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No forms found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search terms or browse all forms
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {activeForms.map((form) => (
        <Card key={form.id} className="group transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaWpforms className="w-5 h-5" />
              {form.name}
            </CardTitle>
            <CardDescription>
              {form.description || "No description provided"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {form.domain && (
                <Badge variant="outline" className="text-sm">
                  {form.domain}
                </Badge>
              )}
              {form.specialization && (
                <Badge variant="outline" className="text-sm">
                  {form.specialization}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LuView className="w-4 h-4" />
              {form.visits} views
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HiClock className="w-4 h-4" />
              {formatDistance(new Date(form.createdAt), new Date(), {
                addSuffix: true,
              })}
            </div>
            <Button
              variant="default"
              asChild
              disabled={form.status === "draft"}
            >
              <a
                href={`/submit/${form.shareURL}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Fill Form
              </a>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

// Update the search filtering in SearchForms component to include status check
export function SearchForms({ initialForms }: { initialForms: Form[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredForms, setFilteredForms] = useState(initialForms);

  useEffect(() => {
    const filtered = initialForms.filter((form) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        form.status !== "closed" &&
        (form.name.toLowerCase().includes(searchLower) ||
          form.domain.toLowerCase().includes(searchLower) ||
          form.specialization.toLowerCase().includes(searchLower))
      );
    });
    setFilteredForms(filtered);
  }, [searchQuery, initialForms]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Available Forms</h2>
        <SearchBar onSearch={setSearchQuery} />
      </div>
      <FormGrid forms={filteredForms} />
    </div>
  );
}
