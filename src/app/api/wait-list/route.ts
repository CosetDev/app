import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db/connect";
import WaitList from "@/db/models/WaitList";
import { isAddress } from "ethers";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) {
        return NextResponse.json({ message: "Connect your wallet to continue" }, { status: 401 });
    }

    const body = await request.json();
    const { email, wallet } = body;

    const schema = z.object({
        email: z.email().max(256),
        wallet: z.string().refine(value => isAddress(value), {
            message: "Invalid wallet address",
        }),
    });

    const result = schema.safeParse({ email, wallet });

    if (!result.success) {
        return NextResponse.json(
            { message: Object.values(result.error.flatten().fieldErrors)[0]?.[0] },
            { status: 400 },
        );
    }

    await connectDB();

    const waitList = new WaitList({
        email,
        wallet,
    });

    try {
        await waitList.save();
        return NextResponse.json("Successfully added to wait list", { status: 200 });
    } catch (error: unknown) {
        if (
            (
                error as {
                    code: number;
                }
            ).code === 11000
        ) {
            return NextResponse.json(
                { message: "Email already in the wait list" },
                { status: 400 },
            );
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
