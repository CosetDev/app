"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supportedNetworks } from "@/lib/networks";

type OracleItem = {
    id: string;
    name: string;
    description: string;
    requestPrice: number;
    recommendedUpdateDuration?: number;
    createdAt: string;
    network: string;
};

export default function Explore() {
    const [input, setInput] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 9;

    const [networkFilter, setNetworkFilter] = useState<string>("");

    const [recentItems, setRecentItems] = useState<OracleItem[]>([]);
    const [recentLoading, setRecentLoading] = useState(false);

    const [items, setItems] = useState<OracleItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    const fetchOracles = useCallback(async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                q: query,
            });

            if (networkFilter) params.set("network", networkFilter);

            const response = await fetch(`/api/oracle/popular?${params.toString()}`);
            const payload = await response.json();

            if (!response.ok) throw new Error(payload?.message || "Failed to load oracles");

            setItems((payload?.items as OracleItem[]) ?? []);
            setTotal(Number(payload?.total) || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, query, networkFilter]);

    const fetchRecentOracles = useCallback(async () => {
        setRecentLoading(true);

        try {
            const params = new URLSearchParams({
                page: "1",
                pageSize: "6",
            });

            if (networkFilter) params.set("network", networkFilter);

            const response = await fetch(`/api/oracle/recent?${params.toString()}`);
            const payload = await response.json();

            if (!response.ok) throw new Error(payload?.message || "Failed to load recent oracles");

            setRecentItems((payload?.items as OracleItem[]) ?? []);
        } catch (error) {
            console.error(error);
        } finally {
            setRecentLoading(false);
        }
    }, [networkFilter]);

    useEffect(() => {
        void fetchOracles();
    }, [fetchOracles]);

    useEffect(() => {
        if (query) return;
        void fetchRecentOracles();
    }, [fetchRecentOracles, query]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setQuery(input.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [input]);

    const currentNetwork = networkFilter ? supportedNetworks[networkFilter] : null;

    const renderOracleCard = (oracle: OracleItem) => {
        const network = supportedNetworks[oracle.network];
        if (!network) return null;
        return (
            <Link
                href={`/oracle/${oracle.id}`}
                key={oracle.id}
                className="flex flex-col gap-2 rounded-lg border bg-white hover:bg-[#13131304] p-4"
            >
                <div className="flex-1 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900">{oracle.name}</h3>
                    <div className="flex-1 flex justify-end items-center gap-1 text-xs text-gray-600">
                        <span className="hidden sm:inline text-nowrap">{network.name}</span>
                        <div className="relative p-1 rounded-sm">
                            <Image
                                src={network.icon}
                                alt={network.name}
                                width={16}
                                height={16}
                                className="w-4 h-4 min-w-4 min-h-4 object-contain"
                            />
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{oracle.description}</p>
                <div className="mt-3 flex flex-wrap items-end gap-2 text-xs text-gray-600">
                    <span className="rounded-sm border px-2 py-1 font-medium">
                        <span className="font-semibold text-gray-700">{oracle.requestPrice}$</span>{" "}
                        per update
                    </span>
                    {oracle.recommendedUpdateDuration ? (
                        <span className="rounded-sm border px-2 py-1 font-medium">
                            <span className="font-semibold text-gray-700">
                                {oracle.recommendedUpdateDuration}
                            </span>
                            s
                        </span>
                    ) : null}
                    <div className="flex-1 flex items-center justify-end gap-2 text-[10px] text-gray-500">
                        <span>{formatDate(oracle.createdAt)}</span>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full">
                    <Input
                        placeholder="Search oracles"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="w-full"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-xs h-10">
                            {currentNetwork ? (
                                <div className="flex items-center gap-0.5">
                                    <div className="relative p-1">
                                        <Image
                                            src={currentNetwork?.icon}
                                            alt={currentNetwork?.name || "All networks"}
                                            width={16}
                                            height={16}
                                        />
                                        <TestnetBadge isTestnet={currentNetwork?.testnet} />
                                    </div>

                                    <span className="ml-2 text-md">{currentNetwork?.name}</span>
                                </div>
                            ) : (
                                "All networks"
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="network-selection">
                        <DropdownMenuRadioGroup
                            value={networkFilter}
                            onValueChange={value => {
                                setPage(1);
                                setNetworkFilter(value);
                            }}
                        >
                            <DropdownMenuRadioItem
                                key="all"
                                value=""
                                className="item flex items-center gap-1.5 pl-10 pr-8 h-9"
                                aria-checked={!networkFilter}
                            >
                                All networks
                            </DropdownMenuRadioItem>

                            {Object.values(supportedNetworks).map(net => {
                                return (
                                    <DropdownMenuRadioItem
                                        key={net.key}
                                        value={net.key}
                                        className="item flex items-center gap-1.5 pl-2 pr-8 h-9"
                                        aria-checked={net.key === currentNetwork?.key}
                                    >
                                        <div className="image-container relative p-1 rounded-sm">
                                            <TestnetBadge isTestnet={net?.testnet} />
                                            <Image
                                                src={net.icon}
                                                alt={net.name}
                                                width={16}
                                                height={16}
                                            />
                                        </div>
                                        {net.name}
                                    </DropdownMenuRadioItem>
                                );
                            })}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {query ? null : (
                <h1 className="text-xl font-semibold text-gray-900">Popular Oracles</h1>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.length === 0 && (
                    <div className="col-span-full rounded-lg border border-dashed bg-white/70 p-6 text-center text-sm text-gray-600">
                        {loading ? <Loader2 className="mx-auto animate-spin" /> : "No results"}
                    </div>
                )}

                {items.map(renderOracleCard)}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-white/70 p-3 text-sm text-gray-700">
                    <div>
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                        >
                            <ChevronLeft size={14} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                        >
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                </div>
            )}

            {query ? null : (
                <section className="space-y-3 mt-12">
                    <header className="flex items-center justify-between gap-2">
                        <h2 className="text-xl font-semibold text-gray-900">Recent Oracles</h2>
                    </header>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {recentItems.length === 0 && (
                            <div className="col-span-full rounded-lg border border-dashed bg-white/70 p-6 text-center text-sm text-gray-600">
                                {recentLoading ? (
                                    <Loader2 className="mx-auto animate-spin" />
                                ) : (
                                    "No recent oracles"
                                )}
                            </div>
                        )}
                        {recentItems.map(renderOracleCard)}
                    </div>
                </section>
            )}
        </div>
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function TestnetBadge({ isTestnet }: { isTestnet?: boolean }) {
    if (!isTestnet) return null;

    return (
        <div className="absolute -top-[3px] -right-[3px] text-[6px] border border-primary text-primary rounded-full w-2.5 h-2.5 flex items-center justify-center font-figtree">
            T
        </div>
    );
}
