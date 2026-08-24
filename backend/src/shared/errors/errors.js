/**
 * Plain-JS port of domain/errors.ts, kept in sync by hand.
 * Exists so JS-side layers (e.g. services) can throw/catch the same typed
 * errors as the TS side without importing a .ts file, which plain
 * `node --test` (used by the repository tests) can't resolve.
 */
export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  statusCode = 404;
}

export class ConflictError extends DomainError {
  statusCode = 409;
}

export class ForbiddenError extends DomainError {
  statusCode = 403;
}

export class UnauthorizedError extends DomainError {
  statusCode = 401;
}

export class ValidationError extends DomainError {
  statusCode = 400;
}

export class NotImplementedError extends DomainError {
  statusCode = 501;
}
