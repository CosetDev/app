import mongoose, { Schema, type Model, type Document, Types } from "mongoose";

export interface IKeys {
    wallet: string;
    apiKey: string;
    name: string;
}

export interface IKeysDocument extends IKeys, Document {
    _id: Types.ObjectId;
    createdAt: Date;
}

const KeysSchema = new Schema<IKeysDocument>(
    {
        wallet: { type: String, required: true, index: true },
        apiKey: { type: String, required: true, unique: true },
        name: { type: String, required: true, unique: true, index: true },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false },
);

export const Keys: Model<IKeysDocument> =
    mongoose.models.Keys || mongoose.model<IKeysDocument>("Keys", KeysSchema);
export default Keys;
