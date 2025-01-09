import React from "react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ProfileStepOne = ({ formData, error, handleTypeSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-8"
    >
      <h2 className="text-3xl font-bold mb-8 text-center">Choose Your Path</h2>
      {error?.type && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.type}</AlertDescription>
        </Alert>
      )}
      <RadioGroup
        value={formData.type}
        onValueChange={handleTypeSelect}
        className="space-y-6 w-full max-w-md"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center space-x-2 p-6 border-2 rounded-xl hover:border-primary cursor-pointer bg-card transition-colors duration-200"
        >
          <RadioGroupItem value="student" id="student" />
          <Label htmlFor="student" className="flex-1 cursor-pointer">
            <div className="font-semibold text-xl">Student</div>
            <div className="text-sm text-muted-foreground mt-2">
              Join exciting projects and collaborate with peers to build your
              portfolio
            </div>
          </Label>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center space-x-2 p-6 border-2 rounded-xl hover:border-primary cursor-pointer bg-card transition-colors duration-200"
        >
          <RadioGroupItem value="mentor" id="mentor" />
          <Label htmlFor="mentor" className="flex-1 cursor-pointer">
            <div className="font-semibold text-xl">Mentor</div>
            <div className="text-sm text-muted-foreground mt-2">
              Share your expertise and guide the next generation of developers
            </div>
          </Label>
        </motion.div>
      </RadioGroup>
    </motion.div>
  );
};

export default ProfileStepOne;
