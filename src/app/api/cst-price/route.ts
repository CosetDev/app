import { parseUnits } from "ethers";

export function GET() {
    const oneUsdcInCst = Number(parseUnits("2", 6));
    return new Response(JSON.stringify(oneUsdcInCst), { status: 200 });
}
