export async function handleRateLimit(retryCount: number): Promise<void> {
  const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
  console.warn(`Rate limit exceeded. Retrying in ${backoffTime / 1000} seconds...`);
  await new Promise((resolve) => setTimeout(resolve, backoffTime));
}
