import mongoose, { Schema, type Model, type Document, Types } from "mongoose";

export type FaucetToken = "USDC" | "CST";

export interface IFaucetClaim {
    wallet: string;
    token: FaucetToken;
    /**
     * Amount recorded for audit purposes. Keep as string so you can store base-units later
     * without precision loss.
     */
    amount: string;
    /** Optional tx hash once token sending is implemented. */
    txHash?: string | null;
    /** Optional freeform metadata (network, contract address, etc.). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta?: any;
}

export interface IFaucetClaimDocument extends IFaucetClaim, Document {
    _id: Types.ObjectId;
    createdAt: Date;
}

const FaucetClaimSchema = new Schema<IFaucetClaimDocument>(
    {
        wallet: { type: String, required: true, index: true },
        token: { type: String, required: true, enum: ["USDC", "CST"], index: true },
        amount: { type: String, required: true },
        txHash: { type: String, default: null },
        meta: { type: Schema.Types.Mixed, default: null },
        createdAt: { type: Date, default: Date.now, index: true },
    },
    { versionKey: false },
);

FaucetClaimSchema.index({ wallet: 1, token: 1, createdAt: -1 });

export const FaucetClaims: Model<IFaucetClaimDocument> =
    mongoose.models.FaucetClaims ||
    mongoose.model<IFaucetClaimDocument>("FaucetClaims", FaucetClaimSchema);

export default FaucetClaims;

