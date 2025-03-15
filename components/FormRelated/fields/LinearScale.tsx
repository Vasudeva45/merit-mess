"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MdLinearScale } from "react-icons/md";
import { z } from "zod";
import {
  ElementsType,
  FormElement,
  FormElementInstance,
  SubmitFunction,
} from "../FormElements";
import useDesigner from "../hooks/useDesigner";

const type: ElementsType = "LinearScale";

const extraAttributes = {
  label: "Rate your experience",
  helperText: "Select a rating",
  required: false,
  startValue: 1,
  endValue: 5,
  startLabel: "Poor",
  endLabel: "Excellent",
  showLabels: true,
};

const propertiesSchema = z
  .object({
    label: z.string().min(2).max(50),
    helperText: z.string().max(200),
    required: z.boolean().default(false),
    startValue: z.number().min(0).max(9),
    endValue: z.number().min(1).max(10),
    startLabel: z.string().max(50),
    endLabel: z.string().max(50),
    showLabels: z.boolean().default(true),
  })
  .refine((data) => data.endValue > data.startValue, {
    message: "End value must be greater than start value",
    path: ["endValue"],
  });

export const LinearScaleFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes,
  }),
  designerBtnELement: {
    icon: MdLinearScale,
    label: "Linear Scale",
  },
  designerComponent: DesignerComponent,
  formComponent: FormComponent,
  propertiesComponent: PropertiesComponent,

  validate: (
    formElement: FormElementInstance,
    currentValue: string
  ): boolean => {
    const element = formElement as CustomInstance;
    if (element.extraAttributes.required) {
      return currentValue.length > 0;
    }
    return true;
  },
};

type CustomInstance = FormElementInstance & {
  extraAttributes: typeof extraAttributes;
};

function DesignerComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance;
}) {
  const element = elementInstance as CustomInstance;
  const {
    label,
    required,
    helperText,
    startValue,
    endValue,
    startLabel,
    endLabel,
    showLabels,
  } = element.extraAttributes;
  const { setSelectedElement } = useDesigner();

  return (
    <div
      className="flex flex-col gap-2 w-full"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElement(elementInstance);
      }}
    >
      <Label>
        {label}
        {required && "*"}
      </Label>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          {showLabels && (
            <span className="text-sm text-muted-foreground">{startLabel}</span>
          )}
          <div className="flex-1" />
          {showLabels && (
            <span className="text-sm text-muted-foreground">{endLabel}</span>
          )}
        </div>
        <RadioGroup className="flex justify-between gap-2" disabled>
          {Array.from({ length: endValue - startValue + 1 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <RadioGroupItem
                value={String(startValue + i)}
                id={String(startValue + i)}
                className="h-8 w-8"
              />
              <span className="text-sm">{startValue + i}</span>
            </div>
          ))}
        </RadioGroup>
      </div>
      {helperText && (
        <p className="text-muted-foreground text-[0.8rem]">{helperText}</p>
      )}
    </div>
  );
}

function FormComponent({
  elementInstance,
  submitValue,
  isInvalid,
  defaultValue,
}: {
  elementInstance: FormElementInstance;
  submitValue?: SubmitFunction;
  isInvalid?: boolean;
  defaultValue?: string;
}) {
  const element = elementInstance as CustomInstance;
  const [value, setValue] = useState(defaultValue || "");
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(isInvalid === true);
  }, [isInvalid]);

  const {
    label,
    required,
    helperText,
    startValue,
    endValue,
    startLabel,
    endLabel,
    showLabels,
  } = element.extraAttributes;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label className={cn(error && "text-red-500")}>
        {label}
        {required && "*"}
      </Label>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          {showLabels && (
            <span className="text-sm text-muted-foreground">{startLabel}</span>
          )}
          <div className="flex-1" />
          {showLabels && (
            <span className="text-sm text-muted-foreground">{endLabel}</span>
          )}
        </div>
        <RadioGroup
          className="flex justify-between gap-2"
          value={value}
          onValueChange={(value) => {
            setValue(value);
            if (!submitValue) return;
            const valid = LinearScaleFormElement.validate(element, value);
            setError(!valid);
            if (!valid) return;
            submitValue(element.id, value);
          }}
        >
          {Array.from({ length: endValue - startValue + 1 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <RadioGroupItem
                value={String(startValue + i)}
                id={String(startValue + i)}
                className="h-8 w-8"
              />
              <span className="text-sm">{startValue + i}</span>
            </div>
          ))}
        </RadioGroup>
      </div>
      {helperText && (
        <p
          className={cn(
            "text-muted-foreground text-[0.8rem]",
            error && "text-red-500"
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

type propertiesFormSchemaType = z.infer<typeof propertiesSchema>;

function PropertiesComponent({
  elementInstance,
}: {
  elementInstance: FormElementInstance;
}) {
  const element = elementInstance as CustomInstance;
  const { updateElement } = useDesigner();
  const form = useForm<propertiesFormSchemaType>({
    resolver: zodResolver(propertiesSchema),
    mode: "onBlur",
    defaultValues: {
      label: element.extraAttributes.label,
      helperText: element.extraAttributes.helperText,
      required: element.extraAttributes.required,
      startValue: element.extraAttributes.startValue,
      endValue: element.extraAttributes.endValue,
      startLabel: element.extraAttributes.startLabel,
      endLabel: element.extraAttributes.endLabel,
      showLabels: element.extraAttributes.showLabels,
    },
  });

  useEffect(() => {
    form.reset(element.extraAttributes);
  }, [element, form]);

  function applyChanges(values: propertiesFormSchemaType) {
    updateElement(element.id, {
      ...element,
      extraAttributes: values,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(applyChanges)} className="space-y-3">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      form.handleSubmit(applyChanges)();
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                The label of the field. <br />
                It will be displayed above the field
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="helperText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Helper text</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      form.handleSubmit(applyChanges)();
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                The helper text of the field. <br />
                It will be displayed below the field.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="startValue"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Start Value</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    max={9}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={() => form.handleSubmit(applyChanges)()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endValue"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>End Value</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    max={10}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={() => form.handleSubmit(applyChanges)()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="startLabel"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Start Label</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        form.handleSubmit(applyChanges)();
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endLabel"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>End Label</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        form.handleSubmit(applyChanges)();
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="required"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Required</FormLabel>
                <FormDescription>
                  Make this field required in the form
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    form.handleSubmit(applyChanges)();
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="showLabels"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Show Labels</FormLabel>
                <FormDescription>Show start and end labels</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    form.handleSubmit(applyChanges)();
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
