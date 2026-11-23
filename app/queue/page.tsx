import { connection } from "next/server";
import { Navbar } from "@/shared/components/navbar";
import { QueueBoard } from "@/features/ticket";
import { listPublicQueue } from "@/features/staff/server";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection(); // sqlite is synchronous; without this the board is frozen at build time
  const raw = (await searchParams).page;
  const page = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? ""), 10);
  const { waiting, ready, ...paging } = listPublicQueue({ page: page > 0 ? page : 1 });

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Navbar currentPath="/queue" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-12 sm:px-6 sm:pt-12">
        <QueueBoard waiting={waiting} ready={ready} paging={paging} />
      </main>
    </div>
  );
}
