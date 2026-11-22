import { getOverview } from "@/features/staff/server";
import { Overview } from "@/features/staff";

export default function StaffOverviewPage() {
  return <Overview data={getOverview()} />;
}
