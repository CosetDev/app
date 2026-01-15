import type { LanguageKey, OraclePublic } from "./types";

export function buildCodeSample(language: LanguageKey, oracle: OraclePublic | null) {
    const address = oracle?.address || "<oracle-address>";
    const network = oracle?.network || "<network>";

    if (language === "python") {
        return `from coset import CosetClient

client = CosetClient(api_key="YOUR_API_KEY")

result = client.call(
    network="${network}",
    address="${address}",
)

print(result.data)`;
    }

    if (language === "curl") {
        return `curl -X POST https://api.coset.xyz/call \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"network":"${network}","address":"${address}"}'`;
    }

    return `import { CosetClient } from "@coset/sdk";

const client = new CosetClient({ apiKey: "YOUR_API_KEY" });

async function main() {
    const response = await client.call({
        network: "${network}",
        address: "${address}",
    });

    console.log(response.data);
}

main();`;
}

export function formatCurrency(value?: number) {
    if (value === undefined || value === null) return "--";
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}
