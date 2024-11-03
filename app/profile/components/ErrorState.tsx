'use client';

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: Error & { errors?: Record<string, string[]> };
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  const isValidationError = error.name === "ValidationError" && error.errors;

  return (
    <Alert variant="destructive" className="max-w-2xl mx-auto">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">
        {isValidationError ? "Validation Error" : "Error Loading Profile"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {isValidationError ? (
          <div className="space-y-2">
            {Object.entries(error.errors).map(([field, messages]) => (
              <div key={field} className="bg-red-50 p-2 rounded">
                <strong className="capitalize">
                  {field.replace("_", " ")}:
                </strong>
                <ul className="list-disc ml-4">
                  {messages.map((message, idx) => (
                    <li key={idx}>{message}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-700">
            {error.message || "There was an error loading your profile."}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-4 hover:bg-red-50"
        >
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
};