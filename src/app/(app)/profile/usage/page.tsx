"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, Legend } from "recharts";

import { Card } from "@/components/ui/card";
import { fetchWithWallet } from "@/lib/web3";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";

type Point = {
    date: string;
    usage: number;
};

export default function UsagePage() {
    return null;

    const [series, setSeries] = useState<Point[]>([]);
    const [loading, setLoading] = useState(false);

    const chartConfig = useMemo(
        () => ({
            usage: { label: "Usage", color: "#3b82f6" },
        }),
        [],
    );

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await fetchWithWallet("/api/profile/usage");
                const payload = await response.json();
                console.log(payload);
                if (!response.ok) throw new Error(payload?.message || "Failed to load usage");
                const mapped = (payload?.usageSeries as { date: string; usage: number }[])?.map(
                    p => ({
                        date: p.date,
                        usage: p.usage ?? 0,
                    }),
                );
                setSeries(mapped ?? []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 md:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-gray-900">Usage</h1>
                <p className="text-sm text-gray-600">Daily request counts.</p>
            </header>

            <Card className="p-4">
                <ChartContainer config={chartConfig} className="h-[340px]">
                    <LineChart data={series} margin={{ left: 8, right: 8, top: 12, bottom: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={50} />
                        <Tooltip content={<ChartTooltipContent labelKey="date" />} />
                        <Legend content={<ChartLegendContent />} />
                        <Line
                            type="monotone"
                            dataKey="usage"
                            stroke="var(--color-usage)"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: "var(--color-usage)" }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="earnings"
                            stroke="var(--color-earnings)"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: "var(--color-earnings)" }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ChartContainer>
            </Card>
        </div>
    );
}
