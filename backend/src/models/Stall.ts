import { Document, Schema, Types, model } from "mongoose";

export interface IStall extends Document {
  ownerId: Types.ObjectId;
  stallName: string;
  description?: string;
  logo?: string;
  contact?: string;
  address?: string;
  businessHours?: string;
  createdAt: Date;
}

const stallSchema = new Schema<IStall>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    stallName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    logo: {
      type: String
    },
    contact: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    businessHours: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

export const Stall = model<IStall>("Stall", stallSchema);
