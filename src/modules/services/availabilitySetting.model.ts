import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAvailabilitySetting extends Document {
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySettingSchema = new Schema<IAvailabilitySetting>(
  {
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    slotMinutes: { type: Number, required: true, min: 5, max: 240 },
  },
  { timestamps: true }
);

const AvailabilitySetting: Model<IAvailabilitySetting> = mongoose.model<IAvailabilitySetting>(
  "AvailabilitySetting",
  availabilitySettingSchema
);

export default AvailabilitySetting;
