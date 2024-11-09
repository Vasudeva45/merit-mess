"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImSpinner2 } from "react-icons/im";
import { BsFileEarmarkPlus, BsRobot } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, Wand2 } from "lucide-react";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { CreateForm } from "@/actions/form";

const STUDY_DOMAINS = [
  "Computer Science (CSE)",
  "Electronics (ECE)",
  "Electrical (EE)",
  "Mechanical",
  "Civil",
  "Information Technology (IT)",
  "Other",
];

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
};

const CreateFormBtn = () => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      domain: "",
      specialization: "",
    },
  });

  const watchDomain = form.watch("domain");
  const watchName = form.watch("name");

  const generateDescription = async () => {
    if (!watchName || !watchDomain) {
      toast.error("Please enter project name and select domain first", {
        icon: <ExclamationTriangleIcon />,
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Here you would typically make an API call to your backend that interfaces with Google's Generative AI
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: watchName,
          domain: watchDomain,
          specialization: form.watch("specialization"),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate description");

      const data = await response.json();
      form.setValue("description", data.description);

      toast.success("Description generated!", {
        icon: <CheckIcon />,
      });
    } catch (error) {
      toast.error("Failed to generate description", {
        icon: <ExclamationTriangleIcon />,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (values) => {
    try {
      const formId = await CreateForm(values);
      toast.success("Form Created Successfully", {
        description: "Thank you for your submission!",
        icon: <CheckIcon />,
      });
      router.push(`/builder/${formId}`);
    } catch (error) {
      toast.error("Something went wrong.", {
        description: "Please try again later!",
        icon: <ExclamationTriangleIcon />,
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
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
                        SPECIALIZATIONS[watchDomain].map((specialization) => (
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
                  <FormLabel className="flex items-center justify-between">
                    Description
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={isGenerating || !watchName || !watchDomain}
                      className="flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <ImSpinner2 className="animate-spin h-4 w-4" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      Generate with AI
                    </Button>
                  </FormLabel>
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
            onClick={form.handleSubmit(onSubmit)}
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
};

export default CreateFormBtn;
