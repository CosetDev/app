"use client";

import {
    type ConnectedWallet,
    type UnsignedTransactionRequest,
    usePrivy,
    useSendTransaction,
    useSignTypedData,
    useWallets,
} from "@privy-io/react-auth";
import { toast } from "sonner";
import Image from "next/image";
import { formatUnits } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronLeft, Loader2 } from "lucide-react";

import { StepSection } from "./StepSection";
import { fetchWithWallet } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { getNetworkByChainId } from "@/lib/utils";
import type { TransferAuthorizationPayload } from "./types";
import { availableTokens, type TokenType } from "@/lib/networks";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OracleDeploymentProps = {
    onBack: () => void;
    id: string;
};

export function OracleDeployment({ onBack, id }: OracleDeploymentProps) {
    const { login, ready } = usePrivy();
    const { wallets } = useWallets();
    const { signTypedData } = useSignTypedData();
    const { sendTransaction } = useSendTransaction();

    const [loading, setLoading] = useState(false);
    const [authorization, setAuthorization] = useState<TransferAuthorizationPayload | null>(null);
    const [authorizationLoading, setAuthorizationLoading] = useState(false);
    const [authorizationError, setAuthorizationError] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [signing, setSigning] = useState(false);
    const [token, setToken] = useState<TokenType>("usdc");

    const selectedTokenLabel = useMemo(
        () => availableTokens.find(option => option.value === token)?.label || "USDC",
        [token],
    );

    const loadAuthorization = useCallback(async () => {
        if (!ready || !wallets?.length) return null;

        const network = getNetworkByChainId(wallets[0]?.chainId);
        if (!network) {
            toast.error("Unsupported network for authorization");
            return null;
        }

        setAuthorizationLoading(true);
        setAuthorizationError(null);

        try {
            const response = await fetchWithWallet(
                `/api/oracle/${id}/deploy/transfer-authorization?network=${network.key}&token=${token}`,
            );
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.message || "Failed to load data");

            const normalized = {
                ...payload,
                primaryType: payload?.primaryType || "TransferWithAuthorization",
                message: {
                    ...payload?.message,
                    value: payload?.message?.value?.toString?.() ?? payload?.message?.value,
                },
            } as TransferAuthorizationPayload;

            setAuthorization(normalized);
            setSignature(null);

            return normalized;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load data";
            setAuthorizationError(message);
            toast.error(message);

            return null;
        } finally {
            setAuthorizationLoading(false);
        }
    }, [id, ready, token, wallets?.length]);

    useEffect(() => {
        setAuthorization(null);
        setAuthorizationError(null);
        setSignature(null);
    }, [token]);

    useEffect(() => {
        if (
            ready &&
            !authorization &&
            !authorizationLoading &&
            wallets?.length &&
            !authorizationError
        ) {
            void loadAuthorization();
        }
    }, [
        authorization,
        authorizationLoading,
        authorizationError,
        loadAuthorization,
        wallets?.length,
        token,
        ready,
    ]);

    const signAuthorization = useCallback(
        async (payload: TransferAuthorizationPayload, wallet: ConnectedWallet) => {
            const typedData = {
                domain: payload.domain,
                types: payload.types,
                primaryType: payload.primaryType,
                message: {
                    ...payload.message,
                    value: payload.message.value,
                },
            };

            const signatureResult = await signTypedData(typedData, {
                address: wallet.address,
            });

            if (!signatureResult?.signature) {
                console.error("Failed to sign authorization", { typedData });
                throw new Error("Connected wallet cannot sign typed data");
            }

            return signatureResult.signature;
        },
        [],
    );

    const handleSignTransfer = async () => {
        if (!wallets?.length) {
            toast.error("Connect your wallet to sign the authorization");
            if (login) login();
            return;
        }

        if (!authorization) {
            toast.error("Authorization payload is not loaded yet");
            return;
        }

        setSigning(true);
        try {
            const signatureResult = await signAuthorization(authorization, wallets[0]);
            setSignature(signatureResult);
            toast.success(`${selectedTokenLabel} transfer authorization signed`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to sign authorization";
            toast.error(message);
        } finally {
            setSigning(false);
        }
    };

    const handleDeploy = async () => {
        setLoading(true);

        try {
            if (!wallets?.length) {
                toast.error("Connect your wallet to deploy the oracle");
                if (login) login();
                return;
            }

            if (!authorization) {
                toast.error("Authorization payload is not loaded yet");
                return;
            }

            if (!signature) {
                toast.error("Please sign the transfer authorization first");
                return;
            }

            const network = getNetworkByChainId(wallets[0]?.chainId);
            if (!network) {
                toast.error("Unsupported network for deployment");
                return;
            }

            const factoryAddress = process.env.NEXT_PUBLIC_ORACLE_FACTORY_ADDRESS;
            if (!factoryAddress) {
                toast.error("Oracle factory address is not configured");
                return;
            }

            // Signature
            const normalizedSignature = signature.startsWith("0x") ? signature.slice(2) : signature;
            const r = `0x${normalizedSignature.slice(0, 64)}`;
            const s = `0x${normalizedSignature.slice(64, 128)}`;
            const v = parseInt(normalizedSignature.slice(128, 130), 16);

            const signatureResponse = await fetchWithWallet(
                `/api/oracle/${id}/deploy/signature?network=${network.key}&token=${token}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id,
                        validAfter: authorization.message.validAfter,
                        validBefore: authorization.message.validBefore,
                        nonce: authorization.message.nonce,
                        sig: {
                            v,
                            r,
                            s,
                        },
                    }),
                },
            );

            const signaturePayload = await signatureResponse.json();
            if (!signatureResponse.ok) {
                throw new Error(signaturePayload?.message || "Failed to prepare deployment");
            }

            // Deploy transaction
            const transaction: UnsignedTransactionRequest = {
                from: wallets[0].address,
                to: factoryAddress,
                data: signaturePayload.message,
                chainId: network.id,
                value: authorization.message.value, // Required deployment amount
            };

            const txResult = await sendTransaction(transaction, {
                address: wallets[0].address,
            });
            console.log(txResult);
            const txHash = (txResult as { hash?: string })?.hash;
            toast.success(txHash ? `Transaction sent: ${txHash}` : "Deployment transaction sent");

            console.log(`/api/oracle/${id}/deploy?network=${network.key}&token=${token}`);
            const finalizeResponse = await fetchWithWallet(
                `/api/oracle/${id}/deploy?network=${network.key}&token=${token}`,
                {
                    method: "POST",
                    body: JSON.stringify({ tx: txHash }),
                },
            );
            const finalizePayload = await finalizeResponse.json().catch(() => ({}));
            if (!finalizeResponse.ok) {
                console.log(finalizePayload);
                throw new Error(finalizePayload?.message || "Failed to finalize deployment");
            }

            toast.success("Oracle deployed successfully");
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Failed to deploy oracle";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const formattedAuthorizationValue = useMemo(() => {
        if (!authorization) return null;
        try {
            return formatUnits(BigInt(authorization.message.value), 6);
        } catch (error) {
            return authorization.message.value?.toString?.() ?? "";
        }
    }, [authorization]);

    const expiresAt = useMemo(() => {
        if (!authorization) return null;
        const date = new Date(Number(authorization.message.validBefore) * 1000);
        return date.toLocaleString();
    }, [authorization]);

    return (
        <StepSection
            title="Oracle deployment"
            footer={
                <div className="w-full flex items-center justify-between">
                    <Button variant="outline" onClick={onBack} disabled={loading} size="icon">
                        <ChevronLeft size={16} />
                    </Button>
                    <Button
                        onClick={handleDeploy}
                        disabled={loading || !signature || signing || authorizationLoading}
                    >
                        {loading ? <Loader2 className="size-4 animate-spin" /> : "Deploy"}
                    </Button>
                </div>
            }
        >
            <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Select token</p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <div className="flex items-center gap-2">
                                <Image
                                    src={
                                        availableTokens.find(option => option.value === token)
                                            ?.icon || ""
                                    }
                                    alt={selectedTokenLabel}
                                    width={16}
                                    height={16}
                                />
                                <span className="font-semibold">{selectedTokenLabel}</span>
                            </div>
                            <ChevronDown size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[var(--radix-dropdown-menu-trigger-width)]"
                        align="start"
                    >
                        {availableTokens.map(option => (
                            <DropdownMenuItem
                                key={option.value}
                                onSelect={event => {
                                    event.preventDefault();
                                    setToken(option.value);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Image
                                        src={option.icon}
                                        alt={option.label}
                                        width={16}
                                        height={16}
                                    />
                                    {option.label}
                                </div>
                                {token === option.value ? (
                                    <Check className="ml-auto size-4 text-primary" />
                                ) : null}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            Transfer Authorization
                        </p>
                        <p className="text-xs text-gray-500">
                            You have to give authorization to transfer tokens for oracle deployment.
                        </p>
                    </div>
                    <span className="rounded-sm bg-amber-100 text-amber-800 text-[11px] px-2 py-1 font-semibold">
                        Required
                    </span>
                </div>
                <dl className="flex gap-2 text-xs">
                    <div>
                        <dt className="font-semibold">Amount:</dt>
                        <dt className="font-semibold">Expires:</dt>
                        <dt className="font-semibold">Nonce:</dt>
                    </div>
                    <div className="text-accent-foreground/90">
                        <dd>
                            {authorizationLoading
                                ? "--"
                                : formattedAuthorizationValue
                                  ? `${formattedAuthorizationValue} ${selectedTokenLabel}`
                                  : "--"}
                        </dd>
                        <dd>{expiresAt || "--"}</dd>
                        <dd className="break-all">{authorization?.message?.nonce || "--"}</dd>
                    </div>
                </dl>

                {authorizationError ? (
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <p className="text-destructive flex-1">{authorizationError}</p>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void loadAuthorization()}
                            disabled={authorizationLoading}
                        >
                            Retry
                        </Button>
                    </div>
                ) : null}

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSignTransfer}
                        disabled={!authorization || authorizationLoading || signing || !!signature}
                        variant={signature ? "outline" : "default"}
                    >
                        {signing
                            ? "Signing..."
                            : signature
                              ? "Signed"
                              : "Sign Transfer Authorization"}
                    </Button>
                </div>
            </div>
        </StepSection>
    );
}
