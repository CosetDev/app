"use client";

import { useCallback, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";

import { defaultNetworkId } from "@/lib/networks";
import { getNetworkByChainId } from "@/lib/utils";

export type UseNetworkResult = {
    ready: boolean;
    wallets: ReturnType<typeof useWallets>["wallets"];
    /** Optional local override (e.g. from a UI dropdown). */
    selectedNetworkId: number | undefined;
    /** Effective chain id used by the app (wallet chainId or selectedNetworkId fallback). */
    networkId: number;
    /** Network metadata from `supportedNetworks` (or null if unknown). */
    network: ReturnType<typeof getNetworkByChainId>;
    /** Switch the connected wallet chain (falls back to just selecting locally if no wallet). */
    switchNetwork: (id: number) => Promise<void>;
    /** Set local selection without switching wallet chain. */
    setSelectedNetworkId: (id: number | undefined) => void;
};

function normalizeChainId(chainId: unknown): number | undefined {
    if (typeof chainId === "string" && chainId.startsWith("eip155:")) {
        const parsed = Number(chainId.replace("eip155:", ""));
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    const parsed = Number(chainId);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function useNetwork(): UseNetworkResult {
    const { ready, wallets } = useWallets();

    const walletChainId = useMemo(
        () => normalizeChainId(wallets[0]?.chainId),
        // Only depend on the first wallet's chainId (same assumption as Header)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [wallets[0]?.chainId],
    );

    const [selectedNetworkId, setSelectedNetworkId] = useState<number | undefined>(undefined);

    const networkId = selectedNetworkId ?? walletChainId ?? defaultNetworkId;
    const network = useMemo(() => getNetworkByChainId(networkId), [networkId]);

    const switchNetwork = useCallback(
        async (id: number) => {
            const w = wallets[0];
            if (!w) {
                setSelectedNetworkId(id);
                return;
            }

            const currentId = normalizeChainId(w.chainId);
            if (currentId === id) {
                setSelectedNetworkId(id);
                return;
            }

            await w.switchChain(id);
            setSelectedNetworkId(id);
        },
        [wallets],
    );

    return {
        ready,
        wallets,
        selectedNetworkId,
        networkId,
        network,
        switchNetwork,
        setSelectedNetworkId,
    };
}
