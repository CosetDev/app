"use client";

import { toast } from "sonner";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, RefreshCcw } from "lucide-react";

import { fetchWithWallet } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

type OracleRow = {
    id: string;
    name: string;
    description: string;
    api: { protocol: "https" | "wss"; url: string };
    verifications: { api: boolean; signature: string | null };
    network?: string | null;
    address?: string | null;
    requestPrice: number;
    recommendedUpdateDuration?: number;
    createdAt: string;
};

type PanelProps = {
    title: string;
    description?: string;
    children: ReactNode;
    action?: ReactNode;
};

function Panel({ title, description, children, action }: PanelProps) {
    return (
        <section className="rounded-xl border bg-white/70 p-6 backdrop-blur">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                    {description ? <p className="text-sm text-gray-600">{description}</p> : null}
                </div>
                {action}
            </header>
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

export default function OraclesPage() {
    const router = useRouter();
    const [oracles, setOracles] = useState<OracleRow[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, { name: string; description: string }>>({});

    const totalCount = useMemo(() => oracles.length, [oracles]);

    const loadOracles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetchWithWallet("/api/oracle/list");
            const payload = await response.json();

            if (!response.ok) throw new Error(payload?.message || "Failed to load oracles");

            setOracles((payload?.oracles as OracleRow[]) ?? []);
            setDrafts(prev => {
                const next = { ...prev };
                for (const oracle of (payload?.oracles as OracleRow[]) ?? []) {
                    next[oracle.id] = {
                        name: prev[oracle.id]?.name ?? oracle.name ?? "",
                        description: prev[oracle.id]?.description ?? oracle.description ?? "",
                    };
                }
                return next;
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load oracles";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadOracles();
    }, [loadOracles]);

    const toggle = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDraftChange = (id: string, field: "name" | "description", value: string) => {
        setDrafts(prev => ({
            ...prev,
            [id]: {
                name: prev[id]?.name ?? "",
                description: prev[id]?.description ?? "",
                [field]: value,
            },
        }));
    };

    const handleReset = (oracle: OracleRow) => {
        setDrafts(prev => ({
            ...prev,
            [oracle.id]: { name: oracle.name ?? "", description: oracle.description ?? "" },
        }));
    };

    const handleSave = async (oracle: OracleRow) => {
        const draft = drafts[oracle.id] ?? { name: oracle.name ?? "", description: oracle.description ?? "" };
        setSaving(oracle.id);
        try {
            const response = await fetchWithWallet(`/api/oracle/${oracle.id}/edit`, {
                method: "POST",
                body: JSON.stringify({ name: draft.name, description: draft.description }),
            });
            const body = await response.json();

            if (!response.ok) throw new Error(body?.message || "Failed to update oracle");

            setOracles(prev =>
                prev.map(item =>
                    item.id === oracle.id
                        ? { ...item, name: body?.name ?? draft.name, description: body?.description ?? draft.description }
                        : item,
                ),
            );

            toast.success("Oracle updated");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update oracle";
            toast.error(message);
        } finally {
            setSaving(null);
        }
    };

    const handleResume = (oracle: OracleRow) => {
        const status = deriveStatus(oracle);
        if (!status.nextStep) return;
        router.push(`/create?step=${status.nextStep}&oracle=${oracle.id}`);
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">My oracles</h1>
                <p className="text-sm text-gray-600">
                    Manage your deployed and in-progress oracles.
                </p>
            </div>

            <Panel
                title="Your oracles"
                description="All of your deployed and in-progress oracles."
                action={
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCcw
                            className={`size-4 ${loading ? "animate-spin text-primary" : "text-gray-400"}`}
                            onClick={() => loadOracles()}
                        />
                        {totalCount} total
                    </div>
                }
            >
                {oracles.length === 0 && (
                    <div className="rounded-lg border border-dashed bg-white/60 p-6 text-center text-sm text-gray-600">
                        {loading ? (
                            <Loader2 className="mx-auto animate-spin" />
                        ) : (
                            "No oracles yet. Create one to see it here."
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    {oracles.map(oracle => {
                        const status = deriveStatus(oracle);
                        const isExpanded = expanded.has(oracle.id);
                        const endpoint = oracle.api?.url?.startsWith("http")
                            ? oracle.api.url
                            : `${oracle.api?.protocol || "https"}://${oracle.api?.url}`;

                        return (
                            <div key={oracle.id} className="rounded-lg border bg-white/70 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-base font-semibold text-gray-900">
                                                {oracle.name}
                                            </h3>
                                            <StatusPill status={status} />
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {oracle.description}
                                        </p>
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                            <span>Price: {oracle.requestPrice}</span>
                                            {oracle.recommendedUpdateDuration ? (
                                                <span>
                                                    Update: {oracle.recommendedUpdateDuration} ms
                                                </span>
                                            ) : null}
                                            <span>Created: {formatDate(oracle.createdAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {status.nextStep ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleResume(oracle)}
                                            >
                                                Resume Deployment
                                            </Button>
                                        ) : (
                                            <Link href={`/oracle/${oracle.id}`}>
                                                <Button size="sm" variant="outline">
                                                    View Oracle
                                                </Button>
                                            </Link>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggle(oracle.id)}
                                        >
                                            Edit
                                            {isExpanded ? (
                                                <ChevronDown className="size-4" />
                                            ) : (
                                                <ChevronRight className="size-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <form
                                        className="mt-4 space-y-4 rounded-md border border-border p-3 text-sm text-gray-700"
                                        onSubmit={event => {
                                            event.preventDefault();
                                            void handleSave(oracle);
                                        }}
                                    >
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label htmlFor={`${oracle.id}-name`}>Name</Label>
                                                <Input
                                                    id={`${oracle.id}-name`}
                                                    value={drafts[oracle.id]?.name ?? oracle.name ?? ""}
                                                    maxLength={64}
                                                    onChange={event =>
                                                        handleDraftChange(oracle.id, "name", event.target.value)
                                                    }
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <Label htmlFor={`${oracle.id}-description`}>Description</Label>
                                                <textarea
                                                    id={`${oracle.id}-description`}
                                                    value={drafts[oracle.id]?.description ?? oracle.description ?? ""}
                                                    maxLength={1024}
                                                    onChange={event =>
                                                        handleDraftChange(oracle.id, "description", event.target.value)
                                                    }
                                                    className="min-h-[90px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                                />
                                            </div>

                                            <ReadOnlyInput label="Endpoint" value={endpoint} />
                                            <ReadOnlyInput label="Network" value={oracle.network || "Not deployed"} />
                                            <ReadOnlyInput label="Address" value={oracle.address || "Not deployed"} />
                                            <ReadOnlyInput label="Price" value={oracle.requestPrice.toString()} />
                                            <ReadOnlyInput
                                                label="Recommended Update Duration"
                                                value={
                                                    oracle.recommendedUpdateDuration
                                                        ? `${oracle.recommendedUpdateDuration} ms`
                                                        : "Not set"
                                                }
                                            />
                                            <ReadOnlyInput label="Verification" value={status.label} />
                                            <ReadOnlyInput label="Created" value={formatDate(oracle.createdAt)} />
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleReset(oracle)}
                                                disabled={saving === oracle.id}
                                            >
                                                Reset
                                            </Button>
                                            <Button type="submit" size="sm" disabled={saving === oracle.id}>
                                                {saving === oracle.id ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="size-4 animate-spin" /> Saving
                                                    </span>
                                                ) : (
                                                    "Save changes"
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Panel>
        </div>
    );
}

type Status = {
    label: string;
    tone: "success" | "warning" | "info";
    nextStep?: number;
};

function deriveStatus(oracle: OracleRow): Status {
    if (!oracle.verifications?.api) {
        return { label: "API verification pending", tone: "warning", nextStep: 2 };
    }
    if (!oracle.verifications?.signature) {
        return { label: "Signature pending", tone: "warning", nextStep: 3 };
    }
    if (!oracle.address) return { label: "Ready to deploy", tone: "info" };
    return { label: "Live", tone: "success" };
}

function StatusPill({ status }: { status: Status }) {
    const tone = {
        success: "bg-green-100 text-green-800 border-green-200",
        warning: "bg-amber-100 text-amber-800 border-amber-200",
        info: "bg-blue-100 text-blue-800 border-blue-200",
    }[status.tone];

    return (
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
            {status.label}
        </span>
    );
}

function ReadOnlyInput({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-gray-500">{label}</Label>
            <Input value={value} readOnly disabled className="bg-gray-50" />
        </div>
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
