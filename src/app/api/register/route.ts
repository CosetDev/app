import User from "@/db/models/Users";
import connectDB from "@/db/connect";
import { NextResponse } from "next/server";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export const POST = async () => {
    try {
        const _user = await getUser(await getIdTokenFromHeaders());
        if (!_user) {
            return NextResponse.json(
                { message: "Connect your wallet to continue" },
                { status: 401 },
            );
        }

        await connectDB();

        const user = await User.findOne({ privyId: _user.id });
        if (!user) {
            await User.create({
                privyId: _user.id,
                email: _user.email,
                wallet: _user.wallet,
            });
        }

        return NextResponse.json("Successfully registered", { status: 200 });
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
};
