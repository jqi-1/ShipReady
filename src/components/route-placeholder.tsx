"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

interface RoutePlaceholderProps {
  title: string;
  summary: string;
}

export function RoutePlaceholder({ title, summary }: RoutePlaceholderProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-fog px-4 py-8 text-ink">
      <div className="mx-auto max-w-3xl">
        <Panel>
          <div className="grid gap-4">
            <Button variant="secondary" onClick={() => router.push("/")}>
              <ArrowLeft size={16} aria-hidden="true" />
              Workflow
            </Button>
            <div>
              <p className="text-sm font-semibold uppercase text-steel">V0 placeholder</p>
              <h1 className="mt-2 text-3xl font-bold">{title}</h1>
              <p className="mt-3 text-steel">{summary}</p>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
