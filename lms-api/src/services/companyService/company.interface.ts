export interface CreateCompanyData {
  name: string;
  address?: string;
  vatNumber: string;
}

export interface UpdateCompanyData {
  name?: string;
  address?: string;
  vatNumber?: string;
}

export interface CompanyFilters {
  name?: string;
  address?: string;
  vatNumber?: string;
  createdBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}
