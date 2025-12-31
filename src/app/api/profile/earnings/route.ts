import { NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import Payment from "@/db/models/Payments";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

type EarningsPoint = {
    date: string;
    totalPaid: number;
    providerEarning: number;
    gasFee: number;
    platformFee: number;
};

type OracleSeriesPoint = {
    oracle: string;
    date: string;
    providerEarning: number;
};

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

    const oracleEarnings = await Payment.aggregate<OracleSeriesPoint>([
        { $match: { oracle: { $in: oracleIds } } },
        {
            $group: {
                _id: {
                    oracle: "$oracle",
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                },
                providerEarning: { $sum: "$providerEarning" },
            },
        },
        {
            $project: {
                _id: 0,
                oracle: "$_id.oracle",
                date: "$_id.date",
                providerEarning: 1,
            },
        },
        { $sort: { date: 1 } },
    ]);

    const oracleNameMap = new Map<string, string>();
    ownedOracles.forEach(o => {
        const id = o._id.toString();
        const name = (o as { name?: string })?.name;
        oracleNameMap.set(id, name || id);
    });

    const earningsSeries = earningsByDay.sort((a, b) => a.date.localeCompare(b.date));

    const oracleSeries = oracleEarnings.reduce<
        Record<string, { name: string; points: OracleSeriesPoint[] }>
    >((acc, row) => {
        const key = row.oracle.toString();
        if (!acc[key]) {
            acc[key] = { name: oracleNameMap.get(key) || key, points: [] };
        }
        acc[key].points.push(row);
        return acc;
    }, {});

    return NextResponse.json({
        earningsSeries,
        oracleSeries: Object.entries(oracleSeries).map(([oracle, value]) => ({
            oracle,
            name: value.name,
            points: value.points,
        })),
    });
}
