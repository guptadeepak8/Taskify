export interface AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;
}

export function createAppError(
  statusCode: number,
  code: string,
  message: string,
  details?: any
): AppError {
  const error = new Error(message) as AppError;
  error.name = 'AppError';
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AppError' &&
    'statusCode' in error &&
    'code' in error
  );
}
