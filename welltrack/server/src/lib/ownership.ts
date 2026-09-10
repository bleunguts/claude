import { NotFoundError } from "./errors.js";

/**
 * Returns `record` if it exists and belongs to `userId`, otherwise throws NotFoundError.
 * Using 404 (not 403) on mismatch avoids confirming the existence of other users' records.
 */
export function requireOwned<T extends { userId: string }>(
  record: T | null | undefined,
  userId: string,
): T {
  if (!record || record.userId !== userId) {
    throw new NotFoundError("Resource not found");
  }
  return record;
}
