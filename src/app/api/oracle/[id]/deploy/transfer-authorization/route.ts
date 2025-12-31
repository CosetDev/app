import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { IERC20Extended__factory, OracleFactory__factory } from "@coset-dev/contracts";

import connectDB from "@/db/connect";
import Oracle from "@/db/models/Oracles";
import { supportedNetworks } from "@/lib/networks";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; network: string }> },
) {
    const user = await getUser(await getIdTokenFromHeaders());
    if (!user) {
        return NextResponse.json({ message: "Connect your wallet to continue" }, { status: 401 });
    }

    const { id: oracleId } = await params;
    if (!oracleId) {
        return NextResponse.json({ message: "Oracle not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const networkId = searchParams.get("network");
    if (!networkId) {
        return NextResponse.json({ message: "Network not found" }, { status: 404 });
    }

    await connectDB();

    // Check if endpoint is verified
    const oracle = await Oracle.findOne({ owner: user.wallet, _id: oracleId });
    if (!oracle) {
        return NextResponse.json({ message: "Oracle not found" }, { status: 404 });
    }

    const network = supportedNetworks[networkId as keyof typeof supportedNetworks];

    const validAfter = 0;
    const validBefore = Math.floor(Date.now() / 1000) + 3600;
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const token = IERC20Extended__factory.connect(network.currency.address, network.provider);

    const factory = OracleFactory__factory.connect(process.env.ORACLE_FACTORY_ADDRESS!, network.provider);

    const [name, version, verifyingContract, factoryConfig] = await Promise.all([
        token.name(),
        token.version(),
        token.getAddress(),
        factory.config(),
    ]);

    const domain = {
        name,
        version,
        verifyingContract,
        chainId: network.id,
    };

    // EIP-712 Type
    const types = {
        TransferWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
        ],
    } as const;

    // Message
    const message = {
        from: user.wallet,
        to: process.env.NEXT_PUBLIC_OWNER_ADDRESS,
        value: factoryConfig.oracleDeployPrice.toString(),
        validAfter,
        validBefore,
        nonce,
    };

    return NextResponse.json({
        domain,
        types,
        nonce,
        message,
        primaryType: "TransferWithAuthorization",
    });
}
