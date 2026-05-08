import { PlannerWorkflow } from "@/components/planner-workflow";
import { getRuntimeConfigStatus } from "@/lib/runtime-config";

export default function Home() {
  return <PlannerWorkflow configStatus={getRuntimeConfigStatus()} />;
}
