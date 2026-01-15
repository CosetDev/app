import { ethers, JsonRpcProvider, parseUnits } from "ethers";
import { NextResponse, type NextRequest } from "next/server";

import connectDB from "@/db/connect";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";
import { baseNetworks, supportedNetworks } from "@/lib/networks";
import FaucetClaims, { type FaucetToken } from "@/db/models/FaucetClaims";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const FAUCET_CONFIG: Record<FaucetToken, { amount: string }> = {
    USDC: { amount: parseUnits("50", 6).toString() },
    CST: { amount: parseUnits("20", 6).toString() },
};

export async function POST(request: NextRequest) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const token = body?.token as keyof typeof FAUCET_CONFIG | undefined;

    if (!token) {
        return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    const networkName = body?.network as string | undefined;

    if (!networkName || !baseNetworks?.[networkName]) {
        return NextResponse.json({ message: "Invalid network" }, { status: 400 });
    }

    const network = supportedNetworks[networkName as keyof typeof supportedNetworks];
    const currency = network.currencies.find(t => t.label === token);

    if (!currency) {
        return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    await connectDB();

    const last = await FaucetClaims.findOne({ wallet: user.wallet, token }).sort({ createdAt: -1 });
    const now = Date.now();

    if (last?.createdAt) {
        const elapsed = now - new Date(last.createdAt).getTime();
        if (elapsed < COOLDOWN_MS) {
            const nextClaimAt = new Date(new Date(last.createdAt).getTime() + COOLDOWN_MS);
            return NextResponse.json(
                {
                    message: "Faucet cooldown active",
                    token,
                    nextClaimAt: nextClaimAt.toISOString(),
                    remainingMs: COOLDOWN_MS - elapsed,
                },
                { status: 429 },
            );
        }
    }

    const amount = FAUCET_CONFIG[token].amount;

    // Record the claim first
    const claim = await FaucetClaims.create({
        wallet: user.wallet,
        token,
        amount,
    });

    const tokenContract = new ethers.Contract(
        currency.address,
        [
            "function transfer(address to, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)",
        ],
        new ethers.Wallet(
            process.env.OWNER_PRIVATE_KEY!,
            new JsonRpcProvider(baseNetworks[networkName].rpc),
        ),
    );

    const tx = await tokenContract.transfer(user.wallet, amount);

    await tx.wait();

    return NextResponse.json({
        ok: true,
        token,
        amount,
        claimedAt: claim.createdAt.toISOString(),
        nextClaimAt: new Date(claim.createdAt.getTime() + COOLDOWN_MS).toISOString(),
    });
}
