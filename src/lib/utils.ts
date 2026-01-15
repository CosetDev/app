import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

import { supportedNetworks } from "./networks";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Converts a href "/some-page" to "Some Page". Hardcoded
export function linkToTitle(link: string) {
    switch (link) {
        case "/":
            return "Explore";
        case "/create":
            return "Create Oracle";
        case "/profile/earnings":
            return "Earnings";
        case "/profile/services":
            return "My Oracles";
        case "/profile/api":
            return "API Keys";
        case "/node":
            return "Node Monitor";
        default:
            return "Coset";
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNetworkByChainId(chainId: any) {
    if (chainId?.startsWith?.("eip155:")) chainId = Number(chainId.replace("eip155:", ""));
    for (const networkKey in supportedNetworks) {
        const network = supportedNetworks[networkKey];
        if (network.id === chainId) {
            return network;
        }
    }
    return null;
}

// Dates like '1m ago', 'Now', '1d ago'
export function relativeTime(timestamp: number): string {
    const now = new Date();
    const secondsPast = (now.getTime() - timestamp) / 1000;

    if (secondsPast < 60) {
        return "Now";
    }
    if (secondsPast < 3600) {
        const minutes = Math.floor(secondsPast / 60);
        return `${minutes}m ago`;
    }
    if (secondsPast < 86400) {
        const hours = Math.floor(secondsPast / 3600);
        return `${hours}h ago`;
    }
    if (secondsPast < 2592000) {
        const days = Math.floor(secondsPast / 86400);
        return `${days}d ago`;
    }
    if (secondsPast < 31536000) {
        const months = Math.floor(secondsPast / 2592000);
        return `${months}mo ago`;
    }
    const years = Math.floor(secondsPast / 31536000);
    return `${years}y ago`;
}

export function truncateWallet(walletAddress: string, prefixLength = 12, suffixLength = 6) {
    // Check if the wallet address is valid
    if (typeof walletAddress !== "string" || walletAddress.length < prefixLength + suffixLength)
        return walletAddress; // Return the original address if it's invalid or too short

    // Extract the prefix and suffix parts of the address
    const prefix = walletAddress.substring(0, prefixLength - 4);
    const suffix = walletAddress.substring(walletAddress.length - suffixLength);

    // Generate the truncated address with prefix, ellipsis, and suffix
    const truncatedAddress = `${prefix}...${suffix}`;

    return truncatedAddress;
}
