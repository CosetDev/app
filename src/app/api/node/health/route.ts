import { nodes } from "@/lib/nodes";
import { NextResponse } from "next/server";

type HealthStatus = "healthy" | "unhealthy";

let latest: {
    ts: number | null;
    data: Record<string, { status: HealthStatus }>;
} = {
    ts: null,
    data: {},
};

const history: (typeof latest)[] = [];
const CACHE_DURATION = 30 * 1000; // 30 seconds
const LIST_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET() {
    if (latest.ts && Date.now() - latest.ts < CACHE_DURATION) {
        return NextResponse.json({ ...latest, history });
    }

    const responses = await Promise.all(
        nodes.map(node =>
            fetch(`${node}/health`, {
                method: "GET",
                cache: "no-store",
            })
                .then(res => res.ok)
                .catch(() => false),
        ),
    );

    const status: Record<string, { status: HealthStatus }> = {};

    for (let i = 0; i < nodes.length; i++) {
        status[nodes[i]] = {
            status: responses[i] ? "healthy" : "unhealthy",
        };
    }

    latest = {
        ts: Date.now(),
        data: status,
    };

    if (history.length === 0 || latest.ts! - history[0].ts! > LIST_CACHE_DURATION) {
        history.unshift(latest);
        if (history.length > 100) history.pop();
    }

    return NextResponse.json({ ...latest, history });
}
