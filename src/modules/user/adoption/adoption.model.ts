import mongoose, { Document, Model, Schema } from "mongoose";

export type AdoptionStatus = "available" | "pending" | "adopted";
export type HealthRecordType =
  | "vaccination"
  | "checkup"
  | "medication"
  | "tick_flea"
  | "surgery"
  | "dental"
  | "other";

export interface IAdoptionListing extends Document {
  pet?: mongoose.Types.ObjectId | null;
  owner?: mongoose.Types.ObjectId | null;
  createdByRole?: "user" | "admin";

  // Listing info
  title: string;
  description?: string;
  location: string; // simple text for now, can be expanded later

  status: AdoptionStatus;

  // Pet snapshot for fast filtering
  petName: string;
  species: string;
  breed?: string;
  age?: number;
  weightLbs?: number;
  gender?: "male" | "female";
  trained?: boolean;
  vaccinated?: boolean;
  neutered?: boolean;
  personality?: string[];
  aboutPet?: string;
  avatarUrl?: string | null;
  photos?: string[];

  // Rescue / contact info
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;

  shelterName?: string | null;
  shelterPhone?: string | null;

  healthRecords?: Array<{
    type: HealthRecordType;
    recordDetails: {
      recordName: string;
      batchLotNo?: string;
      otherInfo?: string;
    };
    veterinarian: {
      designation?: string;
      name?: string;
      clinicName?: string;
      licenseNo?: string;
      contact?: string;
    };
    vitalSigns: {
      weight?: string;
      temperature?: string;
      heartRate?: string;
      respiratory?: string;
      status?: "normal" | "high" | "low";
    };
    attachments?: string[];
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const adoptionListingSchema = new Schema<IAdoptionListing>(
  {
    pet: { type: Schema.Types.ObjectId, ref: "Pet", default: null },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdByRole: { type: String, enum: ["user", "admin"], default: "user" },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    location: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["available", "pending", "adopted"],
      default: "available",
      index: true,
    },

    petName: { type: String, required: true, trim: true },
    species: { type: String, required: true, trim: true },
    breed: { type: String, trim: true },
    age: { type: Number },
    weightLbs: { type: Number },
    gender: { type: String, enum: ["male", "female"], default: undefined },
    avatarUrl: { type: String, default: null },
    trained: { type: Boolean, default: false },
    vaccinated: { type: Boolean, default: false },
    neutered: { type: Boolean, default: false },
    personality: { type: [String], default: [] },
    aboutPet: { type: String, default: "" },
    photos: { type: [String], default: [] },

    contactName: { type: String, required: true, trim: true },
    contactEmail: { type: String, default: null },
    contactPhone: { type: String, default: null },

    shelterName: { type: String, default: null },
    shelterPhone: { type: String, default: null },

    healthRecords: {
      type: [
        {
          type: {
            type: String,
            enum: [
              "vaccination",
              "checkup",
              "medication",
              "tick_flea",
              "surgery",
              "dental",
              "other",
            ],
            required: true,
          },
          recordDetails: {
            recordName: { type: String, required: true },
            batchLotNo: { type: String, default: "" },
            otherInfo: { type: String, default: "" },
          },
          veterinarian: {
            designation: { type: String, default: "" },
            name: { type: String, default: "" },
            clinicName: { type: String, default: "" },
            licenseNo: { type: String, default: "" },
            contact: { type: String, default: "" },
          },
          vitalSigns: {
            weight: { type: String, default: "" },
            temperature: { type: String, default: "" },
            heartRate: { type: String, default: "" },
            respiratory: { type: String, default: "" },
            status: { type: String, enum: ["normal", "high", "low"], default: "normal" },
          },
          attachments: { type: [String], default: [] },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Index for the main filters
adoptionListingSchema.index({
  status: 1,
  species: 1,
  breed: 1,
  location: 1,
  createdAt: -1,
});

const AdoptionListing: Model<IAdoptionListing> = mongoose.model<IAdoptionListing>(
  "AdoptionListing",
  adoptionListingSchema
);

export default AdoptionListing;
