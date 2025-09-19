/**
 * Interface for course creation data
 */
export interface CreateCourseData {
  title: string;
  description?: string;
  createdBy: string;
}

/**
 * Interface for course update data
 */
export interface UpdateCourseData {
  title?: string;
  description?: string;
}

/**
 * Interface for course filtering options
 */
export interface CourseFilters {
  title?: string;
  description?: string;
  createdBy?: string;
  bundleId?: string;
  page?: number;
  limit?: number;
}
