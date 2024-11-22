export class ConflictError<T> extends Error {
  constructor(conflictingElement: T) {
    super(`${conflictingElement} has a conflict`);
  }
}

export class InvalidError<T> extends Error {
  reason: string;

  constructor(invalidElement: T, reason: string) {
    super(`${invalidElement} is Invalid.`);
    this.reason = reason;
  }
}
