import mongoose, { Schema, Document, Model } from "mongoose";

export type ProviderCategory = "vet" | "grooming" | "walking" | "training";
export type VerificationStatus = "pending" | "verified" | "rejected";

export interface IWeeklyAvailability {
  day: number; // 0-6 (Sun-Sat)
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isActive: boolean;
}


export interface IServiceProvider extends Document {
  owner: mongoose.Types.ObjectId; // user who created/applied
  name: string;
  category: ProviderCategory;
  bio?: string;

  phone?: string;
  email?: string;
  address?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];      // [lng, lat]
  };

  verificationStatus: VerificationStatus;
  verifiedAt?: Date | null;
  verifiedBy?: mongoose.Types.ObjectId | null;

  availability: IWeeklyAvailability[];

  averageRating: number;
  ratingCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const weeklyAvailabilitySchema = new Schema<IWeeklyAvailability>(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const serviceProviderSchema = new Schema<IServiceProvider>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["vet", "grooming", "walking", "training"],
      required: true,
      index: true,
    },
    bio: { type: String, trim: true },

    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined },
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    availability: { type: [weeklyAvailabilitySchema], default: [] },

    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Geo index for nearby search
// serviceProviderSchema.index({ location: "2dsphere" });

const ServiceProvider: Model<IServiceProvider> = mongoose.model<IServiceProvider>(
  "ServiceProvider",
  serviceProviderSchema
);

export default ServiceProvider;

