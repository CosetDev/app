import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 10));
    const query = (searchParams.get("q") || "").trim();

    await connectDB();

    const baseMatch: Record<string, unknown> = {
        "verifications.api": true,
        "verifications.signature": { $type: "string", $nin: [null, ""] },
    };

    if (query) {
        baseMatch.$or = [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ];
    }

    const total = await Oracle.countDocuments(baseMatch);

    const pipeline = [
        { $match: baseMatch },
        {
            $addFields: {
                nameMatch: query
                    ? {
                          $cond: [
                              { $regexMatch: { input: "$name", regex: query, options: "i" } },
                              1,
                              0,
                          ],
                      }
                    : 0,
            },
        },
        {
            $sort: {
                nameMatch: -1 as -1,
                createdAt: -1 as -1,
            },
        },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
        {
            $project: {
                id: "$_id",
                name: 1,
                description: 1,
                requestPrice: 1,
                recommendedUpdateDuration: 1,
                createdAt: 1,
            },
        },
    ];

    const items = await Oracle.aggregate(pipeline);

    return NextResponse.json({ items, total, page, pageSize });
}
