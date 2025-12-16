import mongoose, { Schema, Document, Model } from "mongoose";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface IAppointment extends Document {
  provider: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    provider: { type: Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: {
      type: Date,
      required: true,
    //   validate: {
    //     validator(this: IAppointment, value: Date) {
    //       return this.startTime < value;
    //     },
    //     message: "endTime must be after startTime",
    //   },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ provider: 1, startTime: 1, endTime: 1 });
appointmentSchema.index({ customer: 1, startTime: -1 });

const Appointment: Model<IAppointment> = mongoose.model<IAppointment>(
  "Appointment",
  appointmentSchema
);

export default Appointment;
