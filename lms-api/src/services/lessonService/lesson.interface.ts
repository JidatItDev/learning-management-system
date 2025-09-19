/**
 * Interface for lesson creation data
 */
export interface CreateLessonData {
  courseId: string;
  title: string;
  description?: string;
  videoName: string;
  videoUrl?: string;
  createdBy: string;
}

/**
 * Interface for lesson update data
 */
export interface UpdateLessonData {
  courseId?: string;
  title?: string;
  description?: string;
  videoName?: string;
  videoUrl?: string;
}

/**
 * Interface for lesson filtering options
 */
export interface LessonFilters {
  courseId?: string;
  title?: string;
  description?: string;
  videoName?: string;
  videoUrl?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}
