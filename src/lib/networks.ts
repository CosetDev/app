import { JsonRpcProvider } from "ethers";

export type Network = {
    id: number;
    name: string;
    testnet?: boolean;
    native: string;
    rpc: string;
    currency: {
        decimals: number;
        name: string;
        symbol: string;
        version: string;
        address: string;
    };
    icon: string;
    eip155: `eip155:${number}`;
    provider: JsonRpcProvider;
};

export const defaultNetworkId = 5003; // Mantle Sepolia Testnet

export const baseNetworks: Record<string, Omit<Network, "eip155" | "provider" | "name">> = {
    "mantle-testnet": {
        id: 5003,
        testnet: true,
        native: "MNT",
        rpc: "https://rpc.sepolia.mantle.xyz",
        currency: {
            decimals: 6,
            name: "Testnet USDC",
            symbol: "TUSDC",
            version: "2",
            address: "0x05856b07544044873616d390Cc50c785fe8a8885",
        },
        icon: "/networks/mantle.png",
    },
    mantle: {
        id: 5000,
        testnet: false,
        native: "MNT",
        rpc: "https://rpc.mantle.xyz",
        currency: {
            decimals: 6,
            name: "USD Coin",
            symbol: "USDC",
            version: "2",
            address: "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9",
        },
        icon: "/networks/mantle.png",
    },
};

export const supportedNetworks = Object.fromEntries(
    Object.entries(baseNetworks).map(([key, net]) => [
        key,
        {
            ...net,
            name: key,
            eip155: `eip155:${net.id}`,
            provider: new JsonRpcProvider(net.rpc),
        },
    ]),
) as Record<string, Network>;
