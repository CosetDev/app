"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { User2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useConnectOrCreateWallet, useWallets } from "@privy-io/react-auth";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { defaultNetworkId, supportedNetworks } from "@/lib/networks";
import { getNetworkByChainId, linkToTitle, truncateWallet } from "@/lib/utils";

import "./header.scss";

export default function Header() {
    const path = usePathname();

    const { wallets, ready } = useWallets();
    const { connectOrCreateWallet } = useConnectOrCreateWallet();

    const [network, setNetwork] = useState<number | undefined>();
    const networkData = getNetworkByChainId(
        network || Number(wallets[0]?.chainId) || defaultNetworkId,
    );

    const handleNetworkChange = async (id: number) => {
        console.log(wallets);
        if (wallets.length === 0) {
            setNetwork(undefined);
            return;
        }

        try {
            await changeWalletNetwork(id);
        } catch (error) {
            console.error("Error switching chain:", error);
            toast.error("Failed to switch network. Please try again.");
        }

        setNetwork(id);
    };

    const changeWalletNetwork = async (id: number) => {
        const wallet = wallets[0];
        await wallet.switchChain(id);
    };

    useEffect(() => {
        if (network && wallets.length > 0 && wallets[0].chainId !== network.toString())
            changeWalletNetwork(defaultNetworkId);
    }, [network]);

    return (
        <header className="h-12 border-b border-border flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold font-figtree">{linkToTitle(path)}</h2>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="text-xs h-8" size="icon">
                            <Image
                                src={networkData?.icon || "/networks/mantle.png"}
                                alt="Network Icon"
                                width={16}
                                height={16}
                            />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="network-selection">
                        <DropdownMenuRadioGroup
                            value={network?.toString()}
                            onValueChange={value => handleNetworkChange(Number(value))}
                        >
                            {supportedNetworks.map(net => {
                                return (
                                    <DropdownMenuRadioItem
                                        key={net.id}
                                        value={net.id.toString()}
                                        className="item flex items-center gap-1.5 pl-2 pr-8"
                                        aria-checked={net.id === networkData?.id}
                                    >
                                        <div className="image-container p-1 rounded-sm">
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
                {wallets.length > 0 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="text-xs h-8 px-2.5 flex items-center gap-1.5"
                            >
                                <WalletLogo name={wallets[0].walletClientType} />
                                {truncateWallet(wallets[0].address)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuItem>
                                <User2 size={14} />
                                <Link href="/profile" className="w-full">
                                    My Profile
                                </Link>
                            </DropdownMenuItem>
                            {/*<DropdownMenuItem onClick={wallets[0].disconnect}>
                                <LucideLogOut size={14} color="var(--destructive)" />
                                <span className="text-destructive">Disconnect</span>
                            </DropdownMenuItem>*/}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <>
                        {ready && (
                            <Button onClick={connectOrCreateWallet} className="text-xs h-8">
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
