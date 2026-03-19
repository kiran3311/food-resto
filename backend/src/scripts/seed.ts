import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDb } from "../config/db";
import { User, IUserRole } from "../models/User";
import { Stall } from "../models/Stall";
import { MenuItem } from "../models/MenuItem";
import { Combo } from "../models/Combo";
import { Order } from "../models/Order";

dotenv.config();

const seed = async (): Promise<void> => {
  await connectDb();

  await Promise.all([
    User.deleteMany({}),
    Stall.deleteMany({}),
    MenuItem.deleteMany({}),
    Combo.deleteMany({}),
    Order.deleteMany({})
  ]);

  const owner = await User.create({
    name: "Demo Owner",
    email: "owner@example.com",
    password: "Password@123",
    role: IUserRole.OWNER
  });

  const stall = await Stall.create({
    ownerId: owner.id,
    stallName: "Urban Spice Stall",
    description: "Modern fast-casual food counter",
    logo: "https://picsum.photos/seed/urban-spice-logo/240/240",
    contact: "+1 555-111-2222",
    address: "12 Market Street, Downtown",
    businessHours: "10:00 AM - 10:00 PM"
  });

  const [burger, fries, cola] = await MenuItem.create([
    {
      stallId: stall.id,
      itemName: "Classic Burger",
      description: "Grilled patty with lettuce and sauce",
      price: 8.5,
      costPrice: 4,
      currency: "USD",
      image: "https://picsum.photos/seed/classic-burger/800/600",
      category: "Main",
      isAvailable: true
    },
    {
      stallId: stall.id,
      itemName: "Crispy Fries",
      description: "Golden fries",
      price: 3.5,
      costPrice: 1.2,
      currency: "USD",
      image: "https://picsum.photos/seed/crispy-fries/800/600",
      category: "Sides",
      isAvailable: true
    },
    {
      stallId: stall.id,
      itemName: "Cold Cola",
      description: "Chilled soft drink",
      price: 2,
      costPrice: 0.7,
      currency: "USD",
      image: "https://picsum.photos/seed/cold-cola/800/600",
      category: "Drinks",
      isAvailable: true
    }
  ]);

  const combo = await Combo.create({
    stallId: stall.id,
    comboName: "Burger Meal Combo",
    items: [burger.id, fries.id, cola.id],
    originalPrice: 14,
    comboPrice: 11.5,
    currency: "USD",
    discountPercentage: 17.86
  });

  await Order.create([
    {
      stallId: stall.id,
      orderToken: "TOK-20260227-001",
      customerName: "Sample Customer",
      items: [
        {
          itemId: combo.id,
          itemType: "combo",
          name: combo.comboName,
          price: combo.comboPrice,
          quantity: 1,
          cost: 5.9,
          currency: "USD"
        }
      ],
      totalAmount: 11.5,
      totalCost: 5.9,
      currency: "USD",
      status: "Completed"
    },
    {
      stallId: stall.id,
      orderToken: "TOK-20260227-002",
      customerName: "Cancelled Sample",
      items: [
        {
          itemId: burger.id,
          itemType: "menu",
          name: burger.itemName,
          price: burger.price,
          quantity: 1,
          cost: burger.costPrice ?? 0,
          currency: "USD"
        }
      ],
      totalAmount: burger.price,
      totalCost: burger.costPrice ?? 0,
      currency: "USD",
      status: "Cancelled"
    }
  ]);

  // eslint-disable-next-line no-console
  console.log("Seed data inserted");
};

seed()
  .then(async () => {
    await mongoose.connection.close();
  })
  .catch(async (error: unknown) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed", error);
    await mongoose.connection.close();
    process.exit(1);
  });
