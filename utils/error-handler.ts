export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleServiceError = (error: any, operation: string): never => {
  if (error instanceof AppError) {
    throw error;
  }

  console.error(`❌ ${operation} failed:`, error);
  
  // Map common Supabase errors
  if (error.code === 'PGRST116') {
    throw new AppError('Record not found', 'NOT_FOUND', 404);
  }
  
  if (error.code === '23505') {
    throw new AppError('Record already exists', 'DUPLICATE', 409);
  }

  throw new AppError(
    error.message || `${operation} failed`,
    'UNKNOWN_ERROR'
  );
};
