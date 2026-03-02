import { Types } from "mongoose";
import { OrderCounter } from "../models/OrderCounter";

const padNumber = (num: number): string => num.toString().padStart(3, "0");

const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
};

export const generateOrderToken = async (
  stallId: Types.ObjectId,
  date = new Date()
): Promise<string> => {
  const dateKey = getDateKey(date);

  const counter = await OrderCounter.findOneAndUpdate(
    { stallId, dateKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `TOK-${dateKey}-${padNumber(counter.seq)}`;
};