import { JsonRpcProvider } from "ethers";
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";
import { availableTokens, baseNetworks } from "@/lib/networks";
import { OracleFactory__factory } from "@coset-dev/contracts";

export async function POST(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    },
) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) {
        return NextResponse.json({ message: "Connect your wallet to continue" }, { status: 401 });
    }

    const { id: oracleId } = await params;
    if (!oracleId) {
        return NextResponse.json({ message: "Oracle not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const networkName = searchParams.get("network") || "";
    const token = searchParams.get("token") || "";

    // Get network
    const network = baseNetworks[networkName];
    if (!networkName || !network) {
        return NextResponse.json({ message: "Invalid network" }, { status: 404 });
    }
    if (!token || !availableTokens.find(t => t.value === token)) {
        return NextResponse.json({ message: "Invalid token" }, { status: 404 });
    }

    const provider = new JsonRpcProvider(network.rpc);

    // Get transaction hash
    const { tx: txHash } = await request.json();
    if (!txHash) {
        return NextResponse.json({ message: "Transaction not found" }, { status: 400 });
    }

    await connectDB();

    // Check if endpoint is verified
    const oracle = await Oracle.findOne({ owner: user.wallet, _id: oracleId });
    if (!oracle) {
        return NextResponse.json({ message: "Oracle not found" }, { status: 404 });
    }
    if (!oracle.verifications.api) {
        return NextResponse.json({ message: "Endpoint not verified" }, { status: 400 });
    }

    // Get transaction
    const transaction = await provider.getTransactionReceipt(txHash);
    console.log(JSON.stringify(transaction, null, 2));

    if (transaction?.status === 0 || transaction?.logs?.length === 0) {
        return NextResponse.json({ message: "Deployment transaction failed" }, { status: 400 });
    }

    const deployedEvents = transaction?.logs
        .map(log => {
            try {
                return OracleFactory__factory.createInterface().parseLog(log);
            } catch {
                return null;
            }
        })
        .filter(log => log !== null && log.name === "OracleDeployed");

    console.log(deployedEvents);
    if (deployedEvents?.length === 0) {
        return NextResponse.json(
            { message: "Invalid transaction has been received" },
            { status: 400 },
        );
    }

    const oracleAddress = deployedEvents?.[0]!.args[0];

    // Update oracle record
    oracle.verifications = {
        ...oracle.verifications,
        signature: txHash,
    };
    oracle.address = oracleAddress;
    oracle.network = networkName;

    await oracle.save();

    return NextResponse.json({ id: oracle._id.toString() });
}
