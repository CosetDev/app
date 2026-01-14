"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";

import type { EarningsPoint } from "./types";

export function StatsPanel({
    earningsSeries,
    loading,
}: {
    earningsSeries: EarningsPoint[];
    loading: boolean;
}) {
    const earningsConfig = useMemo(
        () => ({
            totalPaid: { label: "Total paid", color: "#0ea5e9" },
            providerEarning: { label: "Provider", color: "#10b981" },
            gasFee: { label: "Gas", color: "#f97316" },
            platformFee: { label: "Platform", color: "#8b5cf6" },
        }),
        [],
    );

    return (
        <div className="flex w-full">
            <Card className="p-4 flex-1">
                <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-base">Earnings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center gap-2 p-4 text-sm text-gray-600">
                            <Loader2 className="size-4 animate-spin" />
                        </div>
                    ) : earningsSeries.length === 0 ? (
                        <p className="text-sm text-gray-600">No earnings data.</p>
                    ) : (
                        <ChartContainer config={earningsConfig} className="h-[320px]">
                            <BarChart data={earningsSeries} margin={{ left: 8, right: 8, top: 12, bottom: 8 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} width={28} />
                                <Tooltip content={<ChartTooltipContent labelKey="date" />} />
                                <Legend content={<ChartLegendContent />} />
                                <Bar
                                    dataKey="totalPaid"
                                    stackId="a"
                                    fill="var(--color-totalPaid)"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="providerEarning"
                                    stackId="a"
                                    fill="var(--color-providerEarning)"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="gasFee"
                                    stackId="a"
                                    fill="var(--color-gasFee)"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="platformFee"
                                    stackId="a"
                                    fill="var(--color-platformFee)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

