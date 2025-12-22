"use client";

import { useEffect, useState } from "react";

import NodeTable from "@/components/Node/Table";
import NodeHistoryCharts from "@/components/Node/Chart";
import type { ApiResponse } from "@/components/Node/Chart";

export default function Node() {
    const [data, setData] = useState<ApiResponse | null>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/node/health");
            setData(await res.json());
        })();
    }, []);

    if (!data) return null;

    const currentRows = Object.entries(data.data).map(([node, info]) => ({
        node,
        status: info.status,
        ts: data.ts,
    }));

    const historyRows = data.history.flatMap(entry =>
        Object.entries(entry.data).map(([node, info]) => ({
            node,
            status: info.status,
            ts: entry.ts,
        })),
    );

    return (
        <div id="node" className="p-8 space-y-10">
            <NodeTable title="Current Node Status" rows={currentRows} />
            <NodeHistoryCharts data={data} />
            <NodeTable title="History" rows={historyRows} />
        </div>
    );
}
