
/**
 * Interface for course lesson progress creation data
 */
export interface CreateCourseLessonProgressData {
  userId: string;
  lessonId: string;
  isCompleted?: boolean;
}

/**
 * Interface for course lesson progress update data
 */
export interface UpdateCourseLessonProgressData {
  isCompleted?: boolean;
}

/**
 * Interface for course lesson progress filtering options
 */
export interface CourseLessonProgressFilters {
  userId?: string;
  lessonId?: string;
  courseId?: string;
  isCompleted?: boolean;
  page?: number;
  limit?: number;
}
