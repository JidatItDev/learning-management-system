export interface BundlePurchaseFilters {
  bundleId?: string;
  purchasedBy?: string;
  discountId?: string;
  page?: number;
  limit?: number;
}

export interface CreateBundlePurchaseData {
  bundleId: string;
  seatsPurchased: number;
  discountId?: string | null;
}

export interface UpdateBundlePurchaseData {
  seatsPurchased?: number;
  discountId?: string | null;
}