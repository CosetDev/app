import { NextResponse, type NextRequest } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import Payment from "@/db/models/Payments";

type EarningsPoint = {
    date: string;
    totalPaid: number;
    providerEarning: number;
    gasFee: number;
    platformFee: number;
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const id = (await params)?.id;
    if (!id) return NextResponse.json({ message: "Oracle id required" }, { status: 400 });

    await connectDB();

    const oracle = await Oracle.findById(id).lean();
    if (!oracle) return NextResponse.json({ message: "Oracle not found" }, { status: 404 });

    const earningsByDay = await Payment.aggregate<EarningsPoint>([
        { $match: { oracle: oracle._id } },
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
        { $sort: { date: 1 } },
    ]);

    return NextResponse.json({
        id: oracle._id.toString(),
        name: oracle.name,
        description: oracle.description,
        requestPrice: oracle.requestPrice,
        recommendedUpdateDuration: oracle.recommendedUpdateDuration ?? null,
        network: oracle.network ?? null,
        owner: oracle.owner,
        address: oracle.address ?? null,
        earningsSeries: earningsByDay,
    });
}
