import { Document, Schema, Types, model } from "mongoose";

export interface IOrderCounter extends Document {
  stallId: Types.ObjectId;
  dateKey: string;
  seq: number;
}

const orderCounterSchema = new Schema<IOrderCounter>(
  {
    stallId: {
      type: Schema.Types.ObjectId,
      ref: "Stall",
      required: true
    },
    dateKey: {
      type: String,
      required: true
    },
    seq: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

orderCounterSchema.index({ stallId: 1, dateKey: 1 }, { unique: true });

export const OrderCounter = model<IOrderCounter>("OrderCounter", orderCounterSchema);
