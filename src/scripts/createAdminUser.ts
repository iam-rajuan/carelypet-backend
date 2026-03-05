import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import Admin from "../modules/admin/auth/admin.model";

config();

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment variables");
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await Admin.findOne({ email: "admin@carelypet.com" });
  if (existing) {
    console.log("Admin user already exists. Nothing to do.");
    return;
  }


  const plainPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await Admin.create({
    name: "Super Admin",
    email: "admin@carelypet.com",
    password: hashedPassword,
    isVerified: true,
  });

  console.log("Admin user created:");
  console.log(`email: admin@carelypet.com`);
  console.log(`password: ${plainPassword}`);
};

run()
  .catch((err) => {
    console.error("Failed to create admin user:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
