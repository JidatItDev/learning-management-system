import { SeatsDiscount } from "../../models/discounts/discounts";

export interface DiscountFilters {
  bundleId?: string;
  includeInactive?: boolean; // New filter to include inactive discounts
  page?: number;
  limit?: number;
}

export interface CreateDiscountData {
  bundleIds?: string[] | null; // Still accept array for backward compatibility in API
  percentage?: number | null;
  seats?: SeatsDiscount | null;
  expiryDate?: Date | null;
}

export interface UpdateDiscountData {
  bundleId?: string | null;
  percentage?: number | null;
  seats?: SeatsDiscount | null;
  expiryDate?: Date | null;
  isActive?: boolean;
}