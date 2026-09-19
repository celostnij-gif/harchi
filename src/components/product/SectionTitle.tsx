"use client";

import { motion } from "framer-motion";

/** Спільний заголовок секції сторінки товару (reveal-анімація як на головній) */
export default function SectionTitle({
  title,
  label,
  align = "center",
}: {
  title: string;
  label?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className={align === "center" ? "text-center" : "text-left"}
    >
      {label && (
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
          {label}
        </span>
      )}
      <h2 className="font-display mt-3 text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
        <span className="text-gradient-flame">{title}</span>
      </h2>
    </motion.div>
  );
}
