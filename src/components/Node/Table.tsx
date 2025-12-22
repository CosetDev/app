"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn, relativeTime } from "@/lib/utils";

type HealthStatus = "healthy" | "unhealthy";

type Row = {
    node: string;
    status: HealthStatus;
    ts: number;
};

type Props = {
    title: string;
    rows: Row[];
};

export default function NodeTable({ title, rows }: Props) {
    return (
        <div>
            <h2 className="text-lg font-semibold mb-1">{title}</h2>

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Node</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Checked At</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y">
                        {rows.map(row => (
                            <TableRow key={`${row.node}-${row.ts}`}>
                                <TableCell className="font-mono">{row.node}</TableCell>
                                <TableCell>
                                    <span
                                        className={cn(
                                            row.status === "healthy"
                                                ? "bg-green-600"
                                                : "bg-red-500",
                                            "px-1 py-0.5 rounded text-white font-medium w-max",
                                        )}
                                    >
                                        {row.status === "healthy" ? "UP" : "DOWN"}
                                    </span>
                                </TableCell>
                                <TableCell>{relativeTime(row.ts)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
