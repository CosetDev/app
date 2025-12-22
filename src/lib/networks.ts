import { defineChain } from "viem";
import { mantle, mantleSepoliaTestnet } from "viem/chains";

export const defaultNetworkId = 5003; // Mantle Sepolia Testnet

export const movementTestnet = defineChain({
    id: 250,
    name: "Movement Bardock Testnet",
    nativeCurrency: {
        decimals: 18,
        name: "MOVE",
        symbol: "MOVE",
    },
    rpcUrls: {
        default: { http: ["https://testnet.movementnetwork.xyz/v1"] },
    },
    blockExplorers: {
        default: {
            name: "Movement Testnet Explorer",
            url: "https://explorer.movementnetwork.xyz/?network=bardock+testnet",
        },
    },
    testnet: true,
});

export const movement = defineChain({
    id: 126,
    name: "Movement",
    nativeCurrency: {
        decimals: 18,
        name: "MOVE",
        symbol: "MOVE",
    },
    rpcUrls: {
        default: { http: ["https://mainnet.movementnetwork.xyz/v1"] },
    },
    blockExplorers: {
        default: {
            name: "Movement Explorer",
            url: "https://explorer.movementnetwork.xyz/?network=mainnet",
        },
    },
    testnet: false,
});

export const supportedNetworks = [
    {
        ...mantle,
        icon: "/networks/mantle.png",
    },
    {
        ...mantleSepoliaTestnet,
        icon: "/networks/mantle.png",
    },
    {
        ...movement,
        icon: "/networks/movement.png",
    },
    {
        ...movementTestnet,
        icon: "/networks/movement.png",
    },
];
