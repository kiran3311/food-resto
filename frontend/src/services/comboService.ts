import { api } from "./api";
import { Combo } from "../types";

interface ComboPayload {
  comboName: string;
  items: string[];
  comboPrice: number;
}

export const comboService = {
  async list(): Promise<Combo[]> {
    const response = await api.get<{ combos: Combo[] }>("/combos");
    return response.data.combos;
  },

  async create(payload: ComboPayload): Promise<Combo> {
    const response = await api.post<{ combo: Combo }>("/combos", payload);
    return response.data.combo;
  },

  async update(id: string, payload: ComboPayload): Promise<Combo> {
    const response = await api.put<{ combo: Combo }>(`/combos/${id}`, payload);
    return response.data.combo;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/combos/${id}`);
  }
};