import mongoose from "mongoose";

interface Cached {
    connection?: typeof mongoose;
    promise?: Promise<typeof mongoose>;
}

const MONGO_URI = process.env.MONGO_URI;
const cached: Cached = {};

async function connectDB() {
    if (!MONGO_URI) throw "MONGO_URI is undefined";
    if (cached.connection) return cached.connection;

    if (!cached.promise) {
        const opts = { bufferCommands: false };
        cached.promise = mongoose.connect(MONGO_URI, opts);
    }

    try {
        cached.connection = await cached.promise;
    } catch (e) {
        cached.promise = undefined;
        throw e;
    }

    return cached.connection;
}

export default connectDB;
