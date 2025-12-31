import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IUsage {
    oracle: Types.ObjectId;
    count: number;
}

export interface IUsageDocument extends IUsage, Document {
    _id: Types.ObjectId;
    updatedAt: Date;
}

const UsageSchema = new Schema<IUsageDocument>(
    {
        oracle: { type: Schema.Types.ObjectId, ref: "Oracle", required: true, unique: true },
        count: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false },
);

export const Usage: Model<IUsageDocument> =
    mongoose.models.Usage || mongoose.model<IUsageDocument>("Usage", UsageSchema);
export default Usage;
