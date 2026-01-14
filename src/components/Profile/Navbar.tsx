"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export default function ProfileNavbar() {
    const path = usePathname();

    return (
        <nav className="flex border-border border-b">
            <NavbarLink href="/profile" title="Profile" active={path === "/profile"} />
            <NavbarLink href="/profile/api" title="API Keys" active={path === "/profile/api"} />
            {/*<NavbarLink
                href="/profile/usage"
                title="Usage Stats"
                active={path === "/profile/usage"}
            />*/}
            <NavbarLink
                href="/profile/earnings"
                title="Earnings"
                active={path === "/profile/earnings"}
            />
            <NavbarLink
                href="/profile/services"
                title="My Oracles"
                active={path === "/profile/services"}
            />
        </nav>
    );
}

function NavbarLink({ href, title, active }: { href: string; title: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center justify-between py-3 px-6",
                active && "border-b  border-primary",
            )}
        >
            <div className="flex items-center gap-2.5 rounded-lg group">
                <span
                    className={cn(
                        "text-[12px] font-medium group-hover:text-black",
                        active && "text-primary!",
                    )}
                >
                    {title}
                </span>
            </div>
        </Link>
    );
}
