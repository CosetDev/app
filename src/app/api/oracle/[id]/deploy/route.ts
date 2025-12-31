import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) {
        return NextResponse.json({ message: "Connect your wallet to continue" }, { status: 401 });
    }

    const oracleId = (await params)?.id;
    if (!oracleId) {
        return NextResponse.json({ message: "Oracle not found" }, { status: 404 });
    }

    await connectDB();

    // Check if endpoint is verified
    const oracle = await Oracle.findOne({ owner: user.wallet, _id: oracleId });

    /// Deploy the oracle

    // Return the oracle address
}
