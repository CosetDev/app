"use client";

import { PrivyProvider } from "@privy-io/react-auth";

// Networks
import { mantle, mantleSepoliaTestnet } from "viem/chains";

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
            {children}
        </PrivyProvider>
    );
}
