"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ImSpinner2 } from "react-icons/im";
import { BsFileEarmarkPlus } from "react-icons/bs";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CreateForm } from "@/actions/form";
import { formschema } from "@/schemas/form";
import { useRouter } from "next/navigation";

const STUDY_DOMAINS = [
  "Computer Science (CSE)",
  "Electronics (ECE)",
  "Electrical (EE)",
  "Mechanical",
  "Civil",
  "Information Technology (IT)",
  "Other",
] as const;

const SPECIALIZATIONS = {
  "Computer Science (CSE)": [
    "Web Development",
    "Mobile App Development",
    "Machine Learning/AI",
    "Cloud Computing",
    "Cybersecurity",
    "DevOps",
    "Blockchain",
    "Other",
  ],
  "Electronics (ECE)": [
    "VLSI Design",
    "Embedded Systems",
    "Signal Processing",
    "Communication Systems",
    "IoT",
    "Other",
  ],
  "Electrical (EE)": [
    "Power Systems",
    "Control Systems",
    "Power Electronics",
    "Renewable Energy",
    "Other",
  ],
  Mechanical: [
    "CAD/CAM",
    "Robotics",
    "Thermal Engineering",
    "Manufacturing",
    "Other",
  ],
  Civil: [
    "Structural Engineering",
    "Transportation",
    "Environmental",
    "Construction Management",
    "Other",
  ],
  "Information Technology (IT)": [
    "Web Development",
    "Database Management",
    "Network Security",
    "Cloud Computing",
    "Other",
  ],
  Other: ["Other"],
} as const;

type formschemaType = z.infer<typeof formschema>;

function CreateFormBtn() {
  const router = useRouter();
  const form = useForm<formschemaType>({
    resolver: zodResolver(formschema),
    defaultValues: {
      name: "",
      description: "",
      domain: "",
      specialization: "",
    },
  });

  const watchDomain = form.watch("domain");

  async function onSubmit(values: formschemaType) {
    try {
      const formId = await CreateForm(values);
      alert("Form created successfully!");
      router.push(`/builder/${formId}`);
    } catch (error) {
      alert("Something went wrong. Please try again later.");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          className="group border border-primary/20 h-[190px] items-center justify-center flex flex-col hover:border-primary hover:cursor-pointer border-dashed gap-4"
        >
          <BsFileEarmarkPlus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
          <p className="font-bold text-xl text-muted-foreground group-hover:text-primary">
            Create new form
          </p>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create form</DialogTitle>
          <DialogDescription>
            Create a new form to start finding your mates
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Domain</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your domain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STUDY_DOMAINS.map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          {domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!watchDomain}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {watchDomain &&
                        SPECIALIZATIONS[
                          watchDomain as keyof typeof SPECIALIZATIONS
                        ].map((specialization) => (
                          <SelectItem
                            key={specialization}
                            value={specialization}
                          >
                            {specialization}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => {
              form.handleSubmit(onSubmit)();
            }}
            disabled={form.formState.isSubmitting}
            className="w-full mt-4"
          >
            {!form.formState.isSubmitting && <span>Save</span>}
            {form.formState.isSubmitting && (
              <ImSpinner2 className="animate-spin" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateFormBtn;
