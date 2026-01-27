import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITermsAndConditions extends Document {
  type: "terms";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const termsSchema = new Schema<ITermsAndConditions>(
  {
    type: { type: String, enum: ["terms"], default: "terms" },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

termsSchema.index({ type: 1 }, { unique: true });

const TermsAndConditions: Model<ITermsAndConditions> = mongoose.model<ITermsAndConditions>(
  "TermsAndConditions",
  termsSchema
);

export default TermsAndConditions;
