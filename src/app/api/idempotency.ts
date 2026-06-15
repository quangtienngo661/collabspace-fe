/** Client-generated idempotency key for BE dedupe (workspace create/invite, task create/assign). */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function idempotencyHeaders(): HeadersInit {
  return { "Idempotency-Key": newIdempotencyKey() };
}
