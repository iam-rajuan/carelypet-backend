import mongoose, { Document, Model } from "mongoose";

export type UserRole = "user" | "provider" | "admin";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      sparse: true, // allows phone-only users
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
