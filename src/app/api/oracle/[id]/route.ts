import { NextResponse, type NextRequest } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = (await params)?.id;
    if (!id) return NextResponse.json({ message: "Oracle id required" }, { status: 400 });

    await connectDB();

    const oracle = await Oracle.findOne({ _id: id, owner: user.wallet }).lean();
    if (!oracle) return NextResponse.json({ message: "Oracle not found" }, { status: 404 });

    return NextResponse.json({
        id: oracle._id.toString(),
        name: oracle.name,
        description: oracle.description,
        api: oracle.api,
        verifications: oracle.verifications,
        owner: oracle.owner,
        network: oracle.network ?? null,
        address: oracle.address ?? null,
        requestPrice: oracle.requestPrice,
        recommendedUpdateDuration: oracle.recommendedUpdateDuration,
        createdAt: oracle.createdAt,
        deploymentTx: oracle.deploymentTx ?? null,
    });
}
