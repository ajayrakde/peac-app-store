export function generateJobCode(): string {
  const timestampPart = Date.now().toString().slice(-6);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JOB-${timestampPart}-${randomPart}`;
}
