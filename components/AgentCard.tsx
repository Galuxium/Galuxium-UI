"use client";
import { motion } from "framer-motion";
import { Progress } from "@/components/Progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { AgentData } from "@/lib/types";

export default function AgentCard({ agent }: { agent: AgentData }) {
const colors: Record<string, string> = {
  setup: "from-gray-900 to-slate-600",
  classification: "from-gray-800 to-gray-700",
  BizMind: "from-blue-800 to-violet-700",
  BrandPulse: "from-amber-600 to-orange-800",
  CodeWeaver: "from-indigo-700 to-indigo-700",
  LaunchLens: "from-emerald-800 to-emerald-600",
};


  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white/10 mt-5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="">
          <CardTitle className="flex items-center justify-between">
            <span className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${colors[agent.phase]}`}>
               {agent.phase === "setup" && "Initializing Agents"}
                {agent.phase === "classification" && "Analyzing Idea"}
              {agent.phase === "BizMind" && "🧠 BizMind Agent — Market Validation"}
              {agent.phase === "BrandPulse" && "🎨 BrandPulse Agent — Brand Intelligence"}
              {agent.phase === "CodeWeaver" && "🧱 CodeWeaver Agent — MVP Architect"}
              {agent.phase === "LaunchLens" && "🚀 LaunchLens Agent — GTM Strategy"}
            </span>
            {agent.file_url || (
              <a
                href={agent.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 hover:scale-[1.05] transition"
              >
                <FileText size={16} /> Report
              </a>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-7">
          <Progress value={agent.progress || 0} />
          <p className="text-black text-lg mt-3 font-semibold">Phase: {agent.sub_phase || "—"}</p>
          <div className=" text-md font-semibold rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {agent.messages?.slice(-5).join("\n")}
          </div>
          {agent.output && (
            <pre className="bg-black/70 text-green-300 text-xs rounded-xl p-3 overflow-x-auto">
              {JSON.stringify(agent.output, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
