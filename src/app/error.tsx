"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-fog px-4 py-8 text-ink">
      <div className="mx-auto max-w-3xl">
        <Panel>
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-steel">Planner error</p>
              <h1 className="mt-2 text-3xl font-bold">The workflow stopped</h1>
            </div>
            <Alert tone="danger">
              {error.message || "An unexpected planner error occurred."}
            </Alert>
            <Button onClick={reset}>Try again</Button>
          </div>
        </Panel>
      </div>
    </main>
  );
}
