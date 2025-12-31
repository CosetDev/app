"use client";

import { Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type OracleItem = {
    id: string;
    name: string;
    description: string;
    requestPrice: number;
    recommendedUpdateDuration?: number;
    usageCount: number;
    createdAt: string;
};

export default function Explore() {
    const [input, setInput] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 9;

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
    }, [page, pageSize, query]);

    useEffect(() => {
        void fetchOracles();
    }, [fetchOracles]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setQuery(input.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [input]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPage(1);
        setQuery(input.trim());
    };

    return (
        <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Most popular oracles</h1>
                <form onSubmit={handleSearch} className="flex w-full max-w-xl gap-2 sm:justify-end">
                    <Input
                        placeholder="Search oracles"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="w-full"
                    />
                    <Button type="submit" disabled={loading}>
                        Search
                    </Button>
                </form>
            </header>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.length === 0 && (
                    <div className="col-span-full rounded-lg border border-dashed bg-white/70 p-6 text-center text-sm text-gray-600">
                        {loading ? <Loader2 className="mx-auto animate-spin" /> : "No results"}
                    </div>
                )}

                {items.map(oracle => (
                    <article key={oracle.id} className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="rounded-xs bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-700">
                                        Data
                                    </span>
                                    <span>{formatDate(oracle.createdAt)}</span>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                                    {oracle.name}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {oracle.description}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 font-medium">
                                {oracle.requestPrice}
                            </span>
                            {oracle.recommendedUpdateDuration ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
                                    {oracle.recommendedUpdateDuration} ms
                                </span>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>

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
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
