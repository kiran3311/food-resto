import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { Order } from "../models/Order";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { getOwnerStall } from "../utils/getOwnerStall";

const getDayRange = (): { start: Date; end: Date } => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const getDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const stall = await getOwnerStall(req.user.id);
  const stallObjectId = new Types.ObjectId(stall.id);
  const { start, end } = getDayRange();

  const [todayMetrics, monthlyRevenue, topItems, comboSales] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          stallId: stallObjectId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalOrdersToday: { $sum: 1 },
          cancelledOrdersToday: {
            $sum: {
              $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0]
            }
          },
          totalRevenueToday: {
            $sum: {
              $cond: [{ $ne: ["$status", "Cancelled"] }, "$totalAmount", 0]
            }
          },
          totalProfitToday: {
            $sum: {
              $cond: [
                { $ne: ["$status", "Cancelled"] },
                { $subtract: ["$totalAmount", "$totalCost"] },
                0
              ]
            }
          }
        }
      }
    ]),
    Order.aggregate([
      {
        $match: {
          stallId: stallObjectId,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0]
            }
          },
          totalOrders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$status", "Cancelled"] }, "$totalAmount", 0]
            }
          },
          profit: {
            $sum: {
              $cond: [
                { $ne: ["$status", "Cancelled"] },
                { $subtract: ["$totalAmount", "$totalCost"] },
                0
              ]
            }
          }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      }
    ]),
    Order.aggregate([
      {
        $match: {
          stallId: stallObjectId,
          status: { $ne: "Cancelled" }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantitySold: { $sum: "$items.quantity" },
          sales: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"]
            }
          }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 }
    ]),
    Order.aggregate([
      {
        $match: {
          stallId: stallObjectId,
          status: { $ne: "Cancelled" }
        }
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.itemType": "combo"
        }
      },
      {
        $group: {
          _id: "$items.name",
          count: { $sum: "$items.quantity" },
          revenue: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);

  const today = todayMetrics[0] ?? {
    totalOrdersToday: 0,
    cancelledOrdersToday: 0,
    totalRevenueToday: 0,
    totalProfitToday: 0
  };

  const monthly = monthlyRevenue.map((row) => ({
    month: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
    cancelledOrders: row.cancelledOrders,
    totalOrders: row.totalOrders,
    revenue: Number(row.revenue.toFixed(2)),
    profit: Number(row.profit.toFixed(2))
  }));

  res.status(StatusCodes.OK).json({
    today: {
      totalOrdersToday: today.totalOrdersToday,
      cancelledOrdersToday: today.cancelledOrdersToday,
      totalRevenueToday: Number(today.totalRevenueToday.toFixed(2)),
      totalProfitToday: Number(today.totalProfitToday.toFixed(2))
    },
    monthlyRevenue: monthly,
    topSellingItems: topItems,
    comboSales
  });
});
