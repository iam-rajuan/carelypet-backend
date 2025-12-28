import mongoose, { Document, Model, Schema } from "mongoose";

export type ServiceType = "vet" | "grooming" | "training" | "walking";

export interface IServiceCatalog extends Document {
  name: string;
  type: ServiceType;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceCatalogSchema = new Schema<IServiceCatalog>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["vet", "grooming", "training", "walking"],
      required: true,
      unique: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ServiceCatalog: Model<IServiceCatalog> = mongoose.model<IServiceCatalog>(
  "ServiceCatalog",
  serviceCatalogSchema
);

export default ServiceCatalog;
