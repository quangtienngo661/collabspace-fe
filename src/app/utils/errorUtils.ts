export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  
  if (msg.includes("Forbidden") || msg.includes("403")) {
    return "You don't have permission to do this.";
  }
  if (msg.includes("Not Found") || msg.includes("404")) {
    return "The item was not found.";
  }
  if (msg.includes("Conflict") || msg.includes("409")) {
    return "This action conflicts with existing data.";
  }
  if (msg.includes("Validation") || msg.includes("400")) {
    return "Please check your input and try again.";
  }
  
  return msg;
}
