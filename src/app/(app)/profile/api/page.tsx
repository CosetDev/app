"use client";

import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithWallet } from "@/lib/web3";

type APIKeySummary = {
    id: string;
    name: string;
    key: string;
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
        <section className="rounded-xl border bg-white/70 p-6 shadow-sm backdrop-blur">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    {description ? <p className="text-sm text-gray-600">{description}</p> : null}
                </div>
                {action}
            </header>
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

type CreateFormState = {
    name: string;
};

type TokenRow = APIKeySummary;

export default function AccessTokensPage() {
    const { user, login } = usePrivy();

    const walletAddress = useMemo(() => user?.wallet?.address ?? "", [user?.wallet?.address]);
    const [createPending, startCreate] = useTransition();
    const [revokePending, startRevoke] = useTransition();
    const [tablePending, startTable] = useTransition();
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const [form, setForm] = useState<CreateFormState>({ name: "" });
    const [keys, setKeys] = useState<TokenRow[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [freshSecret, setFreshSecret] = useState<string | null>(null);

    useEffect(() => {
        if (!walletAddress) return;
        startTable(async () => {
            try {
                const data = await fetchKeys();
                setKeys(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load API keys";
                toast.error(message);
            }
        });
    }, [walletAddress]);

    const handleCreate = (event: FormEvent) => {
        event.preventDefault();
        if (!walletAddress) {
            toast.error("Connect your wallet to create an API key");
            return;
        }
        if (!form.name.trim()) {
            toast.error("Please provide a key name");
            return;
        }

        startCreate(async () => {
            try {
                const { secret, summary } = await createKey(form.name.trim());
                setForm({ name: "" });
                setKeys(prev => [summary, ...prev]);
                setFreshSecret(secret);
                setDialogOpen(true);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to create key";
                toast.error(message);
            }
        });
    };

    const handleRevoke = (id: string) => {
        if (!walletAddress) {
            toast.error("Connect your wallet to manage keys");
            return;
        }

        setRevokingId(id);
        startRevoke(async () => {
            try {
                await revokeKey(id);
                setKeys(prev => prev.filter(key => key.id !== id));
                toast.success("Key revoked");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to revoke key";
                toast.error(message);
            } finally {
                setRevokingId(null);
            }
        });
    };

    const closeDialog = (open: boolean) => {
        setDialogOpen(open);
        if (!open) setFreshSecret(null);
    };

    if (!walletAddress) {
        return (
            <div className="mx-auto max-w-3xl space-y-4 p-6 md:p-10">
                <Panel
                    title="Access tokens"
                    description="Connect your wallet to view or create access tokens."
                >
                    <Button onClick={login} className="w-fit">
                        Connect wallet
                    </Button>
                </Panel>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">Access tokens</h1>
                <p className="text-sm text-gray-600">
                    Create and manage API keys. You need API keys for Coset SDK.
                </p>
            </div>

            <Panel
                title="Create a new key"
                description="Name your key and generate a new secret. Keep it safe; it won’t be shown again."
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="key-name">Key name</Label>
                        <Input
                            id="key-name"
                            value={form.name}
                            onChange={e => setForm({ name: e.target.value })}
                            placeholder="Production gateway"
                        />
                    </div>
                    <div className="flex justify-end w-full">
                        <Button type="submit" disabled={createPending} className="w-full md:w-1/3">
                            {createPending ? "Creating..." : "Generate key"}
                        </Button>
                    </div>
                </form>
            </Panel>

            <Panel
                title="Your keys"
                action={
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <KeyRound className="size-4" />
                        Showing {keys.length} key{keys.length === 1 ? "" : "s"}
                    </div>
                }
            >
                <div className="overflow-hidden rounded-lg border bg-white/60 shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Key</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center text-sm text-gray-500 py-4"
                                    >
                                        {tablePending
                                            ? "Loading keys..."
                                            : "No keys yet. Generate one to get started."}
                                    </TableCell>
                                </TableRow>
                            )}
                            {keys.map(key => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium text-gray-900">
                                        {key.name}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-gray-700">
                                        {key.key}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {formatDate(key.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRevoke(key.id)}
                                            disabled={revokingId === key.id || revokePending}
                                        >
                                            <Trash2 className="size-4" />
                                            {revokingId === key.id ? "Revoking..." : "Revoke"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Panel>

            <Dialog open={dialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="w-fit max-w-fit!">
                    <DialogHeader>
                        <DialogTitle>New API key</DialogTitle>
                        <DialogDescription>
                            Copy and store this key securely. You will not be able to view it again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2 font-manrope text-sm text-gray-800">
                            {freshSecret}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => copyToClipboard(freshSecret)}
                                disabled={!freshSecret}
                                size="icon"
                            >
                                <Copy className="size-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" onClick={() => closeDialog(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

async function fetchKeys(): Promise<APIKeySummary[]> {
    const response = await fetchWithWallet("/api/keys");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || "Failed to load keys");
    return (payload?.keys as APIKeySummary[]) ?? [];
}

async function createKey(name: string): Promise<{ secret: string; summary: APIKeySummary }> {
    const response = await fetchWithWallet("/api/keys", {
        method: "POST",
        body: JSON.stringify({ name }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || "Failed to create key");
    return { secret: payload.secret as string, summary: payload.summary as APIKeySummary };
}

async function revokeKey(id: string): Promise<void> {
    const response = await fetchWithWallet(`/api/keys/${id}`, {
        method: "DELETE",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || "Failed to revoke key");
}

function copyToClipboard(value: string | null) {
    if (!value) return;
    navigator.clipboard.writeText(value).then(
        () => toast.success("Key copied to clipboard"),
        () => toast.error("Could not copy key"),
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
