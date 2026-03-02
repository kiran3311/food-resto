import { api } from "./api";
import { Order, OrderStatus, Stall } from "../types";

interface OrderLinePayload {
  itemType: "menu" | "combo";
  entityId: string;
  quantity: number;
}

export const orderService = {
  async list(params: { page?: number; limit?: number; status?: OrderStatus } = {}): Promise<{ orders: Order[]; pagination: { total: number; page: number; totalPages: number } }> {
    const response = await api.get("/orders", { params });
    return response.data;
  },

  async create(payload: { customerName?: string; lines: OrderLinePayload[] }): Promise<Order> {
    const response = await api.post<{ order: Order }>("/orders", payload);
    return response.data.order;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await api.patch<{ order: Order }>(`/orders/${id}/status`, { status });
    return response.data.order;
  },

  async getById(id: string): Promise<{ order: Order; stall: Stall }> {
    const response = await api.get<{ order: Order; stall: Stall }>(`/orders/${id}`);
    return response.data;
  }
};