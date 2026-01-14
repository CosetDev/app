import type React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function SummaryTile({
    title,
    value,
    subtle,
    loading,
}: {
    title: string;
    value: React.ReactNode;
    subtle?: boolean;
    loading?: boolean;
}) {
    return (
        <div className="flex-1 flex flex-col gap-1 rounded-lg border bg-white/70 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
            <p
                className={cn(
                    "mt-1 text-sm font-semibold text-gray-900",
                    subtle && "font-medium text-gray-700",
                )}
            >
                {loading ? <Loader2 className="size-4 animate-spin text-gray-500" /> : value}
            </p>
        </div>
    );
}

