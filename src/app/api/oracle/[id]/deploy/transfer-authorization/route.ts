import {
    IERC20Extended__factory,
    Oracle__factory,
    OracleFactory__factory,
} from "@coset-dev/contracts";
import { ethers, Wallet, ZeroAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/db/connect";
import { fromBytes } from "@/lib/utils";
import Oracle from "@/db/models/Oracles";
import { getIdTokenFromHeaders, getUser } from "@/lib/auth";
import { availableTokens, supportedNetworks } from "@/lib/networks";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
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

    const tokenParam = searchParams.get("token");
    if (!tokenParam || !availableTokens.find(t => t.value === tokenParam)) {
        return NextResponse.json({ message: "Invalid token" }, { status: 404 });
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

    const network = supportedNetworks[networkId as keyof typeof supportedNetworks];
    const ownerWallet = new Wallet(process.env.OWNER_PRIVATE_KEY!);

    const currency = network.currencies.find(t => t.label === tokenParam);
    if (!currency) {
        return NextResponse.json(
            { message: "Token not supported on this network" },
            { status: 400 },
        );
    }

    try {
        const validAfter = 0;
        const validBefore = Math.floor(Date.now() / 1000) + 3600;
        const nonce = ethers.hexlify(ethers.randomBytes(32));
        const token = IERC20Extended__factory.connect(currency.address, network.provider);
        const factory = OracleFactory__factory.connect(
            process.env.NEXT_PUBLIC_ORACLE_FACTORY_ADDRESS!,
            network.provider,
        );

        const [name, version, verifyingContract, factoryConfig] = await Promise.all([
            token.name(),
            token.version(),
            token.getAddress(),
            factory.config(),
        ]);

        const domain = {
            name,
            version,
            chainId: network.id,
            verifyingContract,
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

        let oneUsdcInCst: bigint = BigInt(0);
        let oracleDeployPrice = factoryConfig.oracleDeployPrice;
        if (currency.symbol === "CST") {
            const cstPriceOracleAddress = await factory.cstPriceOracle();
            if (cstPriceOracleAddress === ZeroAddress) {
                NextResponse.json(
                    { message: "CST price oracle is not set in the factory contract" },
                    { status: 400 },
                );
                return;
            }
            const cstPriceOracle = Oracle__factory.connect(cstPriceOracleAddress, network.provider);
            oneUsdcInCst = BigInt(fromBytes(await cstPriceOracle.getDataWithoutCheck()));
            oracleDeployPrice = (factoryConfig.oracleDeployPrice * oneUsdcInCst) / BigInt(1e6);
        }

        // Message
        const message = {
            from: user.wallet,
            to: ownerWallet.address,
            value: oracleDeployPrice.toString(),
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
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Failed to create transfer authorization" },
            { status: 500 },
        );
    }
}
