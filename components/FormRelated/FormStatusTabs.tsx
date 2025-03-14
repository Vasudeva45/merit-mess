import React, { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Form } from "@prisma/client";
import CreateFormBtn from "@/components/smallComponents/CreateFormBtn";
import { FormCard } from "@/app/project/new/page";

const FormStatusTabs = ({ forms }: { forms: Form[] }) => {
  // Memoize filtered forms to avoid unnecessary recalculations on re-renders
  const { allForms, draftForms, activeForms, closedForms } = useMemo(() => {
    return {
      allForms: forms,
      draftForms: forms.filter((form) => form.status === "draft"),
      activeForms: forms.filter((form) => form.status === "active"),
      closedForms: forms.filter((form) => form.status === "closed"),
    };
  }, [forms]);

  // Common class for tab content grid
  const gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="all">All ({allForms.length})</TabsTrigger>
        <TabsTrigger value="draft">Draft ({draftForms.length})</TabsTrigger>
        <TabsTrigger value="active">Active ({activeForms.length})</TabsTrigger>
        <TabsTrigger value="closed">Closed ({closedForms.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className={gridClass}>
        <CreateFormBtn />
        {allForms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </TabsContent>

      <TabsContent value="draft" className={gridClass}>
        <CreateFormBtn />
        {draftForms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </TabsContent>

      <TabsContent value="active" className={gridClass}>
        <CreateFormBtn />
        {activeForms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </TabsContent>

      <TabsContent value="closed" className={gridClass}>
        <CreateFormBtn />
        {closedForms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </TabsContent>
    </Tabs>
  );
};

export default FormStatusTabs;
