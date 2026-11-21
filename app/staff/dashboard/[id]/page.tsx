import Link from "next/link";
import { StaffSidebarLayout } from "@/components/staff-sidebar";
import { StaffTicketDetail } from "@/components/staff-ticket-detail";
import { getDb, Ticket, PrintFile } from "@/lib/db";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default async function StaffTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const ticket = db
    .prepare("SELECT * FROM tickets WHERE id = ? OR UPPER(ticket_code) = UPPER(?)")
    .get(id, id) as Ticket | undefined;

  if (!ticket) {
    return (
      <StaffSidebarLayout>
        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xs">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Ticket Not Found
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Could not locate a print ticket with ID &ldquo;{id}&rdquo;.
            </p>
            <Link
              href="/staff/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Desk</span>
            </Link>
          </div>
        </div>
      </StaffSidebarLayout>
    );
  }

  const files = db
    .prepare("SELECT * FROM print_files WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticket.id) as PrintFile[];

  return (
    <StaffSidebarLayout>
      <StaffTicketDetail initialTicket={ticket} initialFiles={files} />
    </StaffSidebarLayout>
  );
}
