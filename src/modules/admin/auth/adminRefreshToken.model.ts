import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAdminRefreshToken extends Document {
  admin: Types.ObjectId;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminRefreshTokenSchema = new Schema<IAdminRefreshToken>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

const AdminRefreshToken: Model<IAdminRefreshToken> = mongoose.model<IAdminRefreshToken>(
  "AdminRefreshToken",
  adminRefreshTokenSchema
);

export default AdminRefreshToken;
