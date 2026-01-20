import { JsonRpcProvider } from "ethers";
import { cronosTestnet } from "viem/chains";

export type HexAddress = `0x${string}`;

export type Currency = {
    decimals: number;
    name: string;
    symbol: string;
    version: string;
    label: string;
    address: HexAddress;
    icon: string;
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
    factory: HexAddress;
};

export const defaultNetworkId = 5003; // Mantle Sepolia Testnet

export const baseNetworks: Record<string, Omit<Network, "eip155" | "provider" | "key">> = {
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
                icon: "/coins/usdc.svg",
            },
            {
                decimals: 6,
                name: "Coset",
                symbol: "CST",
                label: "CST",
                version: "1",
                address: "0x77A90090C9bcc45940E18657fB82Fb70A2D494fd",
                icon: "/logo.svg",
            },
        ],
        factory: "0xBFB972Aa2dd738056e8A59c3073a774642320aa9",
        icon: "/networks/mantle.png",
    },
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
                icon: "/coins/usdc.svg",
            },
            {
                decimals: 6,
                name: "Coset",
                symbol: "CST",
                label: "CST",
                version: "1",
                address: "0x77A90090C9bcc45940E18657fB82Fb70A2D494fd",
                icon: "/logo.svg",
            },
        ],
        factory: "0xBFB972Aa2dd738056e8A59c3073a774642320aa9",
        icon: "/networks/mantle.png",
    },
    cronos: {
        id: 25,
        testnet: false,
        name: "Cronos",
        native: "CRO",
        rpc: "https://evm.cronos.org",
        currencies: [
            {
                decimals: 6,
                name: "Bridged USDC",
                symbol: "USDC.e",
                version: "2",
                address: "0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C",
                label: "USDC",
                icon: "/coins/usdc.svg",
            },
            {
                decimals: 6,
                name: "Coset",
                symbol: "CST",
                version: "1",
                address: "0x6e0a0ba0e4e7433e65e6b4a12860baf43b0b8f06",
                label: "CST",
                icon: "/logo.svg",
            },
        ],
        factory: "0xA3117b4E81134ccc23e41e7a8E27FBB9b288a718",
        icon: "/networks/cronos.svg",
    },
    "cronos-testnet": {
        id: 338,
        testnet: true,
        name: "Cronos Testnet",
        native: "CRO",
        rpc: "https://evm-t3.cronos.org",
        currencies: [
            {
                decimals: 6,
                name: "Testnet USDC",
                symbol: "TUSDC",
                version: "2",
                address: "0xb1BF5CA11a4C4f95ab46B496757E1DBb1397eC0a",
                label: "USDC",
                icon: "/coins/usdc.svg",
            },
            {
                decimals: 6,
                name: "Coset",
                symbol: "CST",
                version: "1",
                address: "0x6e0a0ba0e4e7433e65e6b4a12860baf43b0b8f06",
                label: "CST",
                icon: "/logo.svg",
            },
        ],
        factory: "0xA3117b4E81134ccc23e41e7a8E27FBB9b288a718",
        icon: "/networks/cronos.svg",
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

