import mongoose, { Document, Model, Schema } from "mongoose";

export type AdoptionRequestStatus = "pending" | "delivered";

export interface IAdoptionRequest extends Document {
  listing: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  status: AdoptionRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const adoptionRequestSchema = new Schema<IAdoptionRequest>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "AdoptionListing", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "delivered"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

adoptionRequestSchema.index({ listing: 1, customer: 1 }, { unique: true });

const AdoptionRequest: Model<IAdoptionRequest> = mongoose.model<IAdoptionRequest>(
  "AdoptionRequest",
  adoptionRequestSchema
);

export default AdoptionRequest;
