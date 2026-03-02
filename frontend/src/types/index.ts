export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner";
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Stall {
  _id: string;
  ownerId: string;
  stallName: string;
  description?: string;
  logo?: string;
  contact?: string;
  address?: string;
  businessHours?: string;
  createdAt: string;
}

export interface MenuItem {
  _id: string;
  stallId: string;
  itemName: string;
  description?: string;
  price: number;
  costPrice?: number;
  image?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface Combo {
  _id: string;
  stallId: string;
  comboName: string;
  items: Array<{
    _id: string;
    itemName?: string;
    price?: number;
  }>;
  originalPrice: number;
  comboPrice: number;
  discountPercentage: number;
  createdAt: string;
}

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";

export interface OrderItem {
  itemId: string;
  itemType: "menu" | "combo";
  name: string;
  price: number;
  quantity: number;
  cost: number;
}

export interface Order {
  _id: string;
  stallId: string;
  orderToken: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  totalCost: number;
  status: OrderStatus;
  createdAt: string;
}

export interface DashboardSummary {
  today: {
    totalOrdersToday: number;
    cancelledOrdersToday: number;
    totalRevenueToday: number;
    totalProfitToday: number;
  };
  monthlyRevenue: Array<{
    month: string;
    cancelledOrders: number;
    totalOrders: number;
    revenue: number;
    profit: number;
  }>;
  topSellingItems: Array<{
    _id: string;
    quantitySold: number;
    sales: number;
  }>;
  comboSales: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
}
