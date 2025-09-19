import { IEmailTemplate } from "../../types/models";

export interface EmailTemplateFilters {
  name?: string;
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateEmailTemplateData {
  name: string;
  type: string;
  subject: string;
  body: string;
  isActive?: boolean;
}

export interface UpdateEmailTemplateData {
  subject?: string;
  body?: string;
}

export interface EmailTemplateQueryResult {
  templates: IEmailTemplate[];
  total: number;
}

export interface TemplateRenderData {
  subject: string;
  body: string;
}