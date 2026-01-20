"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Key, LucideLogOut } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { defaultNetworkId, supportedNetworks } from "@/lib/networks";
import { getNetworkByChainId, linkToTitle, truncateWallet } from "@/lib/utils";

import "./header.scss";

export default function Header() {
    const path = usePathname();

    const { ready, wallets } = useWallets();
    const { login, user, logout } = usePrivy();

    const [network, setNetwork] = useState<number | undefined>();
    const networkData = getNetworkByChainId(
        network || Number(wallets[0]?.chainId) || defaultNetworkId,
    );

    const handleNetworkChange = async (id: number) => {
        const wallet = wallets[0];
        if (!wallet) return;

        if (Number(wallet.chainId) === id) {
            setNetwork(id);
            return;
        }

        try {
            await wallet.switchChain(id);
            setNetwork(id);
        } catch (err) {
            console.error(err);
            toast.error("Failed to switch network");
        }
    };

    return (
        <header className="h-12 min-h-12 border-b border-border flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold font-figtree">{linkToTitle(path)}</h2>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-xs h-8" size="icon">
                            <div className="relative p-1">
                                <TestnetBadge isTestnet={networkData?.testnet} />
                                <Image
                                    src={networkData?.icon || "/networks/mantle.png"}
                                    alt="Network Icon"
                                    width={16}
                                    height={16}
                                />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="network-selection">
                        <DropdownMenuRadioGroup
                            value={network?.toString()}
                            onValueChange={value => handleNetworkChange(Number(value))}
                        >
                            {Object.values(supportedNetworks).map(net => {
                                return (
                                    <DropdownMenuRadioItem
                                        key={net.id}
                                        value={net.id.toString()}
                                        className="item flex items-center gap-1.5 pl-2 pr-8"
                                        aria-checked={net.id === networkData?.id}
                                    >
                                        <div className="image-container relative p-1 rounded-sm">
                                            <TestnetBadge isTestnet={net?.testnet} />
                                            <Image
                                                src={net.icon}
                                                alt={net.name}
                                                width={16}
                                                height={16}
                                            />
                                        </div>
                                        {net.name}
                                    </DropdownMenuRadioItem>
                                );
                            })}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                {user?.wallet ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="text-xs h-8 px-2.5 flex items-center gap-1.5"
                            >
                                <WalletLogo name={user.wallet.walletClientType || ""} />
                                {truncateWallet(user.wallet.address)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuItem>
                                <Key size={14} />
                                <Link href="/profile/api" className="w-full">
                                    Access Tokens
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                                <LucideLogOut size={14} color="var(--destructive)" />
                                <span className="text-destructive">Disconnect</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <>
                        {ready && (
                            <Button onClick={login} className="text-xs h-8">
                                Connect wallet
                            </Button>
                        )}
                    </>
                )}
            </div>
        </header>
    );
}

function WalletLogo({ name }: { name: string }) {
    switch (name.toLowerCase()) {
        case "metamask":
            return <Image src="/wallets/metamask.svg" alt="MetaMask Logo" width={18} height={18} />;
    }

    return null;
}

function TestnetBadge({ isTestnet }: { isTestnet?: boolean }) {
    if (!isTestnet) return null;

    return (
        <>
            <div className="absolute -top-[3px] -right-[3px] text-[6px] border border-primary text-primary rounded-full w-2.5 h-2.5 flex items-center justify-center font-figtree">
                T
            </div>
        </>
    );
}
