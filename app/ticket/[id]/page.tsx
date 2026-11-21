import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { TicketTracker } from "@/components/ticket-tracker";
import { getDb, Ticket, PrintFile } from "@/lib/db";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default async function TicketPage({
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
      <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Navbar currentPath="/ticket" />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xs">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Ticket Not Found</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Could not find a print ticket matching &ldquo;{id}&rdquo;.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const files = db
    .prepare("SELECT * FROM print_files WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticket.id) as PrintFile[];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar currentPath="/ticket" />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-10">
        <div className="mb-4">
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Submit another document</span>
          </Link>
        </div>

        <TicketTracker initialTicket={ticket} initialFiles={files} />
      </main>

      <footer className="py-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center text-xs text-zinc-400">
        <p>libreprint • Paper Claim Ticket</p>
      </footer>
    </div>
  );
}
