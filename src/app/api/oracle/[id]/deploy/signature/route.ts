import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { OracleFactory__factory } from "@coset-dev/contracts";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; network: string }> },
) {
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

    const iface = OracleFactory__factory.createInterface();
    const message = iface.encodeFunctionData("deployOracle", [
        oracle.recommendedUpdateDuration || 0,
        oracle.requestPrice,
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
