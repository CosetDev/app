import mongoose, { Schema, type Model, type Document, Types } from "mongoose";

export interface IWaitList {
    email: string;
    wallet: string;
}

export interface IWaitListDocument extends IWaitList, Document {
    _id: Types.ObjectId;
    createdAt: Date;
}

const WaitListSchema = new Schema<IWaitListDocument>(
    {
        email: { type: String, required: true, unique: true },
        wallet: { type: String, required: true, unique: true },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false },
);

export const WaitList: Model<IWaitListDocument> =
    mongoose.models.WaitList || mongoose.model<IWaitListDocument>("WaitList", WaitListSchema);

export default WaitList;
