"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { FormElementInstance, FormElements } from "./FormElements";
import {
  CheckIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { SubmitForm } from "@/actions/form";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { CheckDuplicateSubmission } from "@/actions/form";

function FormSubmitComponent({
  formUrl,
  content,
}: Readonly<{
  content: FormElementInstance[];
  formUrl: string;
}>) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const formValues = useRef<{ [key: string]: string }>({});
  const formErrors = useRef<{ [key: string]: boolean }>({});
  const [renderKey, setRenderKey] = useState(new Date().getTime());
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const [duplicateSubmission, setDuplicateSubmission] = useState<{
    hasDuplicate: boolean;
    submissionDate: Date | null;
  } | null>(null);

  useEffect(() => {
    const checkDuplicate = async () => {
      if (user?.sub) {
        const result = await CheckDuplicateSubmission(formUrl, user.sub);
        setDuplicateSubmission(result);
      }
    };

    if (!isLoading && user) {
      checkDuplicate();
    }
  }, [user, isLoading, formUrl]);

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if user is not authenticated
      router.push(
        "/api/auth/login?returnTo=" +
          encodeURIComponent(window.location.pathname)
      );
    }
  }, [user, isLoading, router]);

  // Enhanced validation with more detailed error tracking
  const validateForm: () => { isValid: boolean; errorCount: number } =
    useCallback(() => {
      formErrors.current = {};
      let isValid = true;
      let errorCount = 0;

      for (const field of content) {
        const actualValue = formValues.current[field.id] || "";
        const valid = FormElements[field.type].validate(field, actualValue);

        if (!valid) {
          formErrors.current[field.id] = true;
          isValid = false;
          errorCount++;
        }
      }

      if (!isValid) {
        setRenderKey(new Date().getTime());
        toast.error("Form Validation Error", {
          description: `${errorCount} field${
            errorCount !== 1 ? "s" : ""
          } require attention.`,
          icon: <ExclamationTriangleIcon />,
        });
      }

      return { isValid, errorCount };
    }, [content]);

  const submitValue = useCallback((key: string, value: string) => {
    formValues.current[key] = value;
  }, []);

  const submitForm = async () => {
    if (!user) {
      toast.error("Please sign in to submit the form", {
        description: "You will be redirected to the login page.",
        icon: <ExclamationTriangleIcon />,
      });
      router.push(
        "/api/auth/login?returnTo=" +
          encodeURIComponent(window.location.pathname)
      );
      return;
    }

    formErrors.current = {};
    setSubmitError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    const { isValid, errorCount } = validateForm();

    if (!isValid) {
      clearInterval(progressInterval);
      setProgress(0);
      return;
    }

    try {
      const submissionData = {
        ...formValues.current,
        userId: user.sub,
        userEmail: user.email,
        userName: user.name,
      };

      const JsonContent = JSON.stringify(submissionData);
      await SubmitForm(formUrl, JsonContent);

      clearInterval(progressInterval);
      setProgress(100);

      toast.success("Form Submitted Successfully", {
        description: "Thank you for your submission!",
        icon: <CheckIcon />,
      });

      setTimeout(() => {
        setSubmitted(true);
      }, 500);
    } catch (error) {
      let errorMessage = "Something went wrong while submitting the form.";

      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        errorMessage = "Please sign in to submit the form.";
        router.push(
          "/api/auth/login?returnTo=" +
            encodeURIComponent(window.location.pathname)
        );
      }

      clearInterval(progressInterval);
      setProgress(0);

      setSubmitError(errorMessage);
      toast.error(errorMessage, {
        description: "Please try again or contact support.",
        icon: <ExclamationTriangleIcon />,
      });
      console.error(error);
    }
  };

  const resetForm = () => {
    formValues.current = {};
    formErrors.current = {};
    setRenderKey(new Date().getTime());
    setSubmitted(false);
    setProgress(0);
  };

  const closeWindow = () => {
    window.close();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-md mx-auto shadow-2xl">
          <CardContent className="flex items-center justify-center p-6">
            <ReloadIcon className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (duplicateSubmission?.hasDuplicate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md mx-auto shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                  Previous Submission Found
                </CardTitle>
                <CardDescription>
                  You have already submitted this form on{" "}
                  {duplicateSubmission.submissionDate?.toLocaleDateString()} at{" "}
                  {duplicateSubmission.submissionDate?.toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <AlertDialog>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button className="w-full" variant="outline">
                              <InfoCircledIcon className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View your previous submission</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Previous Submission</AlertDialogTitle>
                        <AlertDialogDescription>
                          <div className="bg-muted p-4 rounded-md">
                            <p className="font-semibold">Submission Details</p>
                            <p className="text-sm text-muted-foreground">
                              Date:{" "}
                              {duplicateSubmission.submissionDate?.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Each user is allowed only one submission for this
                              form. If you need to update your submission,
                              please contact the form administrator.
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={closeWindow}
                          variant="secondary"
                          className="w-full"
                        >
                          <Cross2Icon className="mr-2 h-4 w-4" />
                          Close
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Close submission window</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (submitted) {
    return (
      <TooltipProvider>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-full max-w-md mx-auto shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <CheckIcon className="h-8 w-8 text-green-500" />
                    Submission Successful
                  </CardTitle>
                  <CardDescription>
                    Your form has been submitted successfully.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button className="w-full" variant="outline">
                              <InfoCircledIcon className="mr-2 h-4 w-4" />
                              Details
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View submission details</p>
                        </TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Submission Details
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            <div className="bg-muted p-4 rounded-md">
                              <div className="text-center">
                                <p className="font-semibold">
                                  Submission Confirmed
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Submission Time: {new Date().toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Close</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={resetForm}
                          variant="secondary"
                          className="w-full"
                        >
                          Submit Another
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reset form for new submission</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={closeWindow}
                          variant="destructive"
                          className="w-full"
                        >
                          <Cross2Icon className="mr-2 h-4 w-4" />
                          Close
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Close submission window</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col">
        {progress > 0 && (
          <Progress
            value={progress}
            className="absolute top-0 left-0 w-full z-50"
          />
        )}
        <div className="flex-1 overflow-hidden flex flex-col items-center p-4">
          <motion.div
            key={renderKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xl"
          >
            <Card className="shadow-2xl mt-4">
              <CardHeader className="sticky top-0 bg-background z-10">
                <CardTitle className="text-2xl">Form Submission</CardTitle>
                <CardDescription>
                  Please fill out all required fields carefully.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="space-y-6">
                  {content.map((element) => {
                    const FormElement =
                      FormElements[element.type].formComponent;
                    return (
                      <motion.div
                        key={element.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FormElement
                          elementInstance={element}
                          submitValue={submitValue}
                          isInvalid={formErrors.current[element.id]}
                          defaultValue={formValues.current[element.id]}
                        />
                      </motion.div>
                    );
                  })}
                </div>

                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center text-destructive gap-2 bg-destructive/10 p-3 rounded-md"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <p className="text-sm">{submitError}</p>
                  </motion.div>
                )}

                <div className="sticky bottom-0 bg-background pt-6 pb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => startTransition(submitForm)}
                        disabled={pending}
                      >
                        {pending ? (
                          <>
                            Submitting
                            <ReloadIcon className="ml-2 h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          "Submit Form"
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to submit your form</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default FormSubmitComponent;
