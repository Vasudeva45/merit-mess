import { SignupButton } from "@/components/signup-button";
import { motion } from "framer-motion";

export const CTASection = () => {
  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Make a Difference?
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join our community today and start creating meaningful impact
        </p>
        <SignupButton />
      </motion.div>
    </section>
  );
};