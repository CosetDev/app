"use client";

import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import { fetchWithWallet } from "@/lib/web3";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";

type Point = {
    date: string;
    totalPaid: number;
    providerEarning: number;
    gasFee: number;
    platformFee: number;
};

type OracleSeries = {
    oracle: string;
    name: string;
    points: { date: string; providerEarning: number }[];
};

export default function Earnings() {
    const { ready } = usePrivy();

    const [series, setSeries] = useState<Point[]>([]);
    const [oracleSeries, setOracleSeries] = useState<OracleSeries[]>([]);
    const [loading, setLoading] = useState(false);

    const chartConfig = useMemo(
        () => ({
            totalPaid: { label: "Total paid", color: "#0ea5e9" },
            providerEarning: { label: "Provider", color: "#10b981" },
            gasFee: { label: "Gas", color: "#f97316" },
            platformFee: { label: "Platform", color: "#8b5cf6" },
        }),
        [],
    );

    useEffect(() => {
        if (!ready) return;

        const load = async () => {
            setLoading(true);
            try {
                const response = await fetchWithWallet("/api/profile/earnings");
                const payload = await response.json();
                console.log(payload);

                if (!response.ok) toast.error(payload?.message || "Failed to load earnings");

                const mapped = (
                    payload?.earningsSeries as {
                        date: string;
                        totalPaid: number;
                        providerEarning: number;
                        gasFee: number;
                        platformFee: number;
                    }[]
                )?.map(p => ({
                    date: p.date,
                    totalPaid: p.totalPaid ?? 0,
                    providerEarning: p.providerEarning ?? 0,
                    gasFee: p.gasFee ?? 0,
                    platformFee: p.platformFee ?? 0,
                }));

                setSeries(mapped ?? []);
                setOracleSeries((payload?.oracleSeries as OracleSeries[]) ?? []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [ready]);

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 md:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-gray-900">Earnings</h1>
                <p className="text-sm text-gray-600">Daily totals from payments.</p>
            </header>

            <Card className="p-4">
                <ChartContainer config={chartConfig} className="h-[340px]">
                    <BarChart data={series} margin={{ left: 8, right: 8, top: 12, bottom: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={20} />
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
            </Card>

            <Card className="p-4">
                <div className="mb-2 text-sm font-semibold text-gray-900">Per-oracle earnings</div>
                <ChartContainer config={lineConfigFromSeries(oracleSeries)} className="h-[340px]">
                    <LineChart data={buildLineData(oracleSeries)} margin={{ left: 8, right: 8, top: 12, bottom: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={60} />
                        <Tooltip content={<ChartTooltipContent labelKey="date" />} />
                        <Legend content={<ChartLegendContent />} />
                        {oracleSeries.map((item, idx) => (
                            <Line
                                key={item.oracle}
                                type="monotone"
                                dataKey={item.oracle}
                                stroke={`var(--color-${item.oracle})`}
                                strokeWidth={2}
                                dot={{ r: 3, strokeWidth: 1, fill: `var(--color-${item.oracle})` }}
                                activeDot={{ r: 5 }}
                            />
                        ))}
                    </LineChart>
                </ChartContainer>
            </Card>
        </div>
    );
}

function lineConfigFromSeries(series: OracleSeries[]) {
    const palette = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#6366f1"];
    return series.reduce<Record<string, { label: string; color: string }>>((acc, item, idx) => {
        acc[item.oracle] = { label: item.name, color: palette[idx % palette.length] };
        return acc;
    }, {});
}

function buildLineData(series: OracleSeries[]) {
    const dateSet = new Set<string>();
    series.forEach(item => item.points.forEach(p => dateSet.add(p.date)));
    const dates = Array.from(dateSet).sort();
    return dates.map(date => {
        const row: Record<string, string | number> = { date };
        series.forEach(item => {
            const point = item.points.find(p => p.date === date);
            row[item.oracle] = point?.providerEarning ?? 0;
        });
        return row;
    });
}
