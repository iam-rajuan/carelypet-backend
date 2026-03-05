import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPetBreed extends Document {
  name: string;
  slug: string;
  petType: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const petBreedSchema = new Schema<IPetBreed>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    petType: { type: Schema.Types.ObjectId, ref: "PetType", required: true, index: true },
  },
  { timestamps: true }
);

petBreedSchema.index({ petType: 1, slug: 1 }, { unique: true });

const PetBreed: Model<IPetBreed> = mongoose.model<IPetBreed>("PetBreed", petBreedSchema);

export default PetBreed;
