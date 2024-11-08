import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Form } from "@prisma/client";
import CreateFormBtn from "@/components/smallComponents/CreateFormBtn";
import { FormCard } from "@/app/project/new/page";

const FormStatusTabs = ({ forms }: { forms: Form[] }) => {
  // Filter forms by status
  const draftForms = forms.filter((form) => form.status === "draft");
  const activeForms = forms.filter((form) => form.status === "active");
  const closedForms = forms.filter((form) => form.status === "closed");

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="all">All ({forms.length})</TabsTrigger>
        <TabsTrigger value="draft">Draft ({draftForms.length})</TabsTrigger>
        <TabsTrigger value="active">Active ({activeForms.length})</TabsTrigger>
        <TabsTrigger value="closed">Closed ({closedForms.length})</TabsTrigger>
      </TabsList>

      <TabsContent
        value="all"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <CreateFormBtn />
        {forms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </TabsContent>

      <TabsContent
        value="draft"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <CreateFormBtn />
        {draftForms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </TabsContent>

      <TabsContent
        value="active"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <CreateFormBtn />
        {activeForms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </TabsContent>

      <TabsContent
        value="closed"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <CreateFormBtn />
        {closedForms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </TabsContent>
    </Tabs>
  );
};

export default FormStatusTabs;
