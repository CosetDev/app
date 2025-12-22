"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BookMarked,
    ChartBarIncreasing,
    CornerDownRight,
    Database,
    Landmark,
    MoveUpRight,
    Server,
    Settings,
    Table2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Brand from "../Logo/Brand";
import { WaitlistButton } from "./Waitlist";

export default function Sidebar() {
    const path = usePathname();

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
                />
            </div>
            <div className="flex flex-col gap-3 pt-5 mt-5 px-2 border-t border-border">
                <SidebarLink
                    href="/profile#earnings"
                    icon={<Landmark size={14} />}
                    title="Earnings"
                    active={path === "/profile#earnings"}
                />
                <SidebarLink
                    href="/profile#services"
                    icon={<Table2 size={14} />}
                    title="My Services"
                    active={path === "/profile#services"}
                />
                <SidebarLink
                    href="/profile#usage"
                    icon={<ChartBarIncreasing size={14} />}
                    title="Usage Stats"
                    active={path === "/profile#usage"}
                />
                <SidebarLink
                    href="/profile#settings"
                    icon={<Settings size={14} />}
                    title="Settings"
                    active={path === "/profile#settings"}
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
            <div className="flex-1 flex flex-col justify-end">
                <WaitlistButton />
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
}: {
    href: string;
    icon: React.ReactNode;
    title: string;
    active: boolean;
    external?: boolean;
}) {
    return (
        <Link
            href={href}
            target={external ? "_blank" : "_self"}
            rel={external ? "noopener noreferrer" : undefined}
            className="flex items-center justify-between"
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
