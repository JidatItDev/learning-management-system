export interface GroupBundleFilters {
  groupId?: string;
  bundlePurchaseId?: string;
  page?: number;
  limit?: number;
}

export interface CreateGroupBundleData {
  groupId: string;
  bundlePurchaseId: string;
  seatsAllocated?: number;
}

export interface UpdateGroupBundleData {
  seatsAllocated?: number;
}