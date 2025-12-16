import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProviderReview extends Document {
  provider: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const providerReviewSchema = new Schema<IProviderReview>(
  {
    provider: { type: Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

// Prevent duplicate reviews from the same user for a provider
providerReviewSchema.index({ provider: 1, user: 1 }, { unique: true });

const ProviderReview: Model<IProviderReview> = mongoose.model<IProviderReview>(
  "ProviderReview",
  providerReviewSchema
);

export default ProviderReview;
