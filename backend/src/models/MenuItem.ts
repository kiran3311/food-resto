import { Document, Schema, Types, model } from "mongoose";

export interface IMenuItem extends Document {
  stallId: Types.ObjectId;
  itemName: string;
  description?: string;
  price: number;
  costPrice?: number;
  currency: "USD" | "INR" | "EUR" | "GBP";
  image?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    stallId: {
      type: Schema.Types.ObjectId,
      ref: "Stall",
      required: true,
      index: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      enum: ["USD", "INR", "EUR", "GBP"],
      default: "USD"
    },
    image: {
      type: String
    },
    category: {
      type: String,
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

export const MenuItem = model<IMenuItem>("MenuItem", menuItemSchema);
