import { NextResponse, type NextRequest } from "next/server";

import Keys from "@/db/models/Keys";
import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = (await params)?.id;
    if (!id) return NextResponse.json({ message: "Key ID is required" }, { status: 400 });

    await connectDB();

    const key = await Keys.findOne({ _id: id, wallet: user.wallet });
    if (!key) return NextResponse.json({ message: "Key not found" }, { status: 404 });

    // Check if key is used in any endpoint
    const keyInUse = await Oracle.findOne({ owner: user.wallet, "api.accessToken": key.apiKey });
    if (keyInUse)
        return NextResponse.json(
            {
                message:
                    "Key is in use, change your endpoint's API key to something else before deleting this one.",
            },
            { status: 400 },
        );

    await Keys.findOneAndDelete({ _id: id, wallet: user.wallet });

    return NextResponse.json({ ok: true });
}
