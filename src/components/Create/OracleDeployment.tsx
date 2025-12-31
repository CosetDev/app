"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "ethers";
import { ChevronLeft } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

import { fetchWithWallet } from "@/lib/web3";
import { Button } from "@/components/ui/button";

import { StepSection } from "./StepSection";
import type { TransferAuthorizationPayload } from "./types";
import { getNetworkByChainId } from "@/lib/utils";

type OracleDeploymentProps = {
    onBack: () => void;
    id: string;
};

export function OracleDeployment({ onBack, id }: OracleDeploymentProps) {
    const { login } = usePrivy();
    const { wallets } = useWallets();

    const [loading, setLoading] = useState(false);
    const [authorization, setAuthorization] = useState<TransferAuthorizationPayload | null>(null);
    const [authorizationLoading, setAuthorizationLoading] = useState(false);
    const [authorizationError, setAuthorizationError] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [signing, setSigning] = useState(false);

    const loadAuthorization = useCallback(async () => {
        if (!wallets?.length) {
            toast.error("Connect your wallet to load the authorization payload");
            return null;
        }

        const network = getNetworkByChainId(wallets[0]?.chainId);
        if (!network) {
            toast.error("Unsupported network for authorization");
            return null;
        }

        setAuthorizationLoading(true);
        setAuthorizationError(null);

        try {
            const response = await fetchWithWallet(
                `/api/oracle/${id}/deploy/transfer-authorization?network=${network.name}`,
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
    }, [id, wallets]);

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

    const handleSignTransfer = async () => {
        const wallet = wallets?.[0];
        if (!wallet) {
            toast.error("Connect your wallet to sign the authorization");
            if (login) login();
            return;
        }

        setSigning(true);
        try {
            let payload = authorization;
            if (!payload) {
                payload = await loadAuthorization();
            }

            if (!payload) {
                setSigning(false);
                return;
            }

            const typedData = {
                domain: payload.domain,
                types: payload.types,
                primaryType: payload.primaryType,
                message: {
                    ...payload.message,
                    value: BigInt(payload.message.value),
                },
            };

            const signer = wallet as unknown as {
                signTypedData?: (data: typeof typedData) => Promise<string>;
                getEip712Signature?: (data: typeof typedData) => Promise<string>;
            };

            const signatureResult = signer.signTypedData
                ? await signer.signTypedData(typedData)
                : signer.getEip712Signature
                  ? await signer.getEip712Signature(typedData)
                  : null;

            if (!signatureResult) {
                throw new Error("Connected wallet cannot sign typed data");
            }

            setSignature(signatureResult);
            toast.success("USDC transfer authorization signed");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to sign authorization";
            toast.error(message);
        } finally {
            setSigning(false);
        }
    };

    const handleDeploy = async () => {
        setLoading(true);
        toast.success(
            "Deployment will proceed after transfer authorization (not implemented here)",
        );
        setLoading(false);
    };

    return (
        <StepSection
            title="Oracle deployment"
            description="Review and adjust details before final deployment. The endpoint remains locked."
            footer={
                <>
                    <Button variant="outline" onClick={onBack} disabled={loading} size="icon">
                        <ChevronLeft size={16} />
                    </Button>
                    <Button
                        onClick={handleDeploy}
                        disabled={loading || !signature || signing || authorizationLoading}
                    >
                        {loading ? "Deploying..." : "Deploy"}
                    </Button>
                </>
            }
        >
            <p className="text-sm text-gray-700">
                Finalize deployment by signing the USDC transfer authorization below. Once signed,
                the Deploy action unlocks.
            </p>

            <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            USDC transfer authorization
                        </p>
                    </div>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[11px] px-2 py-1 font-semibold">
                        Required
                    </span>
                </div>

                <dl className="grid grid-cols-1 gap-2 text-xs text-gray-700 sm:grid-cols-2">
                    <div className="flex flex-col">
                        <dt className="font-semibold">Amount</dt>
                        <dd className="text-gray-900">
                            {authorizationLoading
                                ? "Loading..."
                                : formattedAuthorizationValue
                                  ? `${formattedAuthorizationValue} USDC`
                                  : "--"}
                        </dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="font-semibold">Recipient</dt>
                        <dd className="text-gray-900">
                            {authorization?.message?.to ||
                                process.env.NEXT_PUBLIC_OWNER_ADDRESS ||
                                "--"}
                        </dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="font-semibold">Expires</dt>
                        <dd className="text-gray-900">{expiresAt || "--"}</dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="font-semibold">Nonce</dt>
                        <dd className="text-gray-900 break-all">
                            {authorization?.message?.nonce || "--"}
                        </dd>
                    </div>
                </dl>

                {authorizationError ? (
                    <p className="text-xs text-destructive">{authorizationError}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={handleSignTransfer}
                        disabled={authorizationLoading || signing || !!signature}
                        variant={signature ? "secondary" : "default"}
                    >
                        {signing
                            ? "Signing..."
                            : signature
                              ? "Signed"
                              : "Sign transfer authorization"}
                    </Button>
                </div>
            </div>
        </StepSection>
    );
}
