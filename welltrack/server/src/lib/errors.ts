export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(message, 409, code);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code = "UNAUTHORIZED") {
    super(message, 401, code);
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = "BAD_REQUEST") {
    super(message, 400, code);
    this.name = "BadRequestError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
}
