import { MenuItem } from "../types";

export type CurrencyCode = MenuItem["currency"];

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  INR: "Rs",
  EUR: "EUR",
  GBP: "GBP"
};

export const getCurrencySymbol = (currency: CurrencyCode): string =>
  CURRENCY_SYMBOLS[currency] ?? currency;

export const formatMoney = (value: number, currency: CurrencyCode): string =>
  `${getCurrencySymbol(currency)}${value.toFixed(2)}`;

export const getPrimaryCurrency = (
  currencies: Array<CurrencyCode | undefined>,
  fallback: CurrencyCode = "USD"
): CurrencyCode => currencies.find(Boolean) ?? fallback;
