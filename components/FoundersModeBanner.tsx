"use client";
import { motion } from "framer-motion";
import {  Brain, Zap } from "lucide-react";

export default function FoundersModeBanner({ idea }: { idea: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-[18vw] bg-gradient-to-r from-[#2000c1] to-[#2e147e] text-white rounded-2xl px-4 py-2 mb-3 shadow-lg"
    >
         <h3 className="font-bold text-md">Co-Founders Mode Activated</h3>
      <div className="flex items-center gap-3">
        
       
         
          <p className="text-xs font-semibold opacity-90">{idea}</p>
       
        <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-white animate-pulse" />
        <Zap className="w-5 h-5 text-yellow-200" />
      </div>
      </div>
      
    </motion.div>
  );
}
