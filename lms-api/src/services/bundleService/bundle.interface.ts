import { BundleType } from '../../models/bundles/bundles';

export interface BundleFilters {
  title?: string;
  category?: string;
  bundleType?: BundleType;
  courseId?: string;
  page?: number;
  limit?: number;
}

export interface CreateBundleData {
  title: string;
  description?: string;
  category: string;
  bundleType: BundleType;
  seatPrice: number;
  courseIds: string[];
}

export interface UpdateBundleData {
  title?: string;
  description?: string;
  category?: string;
  bundleType?: BundleType;
  seatPrice?: number;
  courseIds?: string[];
}
