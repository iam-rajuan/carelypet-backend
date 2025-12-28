import mongoose, { Document, Model, Schema } from "mongoose";
import { ServiceType } from "./serviceCatalog.model";

export type BookingStatus = "pending" | "completed";
export type PaymentStatus = "paid" | "unpaid";
export type ReminderType = "none" | "day_before" | "week_before";

export interface IServiceBookingItem {
  service: mongoose.Types.ObjectId;
  pet: mongoose.Types.ObjectId;
  serviceName: string;
  serviceType: ServiceType;
  petName: string;
  petType: string;
  petBreed?: string;
  petAge?: number | null;
  unitPrice: number;
}

export interface IServiceBooking extends Document {
  customer: mongoose.Types.ObjectId;
  provider?: mongoose.Types.ObjectId | null;
  pets: mongoose.Types.ObjectId[];
  services: mongoose.Types.ObjectId[];
  items: IServiceBookingItem[];
  scheduledAt: Date;
  reminderType: ReminderType;
  reminderSentAt?: Date | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string | null;
  paymentReceiptUrl?: string | null;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  currency: string;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bookingItemSchema = new Schema<IServiceBookingItem>(
  {
    service: { type: Schema.Types.ObjectId, ref: "ServiceCatalog", required: true },
    pet: { type: Schema.Types.ObjectId, ref: "Pet", required: true },
    serviceName: { type: String, required: true, trim: true },
    serviceType: {
      type: String,
      enum: ["vet", "grooming", "training", "walking"],
      required: true,
    },
    petName: { type: String, required: true, trim: true },
    petType: { type: String, required: true, trim: true },
    petBreed: { type: String, default: "" },
    petAge: { type: Number, default: null },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const serviceBookingSchema = new Schema<IServiceBooking>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: Schema.Types.ObjectId, ref: "ServiceProvider", default: null },
    pets: [{ type: Schema.Types.ObjectId, ref: "Pet", required: true }],
    services: [{ type: Schema.Types.ObjectId, ref: "ServiceCatalog", required: true }],
    items: { type: [bookingItemSchema], default: [] },
    scheduledAt: { type: Date, required: true },
    reminderType: {
      type: String,
      enum: ["none", "day_before", "week_before"],
      default: "none",
    },
    reminderSentAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    paymentIntentId: { type: String, default: null },
    paymentReceiptUrl: { type: String, default: null },
    subtotal: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, required: true, min: 0, max: 100 },
    taxAmount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

serviceBookingSchema.index({ status: 1, createdAt: -1 });
serviceBookingSchema.index({ customer: 1, createdAt: -1 });

const ServiceBooking: Model<IServiceBooking> = mongoose.model<IServiceBooking>(
  "ServiceBooking",
  serviceBookingSchema
);

export default ServiceBooking;
