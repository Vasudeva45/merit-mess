import { motion } from "framer-motion";

export const StatsSection = () => {
  const stats = [
    { label: "Active Projects", value: "500+" },
    { label: "Community Members", value: "10,000+" },
    { label: "Success Stories", value: "250+" },
    { label: "Countries", value: "30+" },
  ];

  return (
    <section className="bg-primary/5 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </h3>
              <p className="text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};