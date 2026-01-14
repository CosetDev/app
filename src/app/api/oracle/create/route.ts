import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) {
        return NextResponse.json({ message: "Connect your wallet to continue" }, { status: 401 });
    }

    const body = await request.json();
    let { price, duration } = body;
    const { name, description, endpoint } = body;

    price = Number(price);
    duration = duration ? Number(duration) : undefined;

    const schema = z.object({
        name: z.string().min(3).max(64),
        price: z.number().min(0),
        description: z.string().max(1024).optional(),
        endpoint: z
            .string()
            .url()
            .refine(v => v.startsWith("https://"), {
                message: "Only HTTPS is allowed",
            })
            .max(256),
        duration: z.number().min(0).max(31536000000).optional(), // 1 year in ms
    });

    const result = schema.safeParse({ name, price, description, endpoint, duration });

    if (!result.success) {
        return NextResponse.json(
            { message: Object.values(result.error.flatten().fieldErrors)[0]?.[0] },
            { status: 400 },
        );
    }

    await connectDB();

    const oracle = new Oracle({
        name,
        description,
        requestPrice: price,
        verifications: {
            api: false,
            signature: null,
        },
        api: {
            protocol: "https",
            url: endpoint,
        },
        owner: user.wallet,
        recommendedUpdateDuration: duration || undefined,
    });
    const savedOracle = await oracle.save();

    return NextResponse.json({
        id: savedOracle._id.toString(),
        oracle: {
            name,
            description,
            endpoint,
            price,
            duration: duration || undefined,
        },
    });
}
