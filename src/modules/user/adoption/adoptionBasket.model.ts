import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAdoptionBasketItem {
  listing: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IAdoptionBasket extends Document {
  user: mongoose.Types.ObjectId;
  items: IAdoptionBasketItem[];
  createdAt: Date;
  updatedAt: Date;
}

const basketItemSchema = new Schema<IAdoptionBasketItem>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "AdoptionListing", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const adoptionBasketSchema = new Schema<IAdoptionBasket>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [basketItemSchema], default: [] },
  },
  { timestamps: true }
);

const AdoptionBasket: Model<IAdoptionBasket> = mongoose.model<IAdoptionBasket>(
  "AdoptionBasket",
  adoptionBasketSchema
);

export default AdoptionBasket;
