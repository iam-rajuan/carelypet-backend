import mongoose, { Connection } from "mongoose";

const connectDB = async (uri?: string): Promise<Connection> => {
  if (!uri) {
    throw new Error("MONGO_URI is missing");
  }

  mongoose.set("strictQuery", true);
  const { connection } = await mongoose.connect(uri);
  return connection;
};

export default connectDB;
