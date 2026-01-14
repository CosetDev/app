"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { supportedNetworks } from "@/lib/networks";

type TabKey = "code" | "stats";
type LanguageKey = "javascript" | "python" | "curl";

type EarningsPoint = {
    date: string;
    totalPaid: number;
    providerEarning: number;
    gasFee: number;
    platformFee: number;
};

type UsagePoint = { date: string; usage: number };

type OraclePublic = {
    id: string;
    name: string;
    description: string;
    requestPrice: number;
    recommendedUpdateDuration: number | null;
    network: string | null;
    owner: string;
    address: string | null;
    earningsSeries: EarningsPoint[];
    usageSeries: UsagePoint[];
};

const languageLabels: Record<LanguageKey, string> = {
    javascript: "JavaScript",
    python: "Python",
    curl: "cURL",
};

export default function OraclePage() {
    const params = useParams<{ id?: string }>();
    const oracleId = useMemo(() => (params?.id as string) || "", [params]);

    const [tab, setTab] = useState<TabKey>("code");
    const [language, setLanguage] = useState<LanguageKey>("javascript");
    const [oracle, setOracle] = useState<OraclePublic | null>(null);
    const [loading, setLoading] = useState(true);

    console.log(oracle);

    useEffect(() => {
        if (!oracleId) return;

        const load = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/oracle/${oracleId}/public`);
                const body = await response.json();
                if (!response.ok) throw new Error(body?.message || "Failed to load oracle");

                setOracle({
                    id: body.id,
                    name: body.name,
                    description: body.description,
                    requestPrice: body.requestPrice,
                    recommendedUpdateDuration: body.recommendedUpdateDuration ?? null,
                    network: body.network ?? null,
                    owner: body.owner,
                    address: body.address ?? null,
                    earningsSeries: body.earningsSeries ?? [],
                    usageSeries: body.usageSeries ?? [],
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load oracle";
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [oracleId]);

    const codeSample = useMemo(() => buildCodeSample(language, oracle), [language, oracle]);

    return (
        <div className="space-y-6">
            <Card className="border bg-white/80">
                <CardHeader className="pb-1">
                    <CardTitle className="text-xl text-gray-900">
                        {oracle?.name || "Oracle"}
                    </CardTitle>
                    <p className="text-sm text-gray-700">
                        {oracle?.description || "Public oracle information"}
                    </p>
                </CardHeader>
                <CardContent>
                    <small className="text-xs font-semibold text-gray-700">Oracle Address</small>
                    <div className="mb-4 flex items-center space-x-2">
                        <Input value={oracle?.address || "--"} readOnly />
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                                if (oracle?.address) {
                                    navigator.clipboard.writeText(oracle.address);
                                    toast.success("Address copied");
                                }
                            }}
                        >
                            <Copy />
                        </Button>
                    </div>
                    <small className="text-xs font-semibold text-gray-700">Details</small>
                    <div className="flex gap-3 flex-wrap">
                        <SummaryTile
                            title="Update price"
                            value={
                                <span className="text-primary font-semibold">
                                    {formatCurrency(oracle?.requestPrice)}
                                </span>
                            }
                        />
                        {oracle?.recommendedUpdateDuration && (
                            <SummaryTile
                                title="Update interval"
                                value={`${oracle.recommendedUpdateDuration} s`}
                            />
                        )}
                        <SummaryTile
                            title="Network"
                            value={
                                <div className="flex items-center gap-2">
                                    {oracle?.network && (
                                        <Image
                                            src={supportedNetworks[oracle.network].icon || ""}
                                            alt=""
                                            className="h-4 w-4"
                                            width={32}
                                            height={32}
                                        />
                                    )}

                                    {supportedNetworks[oracle?.network || ""]?.name || "--"}
                                </div>
                            }
                        />
                        <SummaryTile title="Owner" value={oracle?.owner || "--"} />
                    </div>
                </CardContent>
            </Card>

            <nav className="flex border-b border-border">
                <TabButton label="Run" active={tab === "code"} onClick={() => setTab("code")} />
                <TabButton
                    label="Statistics"
                    active={tab === "stats"}
                    onClick={() => setTab("stats")}
                />
            </nav>

            {tab === "code" ? (
                <CodePanel
                    language={language}
                    code={codeSample}
                    onLanguageChange={setLanguage}
                    loading={loading}
                />
            ) : (
                <StatsPanel
                    earningsSeries={oracle?.earningsSeries || []}
                    usageSeries={oracle?.usageSeries || []}
                    loading={loading}
                />
            )}
        </div>
    );
}

function TabButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex items-center justify-between px-6 py-3 text-sm font-medium",
                active && "border-b border-primary",
            )}
        >
            <span
                className={cn(
                    "text-[12px] font-medium group-hover:text-black",
                    active && "text-primary!",
                )}
            >
                {label}
            </span>
        </button>
    );
}

function SummaryTile({
    title,
    value,
    subtle,
}: {
    title: string;
    value: React.ReactNode;
    subtle?: boolean;
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
                {value}
            </p>
        </div>
    );
}

function CodePanel({
    language,
    code,
    onLanguageChange,
    loading,
}: {
    language: LanguageKey;
    code: string;
    onLanguageChange: (value: LanguageKey) => void;
    loading: boolean;
}) {
    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        toast.success("Code copied");
    };

    return (
        <div className="flex flex-col gap-4 lg:flex-row">
            <div className="hidden w-1/2 lg:block" aria-hidden />

            <div className="relative w-full lg:w-1/2">
                <div className="absolute right-2 top-2 flex flex-row-reverse items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-white! rounded-xs text-xs"
                            >
                                <div className="flex items-center gap-2">
                                    <Image
                                        src={`/tech/${language.toLowerCase()}.svg`}
                                        alt={languageLabels[language]}
                                        width={16}
                                        height={16}
                                    />
                                    {languageLabels[language]}
                                </div>
                                <ChevronDown className="ml-4 size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="rounded-xs p-0.5 w-[var(--radix-dropdown-menu-trigger-width)]"
                            align="end"
                        >
                            {(Object.keys(languageLabels) as LanguageKey[]).map(key => (
                                <DropdownMenuItem key={key} onSelect={() => onLanguageChange(key)}>
                                    <Image
                                        src={`/tech/${key.toLowerCase()}.svg`}
                                        alt={languageLabels[key]}
                                        width={16}
                                        height={16}
                                    />
                                    {languageLabels[key]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" onClick={handleCopy} disabled={loading}>
                        <Copy className="text-white size-4" />
                    </Button>
                </div>

                <div className="rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
                        {code}
                    </pre>
                </div>
            </div>
        </div>
    );
}

function StatsPanel({
    earningsSeries,
    usageSeries,
    loading,
}: {
    earningsSeries: EarningsPoint[];
    usageSeries: UsagePoint[];
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

    const usageConfig = useMemo(() => ({ usage: { label: "Usage", color: "#3b82f6" } }), []);

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
                            <BarChart
                                data={earningsSeries}
                                margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
                            >
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

function buildCodeSample(language: LanguageKey, oracle: OraclePublic | null) {
    const address = oracle?.address || "<oracle-address>";
    const network = oracle?.network || "<network>";

    if (language === "python") {
        return `from coset import CosetClient

client = CosetClient(api_key="YOUR_API_KEY")

result = client.call(
    network="${network}",
    address="${address}",
)

print(result.data)`;
    }

    if (language === "curl") {
        return `curl -X POST https://api.coset.xyz/call \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"network":"${network}","address":"${address}"}'`;
    }

    return `import { CosetClient } from "@coset/sdk";

const client = new CosetClient({ apiKey: "YOUR_API_KEY" });

async function main() {
    const response = await client.call({
        network: "${network}",
        address: "${address}",
    });

    console.log(response.data);
}

main();`;
}

function formatCurrency(value?: number) {
    if (value === undefined || value === null) return "--";
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}
