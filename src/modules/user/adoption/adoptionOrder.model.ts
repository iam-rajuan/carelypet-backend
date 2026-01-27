import mongoose, { Document, Model, Schema } from "mongoose";

export type AdoptionOrderStatus = "pending" | "paid" | "failed";
export type AdoptionPaymentStatus = "unpaid" | "paid";

export interface IAdoptionOrderItem {
  listing: mongoose.Types.ObjectId;
  petName: string;
  petType: string;
  petBreed?: string;
  petAge?: number | null;
  petGender?: string;
  avatarUrl?: string | null;
  price: number;
}

export interface IAdoptionOrder extends Document {
  customer: mongoose.Types.ObjectId;
  items: IAdoptionOrderItem[];
  customerInfo: {
    name: string;
    address: string;
    phone: string;
  };
  status: AdoptionOrderStatus;
  paymentStatus: AdoptionPaymentStatus;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  processingFee: number;
  shippingFee: number;
  total: number;
  currency: string;
  paymentIntentId?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IAdoptionOrderItem>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "AdoptionListing", required: true },
    petName: { type: String, required: true },
    petType: { type: String, required: true },
    petBreed: { type: String, default: "" },
    petAge: { type: Number, default: null },
    petGender: { type: String, default: "" },
    avatarUrl: { type: String, default: null },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const adoptionOrderSchema = new Schema<IAdoptionOrder>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    customerInfo: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
    },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    subtotal: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    processingFee: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    paymentIntentId: { type: String, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const AdoptionOrder: Model<IAdoptionOrder> = mongoose.model<IAdoptionOrder>(
  "AdoptionOrder",
  adoptionOrderSchema
);

export default AdoptionOrder;
