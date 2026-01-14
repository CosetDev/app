"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronLeft } from "lucide-react";

import { fetchWithWallet } from "@/lib/web3";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { StepSection } from "./StepSection";
import Link from "next/link";

type EndpointVerificationProps = {
    endpoint: string;
    onBack: () => void;
    onNext: () => void;
    id: string;
};

export function EndpointVerification({ endpoint, onBack, onNext, id }: EndpointVerificationProps) {
    const [loading, setLoading] = useState(false);
    const [keys, setKeys] = useState<{ id: string; name: string; key: string }[]>([]);
    const [selectedKey, setSelectedKey] = useState<string>("");
    const [keysLoading, setKeysLoading] = useState(false);

    useEffect(() => {
        const loadKeys = async () => {
            setKeysLoading(true);
            try {
                const response = await fetchWithWallet("/api/keys");
                const payload = await response.json();

                if (!response.ok) throw new Error(payload?.message || "Failed to load API keys");

                const list = (payload?.keys as { id: string; name: string; key: string }[]) ?? [];
                setKeys(list);
                setSelectedKey(list[0]?.name ?? "");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load API keys";
                toast.error(message);
            } finally {
                setKeysLoading(false);
            }
        };

        loadKeys();
    }, []);

    const handleEndpointVerification = async () => {
        setLoading(true);

        if (!selectedKey) {
            toast.error("Select an API key before testing");
            setLoading(false);
            return;
        }

        const response = await fetchWithWallet(`/api/oracle/${id}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyName: selectedKey }),
        });

        if (response.ok) {
            onNext();
        } else {
            toast.error("Endpoint verification failed. Please check your endpoint and try again.");
        }

        setLoading(false);
    };

    return (
        <StepSection
            title="Endpoint verification"
            description="Confirm the oracle endpoint responds as expected before deployment."
            footer={
                <div className="flex w-full justify-between gap-2">
                    <Button variant="outline" onClick={onBack} disabled={loading} size="icon">
                        <ChevronLeft size={16} />
                    </Button>
                    <Button
                        onClick={handleEndpointVerification}
                        disabled={loading || keysLoading || (!keys.length && !keysLoading)}
                    >
                        {loading ? "Testing..." : "Test endpoint"}
                    </Button>
                </div>
            }
        >
            <div className="space-y-2">
                <Label htmlFor="verify-key">API Key</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            disabled={keysLoading || !keys.length}
                        >
                            <span className="truncate">
                                {selectedKey
                                    ? `${selectedKey} (${keys.find(k => k.name === selectedKey)?.key ?? ""})`
                                    : "Select an API key"}
                            </span>
                            <ChevronDown className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        {keys.map(key => (
                            <DropdownMenuItem key={key.id} onClick={() => setSelectedKey(key.name)}>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium text-gray-900">
                                        {key.name}
                                    </span>
                                    <span className="font-mono text-xs text-gray-500">
                                        {key.key}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                {!keys.length && !keysLoading ? (
                    <p className="text-xs text-destructive">
                        No API keys found. You can <Link href="/profile/api" className="underline">create one here</Link>.
                    </p>
                ) : null}
            </div>
            <div className="space-y-2">
                <Label htmlFor="verify-endpoint">API Endpoint</Label>
                <Input id="verify-endpoint" value={endpoint} readOnly />
            </div>
        </StepSection>
    );
}
