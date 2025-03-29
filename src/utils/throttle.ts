export function throttle<T>(fn: (...args: any[]) => Promise<T>, limit: number) {
  let lastCall = 0;

  return async (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall < limit) {
      throw new Error('Rate limit exceeded. Please wait before trying again.');
    }
    lastCall = now;
    return fn(...args);
  };
}
