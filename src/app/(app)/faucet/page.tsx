"use client";

import Image from "next/image";
import { toast } from "sonner";
import { useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchWithWallet } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { useNetwork } from "@/hooks/useNetwork";

export default function Faucet() {
    const { user, ready, login } = usePrivy();
    const { wallets } = useWallets();
    const { network } = useNetwork();

    const walletAddress = useMemo(() => user?.wallet?.address ?? "", [user?.wallet?.address]);
    const [token, setToken] = useState<FaucetToken>("USDC");
    const [pending, startClaim] = useTransition();
    const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);

    if (!ready) {
        return (
            <div className="mx-auto max-w-3xl space-y-4 p-6 md:p-10">
                <Panel title="Faucet" description="Loading faucet…">
                    <Loader2 className="size-4 animate-spin" />
                </Panel>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-3xl space-y-4 p-6 md:p-10">
                <Panel
                    title="Faucet"
                    description="Connect your wallet to use the faucet. You can claim USDC and CST tokens on Mantle Sepolia Testnet"
                >
                    <Button onClick={login} className="w-fit">
                        Connect wallet
                    </Button>
                </Panel>
            </div>
        );
    }

    const claim = () => {
        if (!walletAddress || !network) return;

        startClaim(async () => {
            try {
                const response = await fetchWithWallet("/api/faucet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        token,
                        network: network.key,
                    }),
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    if (response.status === 429 && payload?.nextClaimAt) {
                        const next = new Date(payload.nextClaimAt as string);
                        setCooldownUntil(next);
                        toast.error(
                            `Cooldown active. You can claim again at ${next.toLocaleString()}.`,
                        );
                        return;
                    }
                    throw new Error(payload?.message || "Failed to claim tokens");
                }

                const next = payload?.nextClaimAt ? new Date(payload.nextClaimAt as string) : null;
                setCooldownUntil(next);
                toast.success(`Claim recorded for ${token}.`);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to claim tokens";
                toast.error(message);
            }
        });
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">Faucet</h1>
                <p className="text-sm text-gray-600">
                    Claim test tokens for Mantle Sepolia. Each token can be claimed once every 24
                    hours.
                </p>
            </div>

            <Panel
                title="Claim tokens"
                description={
                    cooldownUntil
                        ? `Next claim for ${token}: ${cooldownUntil.toLocaleString()}`
                        : `Connected as ${walletAddress}`
                }
                action={
                    <Button onClick={claim} disabled={pending} className="w-full md:w-fit">
                        {pending ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Claiming…
                            </span>
                        ) : (
                            "Claim"
                        )}
                    </Button>
                }
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">Token</div>
                        <TokenDropdown value={token} onChange={setToken} />
                        <p className="text-xs text-gray-600">
                            Choose which token to claim. Cooldown is tracked separately per token.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">Network</div>
                        <div className="rounded-md border bg-white/60 px-3 py-2 text-sm text-gray-700">
                            Mantle Sepolia Testnet
                        </div>
                        <p className="text-xs text-gray-600">
                            Token transfer code is intentionally left blank in the API.
                        </p>
                    </div>
                </div>
            </Panel>
        </div>
    );
}

type FaucetToken = "USDC" | "CST";

function TokenDropdown({
    value,
    onChange,
}: {
    value: FaucetToken;
    onChange: (value: FaucetToken) => void;
}) {
    const items: { value: FaucetToken; label: string; icon?: string }[] = [
        { value: "USDC", label: "USDC", icon: "/coins/usdc.svg" },
        { value: "CST", label: "CST", icon: "/logo.svg" },
    ];

    const active = items.find(i => i.value === value);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    <span className="inline-flex items-center gap-2">
                        {active?.icon ? (
                            <Image src={active.icon} alt="" width={16} height={16} />
                        ) : null}
                        {active?.label}
                    </span>
                    <ChevronDown className="size-4 text-gray-500" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)]"
            >
                {items.map(item => (
                    <DropdownMenuItem
                        key={item.value}
                        onSelect={() => onChange(item.value)}
                        className="flex items-center justify-between"
                    >
                        <span className="inline-flex items-center gap-2">
                            {item.icon ? (
                                <Image src={item.icon} alt="" width={16} height={16} />
                            ) : null}
                            {item.label}
                        </span>
                        {item.value === value ? <Check className="size-4 text-primary" /> : null}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

type PanelProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
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
