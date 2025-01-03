// components/ui/custom-toast.tsx
import React, { useEffect } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export type ToastMessage = {
  title: string;
  details: string;
};

export type ToastProps = {
  message: ToastMessage;
  type: "success" | "error";
  onClose: () => void;
};

const CustomToast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
      fixed top-4 right-4 z-50 
      min-w-[320px] max-w-md 
      rounded-lg shadow-lg 
      transform transition-all duration-300 ease-in-out
      ${
        type === "success"
          ? "bg-green-50 border-l-4 border-green-500"
          : "bg-red-50 border-l-4 border-red-500"
      }
    `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="ml-3 w-full">
            <div
              className={`text-sm font-medium ${
                type === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {message.title}
            </div>
            <div
              className={`mt-1 text-xs ${
                type === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              <div className="font-mono">{message.details}</div>
              <div className="mt-1 text-xs opacity-75">
                {new Date().toLocaleTimeString()} UTC
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`ml-4 inline-flex ${
              type === "success"
                ? "text-green-500 hover:text-green-600"
                : "text-red-500 hover:text-red-600"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomToast;
