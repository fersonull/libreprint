import { connection } from "next/server";
import { Navbar } from "@/shared/components/navbar";
import { QueueBoard } from "@/features/ticket";
import { listPublicQueue } from "@/features/staff/server";

export default async function QueuePage() {
  await connection(); // sqlite is synchronous; without this the board is frozen at build time
  const { waiting, ready } = listPublicQueue();

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Navbar currentPath="/queue" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-12 sm:px-6 sm:pt-12">
        <QueueBoard waiting={waiting} ready={ready} />
      </main>
    </div>
  );
}
