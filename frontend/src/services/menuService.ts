import { api } from "./api";
import { MenuItem } from "../types";

interface MenuListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isAvailable?: boolean;
}

export const menuService = {
  async list(params: MenuListParams = {}): Promise<{ items: MenuItem[]; pagination: { total: number; page: number; totalPages: number } }> {
    const response = await api.get("/menu", { params });
    return response.data;
  },

  async create(payload: FormData): Promise<MenuItem> {
    const response = await api.post<{ menuItem: MenuItem }>("/menu", payload, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data.menuItem;
  },

  async update(id: string, payload: FormData): Promise<MenuItem> {
    const response = await api.put<{ menuItem: MenuItem }>(`/menu/${id}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data.menuItem;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/menu/${id}`);
  }
};