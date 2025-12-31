import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import Usage from "@/db/models/Usage";
import Payment from "@/db/models/Payments";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

type UsagePoint = { date: string; usage: number };
type EarningsPoint = {
    date: string;
    totalPaid: number;
    providerEarning: number;
    gasFee: number;
    platformFee: number;
};

export async function GET() {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const ownedOracles = await Oracle.find({ owner: user.wallet }, { _id: 1 }).lean();
    const oracleIds = ownedOracles.map(o => o._id);

    // Usage grouped by day from Usage.updatedAt
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

    // Earnings grouped by day
    const earningsByDay = await Payment.aggregate<EarningsPoint>([
        { $match: { oracle: { $in: oracleIds } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalPaid: { $sum: "$totalPaid" },
                providerEarning: { $sum: "$providerEarning" },
                gasFee: { $sum: "$gasFee" },
                platformFee: { $sum: "$platformFee" },
            },
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                totalPaid: 1,
                providerEarning: 1,
                gasFee: 1,
                platformFee: 1,
            },
        },
    ]);

    const usageSeries = usageByDay.sort((a, b) => a.date.localeCompare(b.date));
    const earningsSeries = earningsByDay.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ usageSeries, earningsSeries });
}
