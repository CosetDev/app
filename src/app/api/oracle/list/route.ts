import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";
import Oracle, { type IOracleDocument } from "@/db/models/Oracles";

type OracleSummary = Pick<
    IOracleDocument,
    | "_id"
    | "name"
    | "description"
    | "api"
    | "verifications"
    | "owner"
    | "network"
    | "address"
    | "requestPrice"
    | "recommendedUpdateDuration"
    | "createdAt"
>;

export async function GET() {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const oracles = await Oracle.find({ owner: user.wallet }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ oracles: oracles.map(serializeOracle) });
}

function serializeOracle(doc: OracleSummary) {
    return {
        id: doc._id.toString(),
        name: doc.name,
        description: doc.description,
        api: doc.api,
        verifications: doc.verifications,
        owner: doc.owner,
        network: doc.network || null,
        address: doc.address || null,
        requestPrice: doc.requestPrice,
        recommendedUpdateDuration: doc.recommendedUpdateDuration,
        createdAt: doc.createdAt,
    };
}
