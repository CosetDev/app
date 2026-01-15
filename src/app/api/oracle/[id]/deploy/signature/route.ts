import { ethers, parseUnits } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { OracleFactory__factory } from "@coset-dev/contracts";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";
import { availableTokens, supportedNetworks } from "@/lib/networks";

export async function POST(req: NextRequest) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) {
        return NextResponse.json({ message: "Connect your wallet to continue" }, { status: 401 });
    }

    const { validAfter, validBefore, nonce, sig, id: oracleId } = await req.json();
    if (!oracleId) return NextResponse.json({ message: "Oracle not found" }, { status: 404 });

    await connectDB();

    const oracle = await Oracle.findOne({ owner: user.wallet, _id: oracleId }).lean();
    if (!oracle) return NextResponse.json({ message: "Oracle not found" }, { status: 404 });
    if (!oracle.verifications.api)
        return NextResponse.json({ message: "Endpoint not verified" }, { status: 400 });

    // Get initial data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let initialData: any;
    try {
        const webhookRes = await fetch(oracle.api.url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${oracle.api.accessToken}`,
            },
        });
        initialData = await webhookRes.json();
    } catch {
        return NextResponse.json(
            { message: "Failed to fetch initial data from the oracle endpoint" },
            { status: 400 },
        );
    }
    const searchParams = req.nextUrl.searchParams;
    const networkId = searchParams.get("network");
    if (!networkId) {
        return NextResponse.json({ message: "Network not found" }, { status: 404 });
    }

    const tokenParam = searchParams.get("token");
    if (!tokenParam || !availableTokens.find(t => t.value === tokenParam)) {
        return NextResponse.json({ message: "Invalid token" }, { status: 404 });
    }

    const network = supportedNetworks[networkId as keyof typeof supportedNetworks];

    const currency = network.currencies.find(t => t.label === tokenParam);
    if (!currency) {
        return NextResponse.json(
            { message: "Token not supported on this network" },
            { status: 400 },
        );
    }

    const iface = OracleFactory__factory.createInterface();
    const message = iface.encodeFunctionData("deployOracle", [
        currency.address,
        oracle.recommendedUpdateDuration || 0,
        parseUnits(oracle.requestPrice.toString(), currency.decimals),
        ethers.toUtf8Bytes(JSON.stringify(initialData)),
        validAfter,
        validBefore,
        nonce,
        sig.v,
        sig.r,
        sig.s,
    ]);

    return NextResponse.json({ message });
}
