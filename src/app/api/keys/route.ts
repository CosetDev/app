import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import connectDB from "@/db/connect";
import Keys, { type IKeysDocument } from "@/db/models/Keys";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

type APIKeySummary = {
    id: string;
    name: string;
    key: string;
    createdAt: string;
};

export async function GET() {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const keys = await Keys.find({ wallet: user.wallet }).sort({ createdAt: -1 });

    return NextResponse.json({ keys: keys.map(serializeKey) });
}

export async function POST(request: NextRequest) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const name = (body?.name as string | undefined)?.trim();

    if (!name || name.length < 3)
        return NextResponse.json(
            { message: "Key name must be at least 3 characters" },
            { status: 400 },
        );
    if (name.length > 64)
        return NextResponse.json(
            { message: "Key name must be less than 64 characters" },
            { status: 400 },
        );

    await connectDB();

    const apiKey = randomBytes(32).toString("hex");
    let record: IKeysDocument;

    try {
        record = await Keys.create({
            wallet: user.wallet,
            apiKey,
            name,
        });
    } catch {
        return NextResponse.json(
            { message: "A key with this name already exists" },
            { status: 400 },
        );
    }

    return NextResponse.json({ secret: apiKey, summary: serializeKey(record) });
}

function serializeKey(doc: IKeysDocument): APIKeySummary {
    return {
        id: doc._id.toString(),
        name: doc.name,
        key: maskKey(doc.apiKey),
        createdAt: doc.createdAt.toISOString(),
    };
}

function maskKey(key: string) {
    if (typeof key !== "string" || key.length <= 12) return key;
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
