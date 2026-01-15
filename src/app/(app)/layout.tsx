import type { Metadata } from "next";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Wrapper from "@/components/Wrapper";

import "@/styles/main.scss";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Dashboard - Coset",
    description: "Get access to latest oracles",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div id="app">
            <Wrapper>
                <Suspense>
                    <Sidebar />
                </Suspense>
                <div className="p-3 pl-0 w-full">
                    <main>
                        <Header />
                        <div className="app-content">{children}</div>
                    </main>
                </div>
            </Wrapper>
        </div>
    );
}
