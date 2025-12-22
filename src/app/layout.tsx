import type { Metadata } from "next";
import { Figtree, Inter, Manrope } from "next/font/google";

import "@/styles/globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
    weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const figtree = Figtree({
    variable: "--font-figtree",
    subsets: ["latin"],
    display: "swap",
    weight: ["700", "800", "900"],
});

const manrope = Manrope({
    variable: "--font-manrope",
    subsets: ["latin"],
    display: "swap",
    weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
    title: "Coset - APIs meet Oracles",
    description: "Coset connects custom public APIs to smart contracts via oracles using x402 standard.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${figtree.variable} ${manrope.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
