import { NextRequest, NextResponse } from "next/server";

import Keys from "@/db/models/Keys";
import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) {
        return NextResponse.json({ message: "Connect your wallet to continue" }, { status: 401 });
    }

    const oracleId = (await params)?.id;
    const { keyName } = await request.json();

    if (!keyName) {
        return NextResponse.json({ message: "API key not found" }, { status: 400 });
    }
    if (!oracleId) {
        return NextResponse.json({ message: "Oracle not found" }, { status: 400 });
    }

    await connectDB();
    const [oracle, key] = await Promise.all([
        Oracle.findOne({ owner: user.wallet, _id: oracleId }),
        Keys.findOne({ wallet: user.wallet, name: keyName }),
    ]);

    if (!oracle) {
        return NextResponse.json({ message: "Oracle not found" }, { status: 404 });
    }
    if (!key) {
        return NextResponse.json({ message: "API key not found" }, { status: 404 });
    }

    const url = new URL(oracle.api.url);
    url.searchParams.set("test", "true");
    const finalUrl = url.toString();

    const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${key.apiKey}`,
        },
    });

    if (response.status === 401) {
        return NextResponse.json(
            {
                message:
                    "Unauthorized to access the API. Be sure to use the correct API key in your endpoint.",
            },
            { status: 403 },
        );
    }

    if (!response.ok) {
        return NextResponse.json(
            { message: "Error fetching data from oracle endpoint" },
            { status: 403 },
        );
    }

    const data = JSON.stringify(await response.json());

    await Oracle.updateOne(
        {
            _id: oracleId,
        },
        {
            $set: {
                "api.accessToken": key.apiKey,
                "verifications.api": true,
            },
        },
    );

    return NextResponse.json({ data });
}
