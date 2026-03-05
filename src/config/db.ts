import mongoose, { Connection } from "mongoose";

const connectDB = async (uri?: string): Promise<Connection> => {
  if (!uri) {
    throw new Error("MONGO_URI is missing");
  }

  mongoose.set("strictQuery", true);
  const { connection } = await mongoose.connect(uri, {
    maxPoolSize: 30,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  return connection;
};

export default connectDB;
