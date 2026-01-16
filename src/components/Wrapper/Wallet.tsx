"use client";

import { fetchWithWallet, resetIdentityToken } from "@/lib/web3";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useEffect, useMemo } from "react";

// Networks
import { mantle, mantleSepoliaTestnet } from "viem/chains";

let connectedWallet: string | undefined;

function PrivyContent({ children }: { children: React.ReactNode }) {
    const { authenticated, ready, user } = usePrivy();

    const isFullyAuthenticated = useMemo(() => {
        return authenticated && ready;
    }, [authenticated, ready]);

    useEffect(() => {
        if (!isFullyAuthenticated) return;

        const wallet = user?.wallet?.address;

        if (connectedWallet && connectedWallet != wallet) {
            resetIdentityToken();
            connectedWallet = wallet;
        } else {
            connectedWallet = wallet;
        }

        const syncUser = async () => {
            await fetchWithWallet("/api/register", { method: "POST" });
        };

        syncUser();
    }, [isFullyAuthenticated, user]);

    return <>{children}</>;
}

export default function WalletProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
            config={{
                appearance: {
                    accentColor: "#EF8977",
                    theme: "#FFFFFF",
                    showWalletLoginFirst: false,
                    logo: "/logo.svg",
                    walletChainType: "ethereum-only",
                    walletList: [
                        "detected_ethereum_wallets",
                        "metamask",
                        "coinbase_wallet",
                        "base_account",
                        "rainbow",
                        "wallet_connect",
                    ],
                },
                loginMethods: ["wallet"],
                fundingMethodConfig: {
                    moonpay: {
                        useSandbox: true,
                    },
                },
                embeddedWallets: {
                    // requireUserPasswordOnCreate: false,
                    showWalletUIs: true,
                    ethereum: {
                        createOnLogin: "users-without-wallets",
                    },
                    solana: {
                        createOnLogin: "off",
                    },
                },
                mfa: {
                    noPromptOnMfaRequired: false,
                },
                defaultChain: mantleSepoliaTestnet,
                supportedChains: [mantle, mantleSepoliaTestnet],
            }}
        >
            <PrivyContent>{children}</PrivyContent>
        </PrivyProvider>
    );
}
