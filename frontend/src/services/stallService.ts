import { api } from "./api";
import { Stall } from "../types";

export const stallService = {
  async getMyStall(): Promise<Stall> {
    const response = await api.get<{ stall: Stall }>("/stall/me");
    return response.data.stall;
  },

  async upsert(payload: FormData): Promise<Stall> {
    const response = await api.post<{ stall: Stall }>("/stall/me", payload, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data.stall;
  }
};