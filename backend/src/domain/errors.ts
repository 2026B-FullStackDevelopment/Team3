export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class NotFoundError extends DomainError {
  readonly statusCode = 404;
}
export class ConflictError extends DomainError {
  readonly statusCode = 409;
}
export class ForbiddenError extends DomainError {
  readonly statusCode = 403;
}
export class ValidationError extends DomainError {
  readonly statusCode = 400;
}
