import { Activity } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type HealthStatus = "healthy" | "unhealthy";

export type ApiResponse = {
    ts: number;
    data: Record<string, { status: HealthStatus }>;
    history: {
        ts: number;
        data: Record<string, { status: HealthStatus }>;
    }[];
};

type ChartRow = {
    time: string;
    [node: string]: string | number;
};

const HEALTHY_VALUE = 1;
const UNHEALTHY_VALUE = 0.05;

function buildAreaHistory(history: ApiResponse["history"], nodes: string[]): ChartRow[] {
    return history.map(entry => {
        const row: ChartRow = {
            time: new Date(entry.ts).toLocaleTimeString(),
        };

        for (const node of nodes) {
            row[node] = entry.data[node]?.status === "healthy" ? HEALTHY_VALUE : UNHEALTHY_VALUE;
        }

        return row;
    });
}

export default function NodeHealthAreaChart({ data }: { data: ApiResponse }) {
    const nodes = Object.keys(data.data);
    const chartData = buildAreaHistory(data.history, nodes);
    const chartConfig = Object.fromEntries(
        nodes.map((node, i) => [
            node,
            {
                label: node,
                color: `var(--chart-${(i % 5) + 1})`,
                icon: Activity,
            },
        ]),
    ) satisfies ChartConfig;

    return (
        <Card>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
                    <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} />

                        <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis domain={[0, 1]} hide />

                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent formatter={(_, name) => name} />}
                        />

                        {nodes.map((node, i) => (
                            <Line
                                key={node}
                                dataKey={node}
                                type="step"
                                fillOpacity={0.35}
                                stroke={`var(--chart-${(i % 5) + 1})`}
                                strokeWidth={2}
                            />
                        ))}
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
