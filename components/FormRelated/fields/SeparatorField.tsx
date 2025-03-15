"use client";

import {
  ElementsType,
  FormElement,
  FormElementInstance,
} from "../FormElements";
import { Label } from "@/components/ui/label";
import { RiSeparator } from "react-icons/ri";
import { Separator } from "@/components/ui/separator";

const type: ElementsType = "SeparatorField";

export const SeparatorFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
  }),
  designerBtnELement: {
    icon: RiSeparator,
    label: "Separator Field",
  },
  designerComponent: DesignerComponent,
  formComponent: FormComponent,
  propertiesComponent: PropertiesComponent,

  validate: () => true,
};

function DesignerComponent({
  elementInstance,
}: Readonly<{ elementInstance: FormElementInstance }>) {
  // Temporary console log to use the elementInstance variable
  console.log("Rendering DesignerComponent for:", elementInstance.id);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label className="text-muted-foreground">Separator field</Label>
      <Separator />
    </div>
  );
}

function FormComponent({
  elementInstance,
}: Readonly<{
  elementInstance: FormElementInstance;
}>) {
  // Temporary console log to use the elementInstance variable
  console.log("Rendering FormComponent for:", elementInstance.id);

  return <Separator />;
}

function PropertiesComponent({
  elementInstance,
}: Readonly<{
  elementInstance: FormElementInstance;
}>) {
  // Temporary console log to use the elementInstance variable
  console.log("Rendering PropertiesComponent for:", elementInstance.id);

  return <p>No properties for this element</p>;
}
