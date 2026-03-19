import { Document, Schema, Types, model } from "mongoose";

export interface IOrderItem {
  itemId: Types.ObjectId;
  itemType: "menu" | "combo";
  name: string;
  price: number;
  quantity: number;
  cost: number;
  currency: "USD" | "INR" | "EUR" | "GBP";
}

export interface IOrder extends Document {
  stallId: Types.ObjectId;
  orderToken: string;
  customerName: string;
  items: IOrderItem[];
  totalAmount: number;
  totalCost: number;
  currency: "USD" | "INR" | "EUR" | "GBP";
  status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    itemType: {
      type: String,
      enum: ["menu", "combo"],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      enum: ["USD", "INR", "EUR", "GBP"],
      required: true,
      default: "USD"
    }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    stallId: {
      type: Schema.Types.ObjectId,
      ref: "Stall",
      required: true,
      index: true
    },
    orderToken: {
      type: String,
      required: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value: IOrderItem[]) => value.length > 0,
        message: "At least one item is required"
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      enum: ["USD", "INR", "EUR", "GBP"],
      required: true,
      default: "USD"
    },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"],
      default: "Pending",
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

orderSchema.index({ stallId: 1, createdAt: -1 });
orderSchema.index({ stallId: 1, orderToken: 1 }, { unique: true });

export const Order = model<IOrder>("Order", orderSchema);
