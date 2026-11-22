import { getOverview } from "@/features/staff/queries";
import { Overview } from "@/features/staff/dashboard/overview";

export default function StaffOverviewPage() {
  return <Overview data={getOverview()} />;
}
