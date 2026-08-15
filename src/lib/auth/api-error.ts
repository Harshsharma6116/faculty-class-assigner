// ============================================================================
// Custom API Error class and handler
// Used across all API routes for consistent error responses
// ============================================================================

/**
 * Custom error class for API routes.
 * Carries an HTTP status code alongside the error message.
 */
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Converts an unknown error into a well-formed JSON Response.
 * - Known ApiError → returns the status code and message from the error.
 * - Unknown error  → logs to console and returns a generic 500.
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  console.error('Unexpected error:', error);
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
