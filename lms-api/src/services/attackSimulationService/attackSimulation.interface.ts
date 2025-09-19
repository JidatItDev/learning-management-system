/**
 * Interface for attack simulation creation data
 */
export interface CreateAttackSimulationData {
  courseId: string;
  name: string;
  template: string;
  url: string;
  page: string;
  smtp: string;
  createdBy: string;
}

/**
 * Interface for attack simulation update data
 */
export interface UpdateAttackSimulationData {
  name?: string;
  template?: string;
  url?: string;
  page?: string;
  smtp?: string;
}

/**
 * Interface for attack simulation filtering options
 */
export interface AttackSimulationFilters {
  courseId?: string;
  name?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}
