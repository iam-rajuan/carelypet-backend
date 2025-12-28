import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITaxSetting extends Document {
  percent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taxSettingSchema = new Schema<ITaxSetting>(
  {
    percent: { type: Number, required: true, min: 0, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

taxSettingSchema.index({ isActive: 1, createdAt: -1 });

const TaxSetting: Model<ITaxSetting> = mongoose.model<ITaxSetting>(
  "TaxSetting",
  taxSettingSchema
);

export default TaxSetting;
