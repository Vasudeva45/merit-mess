import { motion } from "framer-motion";
import { LoginButton } from "@/components/login-button";
import { SignupButton } from "@/components/signup-button";

export const HeroSection = () => {
  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background z-0" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 text-center px-4 max-w-5xl"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
          Project Launch
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Empowering the next generation of innovators to create meaningful change
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <SignupButton />
          <LoginButton />
        </div>
      </motion.div>
    </div>
  );
};