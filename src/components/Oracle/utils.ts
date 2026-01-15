import type { OraclePublic } from "./types";

export function buildCodeSample(language: string, oracle: OraclePublic | null) {
    const address = oracle?.address || "<oracle-address>";
    const network = oracle?.network || "<network>";

    return `import { Coset, Networks, PaymentToken } from "@coset-dev/sdk";

const coset = new Coset(
    "${network}" as Networks,
    PaymentToken.CST,
    "${address}",
    process.env.WALLET_PRIVATE_KEY as \`0x\${string}\`,
);

async function main() {
    return await coset.read();
}

main();`;
}

export function formatCurrency(value?: number) {
    if (value === undefined || value === null) return "--";
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}
