import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: "coral" | "gold" | "sky" | "pink";
  variant?: "default" | "glow" | "holographic" | "cyber" | "frosted" | "neon" | "meshGradient" | "orbitalGlow" | "neonBorder" | "aurora";
}

const glowColors = {
  coral: "hover:shadow-[0_20px_60px_rgba(241,91,66,0.25)] hover:border-wap-coral/40",
  gold: "hover:shadow-[0_20px_60px_rgba(255,211,114,0.25)] hover:border-wap-gold/40",
  sky: "hover:shadow-[0_20px_60px_rgba(124,170,220,0.25)] hover:border-wap-sky/40",
  pink: "hover:shadow-[0_20px_60px_rgba(244,156,196,0.25)] hover:border-wap-pink/40",
};

const variants = {
  default: "glass-card",
  glow: "card-glow",
  holographic: "card-holographic",
  cyber: "card-cyber",
  frosted: "card-frosted",
  neon: "glass-card glow-ring",
  meshGradient: "glass-card mesh-gradient-coral",
  orbitalGlow: "glass-card card-orbital-glow",
  neonBorder: "glass-card neon-border-gold",
  aurora: "glass-card aurora-card",
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hoverEffect = false, glowColor = "coral", variant = "default", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          variants[variant],
          "rounded-2xl p-6 transition-all duration-500",
          hoverEffect && `hover:-translate-y-3 cursor-pointer ${glowColors[glowColor]}`,
          className
        )}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={hoverEffect ? { scale: 1.03, rotateX: 2, rotateY: -2 } : undefined}
        style={{ transformStyle: "preserve-3d" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
