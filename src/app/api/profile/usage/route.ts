import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import Usage from "@/db/models/Usage";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

type UsagePoint = { date: string; usage: number };

export async function GET() {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const ownedOracles = await Oracle.find(
        {
            owner: user.wallet,
            "verifications.api": true,
            "verifications.signature": { $exists: true, $ne: null },
        },
        { _id: 1 },
    ).lean();
    const oracleIds = ownedOracles.map(o => o._id);

    const usageByDay = await Usage.aggregate<UsagePoint>([
        { $match: { oracle: { $in: oracleIds } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                usage: { $sum: "$count" },
            },
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                usage: 1,
            },
        },
    ]);

    const usageSeries = usageByDay.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ usageSeries });
}
