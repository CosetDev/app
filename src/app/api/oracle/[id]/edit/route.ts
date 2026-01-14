import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) {
        return NextResponse.json({ message: "Connect your wallet to continue" }, { status: 401 });
    }

    const id = (await params)?.id;
    if (!id) {
        return NextResponse.json({ message: "Oracle id required" }, { status: 400 });
    }

    const body = await request.json();

    const schema = z.object({
        name: z.string().min(3).max(64),
        description: z.string().max(1024).optional(),
    });

    const result = schema.safeParse(body);

    if (!result.success) {
        return NextResponse.json(
            { message: Object.values(result.error.flatten().fieldErrors)[0]?.[0] },
            { status: 400 },
        );
    }

    await connectDB();

    const oracle = await Oracle.findOne({ _id: id, owner: user.wallet });
    if (!oracle) {
        return NextResponse.json({ message: "Oracle not found" }, { status: 404 });
    }

    oracle.name = result.data.name;
    if (result.data.description !== undefined) {
        oracle.description = result.data.description;
    }

    await oracle.save();

    return NextResponse.json({
        id: oracle._id.toString(),
        name: oracle.name,
        description: oracle.description,
    });
}
