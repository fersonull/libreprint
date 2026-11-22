import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/shared/components/navbar";
import { LoginForm } from "@/features/auth";

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Navbar currentPath="/staff/login" isStaff />

      <main className="flex flex-1 items-start justify-center px-4 pt-10 pb-16 sm:items-center sm:pt-0">
        <Suspense
          fallback={
            <div className="py-16 text-center text-sm text-zinc-500">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
