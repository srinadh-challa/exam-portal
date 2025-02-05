"use client"; // Required for Next.js App Router

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DraggableProps {
  children: ReactNode;
  className?: string; // Optional for styling
}

const Draggable: React.FC<DraggableProps> = ({ children, className = "" }) => {
  return (
    <motion.div
      drag
      dragConstraints={false} // Allows unrestricted movement
      dragElastic={0.5} // Adds smoothness
      dragMomentum={false} // Prevents unwanted movement after release
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Draggable;
