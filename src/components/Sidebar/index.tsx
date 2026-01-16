"use client";

import {
    BookMarked,
    CornerDownRight,
    Database,
    Landmark,
    MoveUpRight,
    Server,
    Key,
    ShowerHead,
    Table2,
} from "lucide-react";
import Link from "next/link";
import { useWallets } from "@privy-io/react-auth";
import { usePathname, useSearchParams } from "next/navigation";

import Brand from "../Logo/Brand";
import WaitListButton from "./Waitlist";
import { defaultNetworkId } from "@/lib/networks";
import { cn, getNetworkByChainId } from "@/lib/utils";

export default function Sidebar() {
    const path = usePathname();
    const { wallets } = useWallets();
    const searchParams = useSearchParams();
    const oracleId = searchParams.get("oracle");
    const networkData = getNetworkByChainId(Number(wallets[0]?.chainId) || defaultNetworkId);

    return (
        <aside id="sidebar" className="w-60 py-3 px-3 flex flex-col">
            <div className="mb-8 px-2">
                <Brand size={24} />
            </div>
            <div className="flex flex-col gap-3 px-2">
                <SidebarLink
                    href="/"
                    icon={<Database size={14} />}
                    title="Explore"
                    active={path === "/"}
                />
                <SidebarLink
                    href="/create"
                    icon={<CornerDownRight size={14} />}
                    title="Create Oracle"
                    active={path === "/create"}
                    onClick={e => {
                        if (oracleId) {
                            e.preventDefault();
                            // TODO: refactor to use router
                            window.location.href = '/create'
                        }
                    }}
                />
            </div>
            <div className="flex flex-col gap-3 pt-5 mt-5 px-2 border-t border-border">
                <SidebarLink
                    href="/profile/api"
                    icon={<Key size={14} />}
                    title="API Keys"
                    active={path === "/profile/api"}
                />
                <SidebarLink
                    href="/profile/earnings"
                    icon={<Landmark size={14} />}
                    title="Earnings"
                    active={path === "/profile/earnings"}
                />
                <SidebarLink
                    href="/profile/oracles"
                    icon={<Table2 size={14} />}
                    title="My Oracles"
                    active={path === "/profile/oracles"}
                />
            </div>
            <div className="flex flex-col gap-3 pt-5 mt-5 px-2 border-t border-border">
                <SidebarLink
                    href="https://docs.coset.dev"
                    icon={<BookMarked size={14} />}
                    title="Documentation"
                    active={false}
                    external
                />
                <SidebarLink
                    href="/node"
                    icon={<Server size={14} />}
                    title="Node Monitor"
                    active={path === "/node"}
                />
            </div>
            <div className="flex flex-col gap-3 pt-5 mt-5 px-2 border-t border-border">
                {networkData?.testnet && (
                    <SidebarLink
                        href="/faucet"
                        icon={<ShowerHead size={14} />}
                        title="Faucet"
                        active={path === "/faucet"}
                    />
                )}
            </div>
            <div className="flex-1 flex flex-col justify-end">
                <WaitListButton />
            </div>
        </aside>
    );
}

function SidebarLink({
    href,
    icon,
    title,
    active,
    external = false,
    onClick = undefined,
}: {
    href: string;
    icon: React.ReactNode;
    title: string;
    active: boolean;
    external?: boolean;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}) {
    return (
        <Link
            href={href}
            target={external ? "_blank" : "_self"}
            rel={external ? "noopener noreferrer" : undefined}
            className="flex items-center justify-between"
            onClick={onClick}
        >
            <div className="flex items-center gap-2.5 rounded-lg group">
                <div
                    className={cn(
                        "flex items-center justify-center rounded-[4px] h-6 w-6 group-hover:text-black",
                        active && "bg-primary text-white!",
                    )}
                >
                    {icon}
                </div>
                <span
                    className={cn(
                        "text-[12px] font-medium group-hover:text-black",
                        active && "text-primary!",
                    )}
                >
                    {title}
                </span>
            </div>
            {external && <MoveUpRight size={12} opacity={0.5} />}
        </Link>
    );
}
