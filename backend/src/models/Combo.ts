import { Document, Schema, Types, model } from "mongoose";

export interface ICombo extends Document {
  stallId: Types.ObjectId;
  comboName: string;
  items: Types.ObjectId[];
  originalPrice: number;
  comboPrice: number;
  discountPercentage: number;
  createdAt: Date;
}

const comboSchema = new Schema<ICombo>(
  {
    stallId: {
      type: Schema.Types.ObjectId,
      ref: "Stall",
      required: true,
      index: true
    },
    comboName: {
      type: String,
      required: true,
      trim: true
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true
      }
    ],
    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    comboPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

export const Combo = model<ICombo>("Combo", comboSchema);
