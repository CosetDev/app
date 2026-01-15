import { JsonRpcProvider } from "ethers";

export type HexAddress = `0x${string}`;

export type Currency = {
    decimals: number;
    name: string;
    symbol: string;
    version: string;
    label: string;
    address: HexAddress;
};

export type Network = {
    id: number;
    name: string;
    testnet?: boolean;
    native: string;
    rpc: string;
    currencies: Currency[];
    key: string;
    icon: string;
    eip155: `eip155:${number}`;
    provider: JsonRpcProvider;
};

export const defaultNetworkId = 5003; // Mantle Sepolia Testnet

export const baseNetworks: Record<string, Omit<Network, "eip155" | "provider" | "key">> = {
    "mantle-testnet": {
        id: 5003,
        testnet: true,
        native: "MNT",
        name: "Mantle Testnet",
        rpc: "https://rpc.sepolia.mantle.xyz",
        currencies: [
            {
                decimals: 6,
                name: "Testnet USDC",
                symbol: "TUSDC",
                label: "USDC",
                version: "2",
                address: "0x05856b07544044873616d390Cc50c785fe8a8885",
            },
            {
                decimals: 6,
                name: "Coset",
                symbol: "CST",
                label: "CST",
                version: "1",
                address: "0x77A90090C9bcc45940E18657fB82Fb70A2D494fd",
            },
        ],
        icon: "/networks/mantle.png",
    },
    mantle: {
        id: 5000,
        testnet: false,
        native: "MNT",
        name: "Mantle",
        rpc: "https://rpc.mantle.xyz",
        currencies: [
            {
                decimals: 6,
                name: "USD Coin",
                symbol: "USDC",
                label: "USDC",
                version: "2",
                address: "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9",
            },
            {
                decimals: 6,
                name: "Coset",
                symbol: "CST",
                label: "CST",
                version: "1",
                address: "0x77A90090C9bcc45940E18657fB82Fb70A2D494fd",
            },
        ],
        icon: "/networks/mantle.png",
    },
};

export const supportedNetworks = Object.fromEntries(
    Object.entries(baseNetworks).map(([key, net]) => [
        key,
        {
            ...net,
            key,
            eip155: `eip155:${net.id}`,
            provider: new JsonRpcProvider(net.rpc),
        },
    ]),
) as Record<string, Network>;

// Tokens
export type TokenType = "USDC" | "CST";
export const availableTokens: { value: TokenType; label: string; icon: string }[] = [
    { value: "USDC", label: "USDC", icon: "/coins/usdc.svg" },
    { value: "CST", label: "CST", icon: "/logo.svg" },
];
